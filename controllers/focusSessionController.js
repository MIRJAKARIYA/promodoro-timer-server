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
console.log("post api called",data)
  const { user_id, duration} = data;
  if (!user_id || !duration) {
    return res.send({ success: false, message: "All fields are required" });
  }
  try {
    const result = await focusSessions.create({
      user_id,
      duration,
    });
   await redisClient.SETEX(`dataInserted-${user_id}`,3600,"1")

    res.send({ success: true, data: result });
  } catch (err) {
    res.send({ success: false, message: err.message });
  }
};

const getUserSpecificFocusMetrics = async (req, res) => {
  const id = req.params.id;
  console.log(id)
  const cachedFocusSessions = await redisClient.get(`focusSessions-${id}-${new Date().toLocaleDateString()}`)
  const isInserted = await redisClient.get(`dataInserted-${id}`)
  if(!isInserted && cachedFocusSessions){
    return res.send({success:true,data:JSON.parse(cachedFocusSessions)})
  }
  if(parseInt(isInserted)===0 && cachedFocusSessions){
    return res.send({success:true,data:JSON.parse(cachedFocusSessions)})
  }
  try {

    //   {
    //     $facet: {
    //       dailyMetrics: [
    //         {
    //           $match: {
    //             user_id: id,
    //             createdAt: {
    //               $gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
    //               $lt: new Date(new Date().setHours(24, 0, 0, 0)), // Start of tomorrow
    //             },
    //           },
    //         },
    //         {
    //           $group: {
    //             _id: null,
    //             dailyNumberOfSessions: { $sum: 1 },
    //             dailySummation: { $sum: "$duration" },
    //           },
    //         },
    //       ],
    //       weeklyMetrics: [
    //         {
    //           $match: {
    //             user_id: id,
    //             createdAt: {
    //               $gte: (() => {
    //                 const today = new Date();
    //                 const startOfLast7Days = new Date(
    //                   today.getFullYear(),
    //                   today.getMonth(),
    //                   today.getDate() - 6 // Start 7 days ago, including today
    //                 );
    //                 startOfLast7Days.setHours(0, 0, 0, 0); // Start of the day 7 days ago
    //                 return startOfLast7Days;
    //               })(),
    //               $lt: new Date(new Date().setHours(24, 0, 0, 0)), // Start of tomorrow
    //             },
    //           },
    //         },
    //         {
    //           $group: {
    //             _id: null,
    //             weeklyNumberOfSessions: { $sum: 1 },
    //             weeklySummation: { $sum: "$duration" },
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $project: {
    //       dailyNumberOfSessions: { $arrayElemAt: ["$dailyMetrics.dailyNumberOfSessions", 0] },
    //       dailySummation: { $arrayElemAt: ["$dailyMetrics.dailySummation", 0] },
    //       weeklyNumberOfSessions: { $arrayElemAt: ["$weeklyMetrics.weeklyNumberOfSessions", 0] },
    //       weeklySummation: { $arrayElemAt: ["$weeklyMetrics.weeklySummation", 0] },
    //     },
    //   },
    // ]);




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
    

    


    
    

    
      await redisClient.SETEX(`focusSessions-${id}-${new Date().toLocaleDateString()}`,3600,JSON.stringify(specificSessions))
      await redisClient.SETEX(`dataInserted-${id}`,3600,"0")
      
    return res.send({ success: true, data: specificSessions });
  } catch (err) {
    return res.send({ success: false, message: err.message });
  }
};

//data will be like this {data:JSON.stringify(data),newData:0}
// prothome dekhte hobe hget (userId) kore je data ache kina
// na thakle prothom dhape hset (userId hobe key er maan) korte hobe {data:JSON.stringify(data),prevInserted:0,newInserted:0}
// data insert hoile newInserted er man ek baraite hobe {data:JSON.stringify(data),prevInserted:0,newInserted:1}
// hget kore dekhte hobe (newInserted>prevInserted) kina . jodi hoi tahole noton kore data fetch kore {data:JSON.stringify(newData),prevInserted:newInserted,newInserted:1} evabe korte hobe.karon multiple times data add hote pare.


module.exports = {
  getAllFocusSessions,
  createFocusSession,
  getUserSpecificFocusMetrics,
};
