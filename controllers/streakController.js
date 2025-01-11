const focusSessions = require("../models/focus_session");

const getUserSpecificCurrentAndLongestStreak = async (req, res) => {
  const id = req.params.id;
  try {
   
    const streaks = await focusSessions.aggregate([
      {
        $match: {
          user_id: id,
        },
      },
      {
        $project: {
          dateOnly: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }, 
          },
          createdAt: 1,
        },
      },
      {
        $group: {
          _id: "$dateOnly",
          createdAt: { $first: "$createdAt" }, 
        },
      },
      {
        $sort: { createdAt: 1 },
      },
      {
        $group: {
          _id: null,
          sessions: { $push: "$createdAt" },
        },
      },
      {
        $project: {
          sessions: 1,
        },
      },
      {
        $project: {
          streaks: {
            $reduce: {
              input: "$sessions", 
              initialValue: {
                currentStreak: 1,
                longestStreak: 1,
                prevDate: null,
                prevDateString: null, 
              },
              in: {
                currentStreak: {
                  $cond: [
                    
                    {
                      $and: [
                        {
                          $ne: ["$$value.prevDateString", null], 
                        },
                        {
                          $eq: [
                            {
                              $dateDiff: {
                                startDate: "$$value.prevDate", 
                                endDate: "$$this", 
                                unit: "day", 
                              },
                            },
                            1, 
                          ],
                        },
                      ],
                    },
                    { $add: ["$$value.currentStreak", 1] }, 
                    1, 
                  ],
                },
                longestStreak: {
                 
                  $cond: [
                    { $gt: ["$$value.currentStreak", "$$value.longestStreak"] },
                    "$$value.currentStreak", 
                    "$$value.longestStreak", 
                  ],
                },
                prevDate: "$$this", 
                prevDateString: {
                  $dateToString: { format: "%Y-%m-%d", date: "$$this" },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          currentStreak: "$streaks.currentStreak",
          longestStreak: "$streaks.longestStreak", 
        },
      },
    ]);

    if (streaks[0].currentStreak >= streaks[0].longestStreak) {
      return res.send({
        success: true,
        data: [{
            currentStreak:streaks[0].currentStreak,
            longestStreak:streaks[0].currentStreak
        }],
      });
    }
    else{
        return res.send({ success: true, data: streaks });
    }

    
  } catch (err) {
    return res.send({ success: false, message: err.message });
  }
};


//caching data
// key = todays date
// todays date jodi redis a paoa jai tar mane data agei cache kora ache.redis theke niye diye dao.module
// na paoa gele bojhte hobe next day ashche.taile todays date update kore noton data rakhte hobe.
module.exports = {
  getUserSpecificCurrentAndLongestStreak,
};