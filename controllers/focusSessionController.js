const focusSessions = require("../models/focus_session");

const getAllFocusSessions = async (req, res) => {
  console.log(getAllFocusSessions);
  try {
    const allFocusSessions = await focusSessions.find({});
    return res.send({ success: true, data: allFocusSessions });
  } catch (err) {
    return res.send({ success: false, message: err.message });
  }
};

const createFocusSession = async (req, res) => {
  const data = req.body;

  const { user_id, duration } = data;

  if (!user_id || !duration) {
    return res.send({ success: false, message: "All fields are required" });
  }
  try {
    const result = await focusSessions.create({
      user_id,
      duration,
    });
    res.send({ success: true, data: result });
  } catch (err) {
    res.send({ success: false, message: err.message });
  }
};

const getUserSpecificFocusMetrics = async (req, res) => {
  const id = req.params.id;
  try {
    const specificSessions = await focusSessions.aggregate([
        {
          $facet: {
            dailyMetrics: [
              {
                $match: {
                  user_id: id,
                  createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(24, 0, 0, 0)),
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  dailyNumberOfSessions: { $sum: 1 },
                  dailySummation: { $sum: "$duration" },
                },
              },
            ],
            weeklyMetrics: [
              {
                $match: {
                  user_id: id,
                  createdAt: {
                    $gte: (() => {
                      const today = new Date();
                      const dayOfWeek = today.getDay(); 
                      const daysSinceSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
                      const startOfWeek = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate() - daysSinceSaturday
                      );
                      startOfWeek.setHours(0, 0, 0, 0);
                      return startOfWeek;
                    })(),
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
          },
        },
        {
          $project: {
            dailyNumberOfSessions: { $arrayElemAt: ["$dailyMetrics.dailyNumberOfSessions", 0] },
            dailySummation: { $arrayElemAt: ["$dailyMetrics.dailySummation", 0] },
            weeklyNumberOfSessions: { $arrayElemAt: ["$weeklyMetrics.weeklyNumberOfSessions", 0] },
            weeklySummation: { $arrayElemAt: ["$weeklyMetrics.weeklySummation", 0] },
          },
        },
      ]);
      console.log(specificSessions)
      
    return res.send({ success: true, data: specificSessions });
  } catch (err) {
    return res.send({ success: false, message: err.message });
  }
};

//data will be like this {data:JSON.stringify(data),prevInserted:0,newInserted:0}
// prothome dekhte hobe hget (userId) kore je data ache kina
// na thakle prothom dhape hset (userId hobe key er maan) korte hobe {data:JSON.stringify(data),prevInserted:0,newInserted:0}
// data insert hoile newInserted er man ek baraite hobe {data:JSON.stringify(data),prevInserted:0,newInserted:1}
// hget kore dekhte hobe (newInserted>prevInserted) kina . jodi hoi tahole noton kore data fetch kore {data:JSON.stringify(newData),prevInserted:newInserted,newInserted:1} evabe korte hobe.karon multiple times data add hote pare.


module.exports = {
  getAllFocusSessions,
  createFocusSession,
  getUserSpecificFocusMetrics,
};
