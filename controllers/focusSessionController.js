const focusSessions = require("../models/focus_session");
const Redis = require("redis");
require("dotenv").config();
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL
});
(async () => {
  await redisClient.connect();
})();

const getAllFocusSessions = async (req, res) => {

  try {
    const allFocusSessions = await focusSessions.find({});
    return res.send({ success: true, data: allFocusSessions });
  } catch (err) {
    return res.send({ success: false, message: err.message });
  }
};

const createFocusSession = async (req, res) => {
  const data = req.body;

  const { user_id, duration} = data;
  if (!user_id || !duration) {
    return res.send({ success: false, message: "All fields are required" });
  }
  try {
    const result = await focusSessions.create({
      user_id,
      duration,
    });
   await redisClient.SETEX(`dataInserted-${user_id}`,600,"1")

    res.send({ success: true, data: result });
  } catch (err) {
    res.send({ success: false, message: err.message });
  }
};

const getUserSpecificFocusMetrics = async (req, res) => {
  const id = req.params.id;
 
  const cachedFocusSessions = await redisClient.get(`focusSessions-${id}-${new Date().toLocaleDateString()}`)
  const isInserted = await redisClient.get(`dataInserted-${id}`)
  if(!isInserted && cachedFocusSessions){
    return res.send({success:true,data:JSON.parse(cachedFocusSessions)})
  }
  if(parseInt(isInserted)===0 && cachedFocusSessions){
    return res.send({success:true,data:JSON.parse(cachedFocusSessions)})
  }
  try {



    const specificSessions = await focusSessions.aggregate([
      {
        $facet: {
          weeklyMetrics: [
            {
              $match: {
                user_id: id, 
                createdAt: {
                  $gte: new Date(new Date().setDate(new Date().getDate() - 7)), 
                  $lt: new Date(new Date().setHours(24, 0, 0, 0)),
                },
              },
            },
            {
              $group: {
                _id: null,
                weeklyNumberOfSessions: { $sum: 1 },
                weeklySummation: { $sum: "$duration" },
              },
            },
          ],
          last8DaysMetrics: [
            {
              $match: {
                user_id: id,
                createdAt: {
                  $gte: new Date(new Date().setDate(new Date().getDate() - 7)), 
                  $lt: new Date(new Date().setHours(24, 0, 0, 0)),
                },
              },
            },
            {
              $group: {
                _id: {
                  date: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }, 
                  },
                },
                dayNumberOfSessions: { $sum: 1 },
                daySummation: { $sum: "$duration" },
              },
            },
            {
              $sort: { "_id.date": 1 }, 
            },
          ],
        },
      },
      {
        $project: {
          weeklyNumberOfSessions: { $arrayElemAt: ["$weeklyMetrics.weeklyNumberOfSessions", 0] },
          weeklySummation: { $arrayElemAt: ["$weeklyMetrics.weeklySummation", 0] },
          last8Days: {
            $map: {
              input: {
                $range: [0, 8], 
              },
              as: "dayOffset",
              in: {
                date: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: {
                      $dateSubtract: {
                        startDate: new Date(),
                        unit: "day",
                        amount: { $subtract: [7, "$$dayOffset"] }, 
                      },
                    },
                  },
                },
                dayNumberOfSessions: {
                  $ifNull: [
                    {
                      $let: {
                        vars: {
                          session: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$last8DaysMetrics",
                                  as: "metric",
                                  cond: {
                                    $eq: ["$$metric._id.date", {
                                      $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: {
                                          $dateSubtract: {
                                            startDate: new Date(),
                                            unit: "day",
                                            amount: { $subtract: [7, "$$dayOffset"] },
                                          },
                                        },
                                      },
                                    }],
                                  },
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: {
                          $ifNull: ["$$session.dayNumberOfSessions", 0],
                        },
                      },
                    },
                    0,
                  ],
                },
                daySummation: {
                  $ifNull: [
                    {
                      $let: {
                        vars: {
                          session: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$last8DaysMetrics",
                                  as: "metric",
                                  cond: {
                                    $eq: ["$$metric._id.date", {
                                      $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: {
                                          $dateSubtract: {
                                            startDate: new Date(),
                                            unit: "day",
                                            amount: { $subtract: [7, "$$dayOffset"] },
                                          },
                                        },
                                      },
                                    }],
                                  },
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: {
                          $ifNull: ["$$session.daySummation", 0],
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },
    ]);
    

    


    
    

    
      await redisClient.SETEX(`focusSessions-${id}-${new Date().toLocaleDateString()}`,600,JSON.stringify(specificSessions))
      await redisClient.SETEX(`dataInserted-${id}`,600,"0")
      
    return res.send({ success: true, data: specificSessions });
  } catch (err) {
    return res.send({ success: false, message: err.message });
  }
};


module.exports = {
  getAllFocusSessions,
  createFocusSession,
  getUserSpecificFocusMetrics,
};
