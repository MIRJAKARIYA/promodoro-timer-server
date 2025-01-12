const Redis = require("redis");
require("dotenv").config();
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL
});
const RATELIMIT_DURATION_IN_SECONDS =60 ;
const NUMBER_OF_REQUESTS_ALLOWED = 20;

// Initialize Redis connection
(async () => {
  await redisClient.connect();
})();

module.exports = {
  rateLimiter: async (req, res, next) => {
    const userId = req.headers.user_id;
    if (!userId) {
      return res.status(400).send({ success: false, message: "User ID is required" });
    }

    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const result = await redisClient.hGetAll(userId);

      if (!result || Object.keys(result).length === 0) {
        await redisClient.hSet(userId, {
            "createdAt": currentTime, "count": 1
        });
        await redisClient.expire(userId, RATELIMIT_DURATION_IN_SECONDS);
        return next();
      }

      const diff = currentTime - parseInt(result["createdAt"], 10);

      if (diff > RATELIMIT_DURATION_IN_SECONDS) {
        await redisClient.hSet(userId, {
            "createdAt": currentTime, "count": 1
        });
        await redisClient.expire(userId, RATELIMIT_DURATION_IN_SECONDS);
        return next();
      }

      if (parseInt(result["count"], 10) >= NUMBER_OF_REQUESTS_ALLOWED) {
        return res.status(429).send({
          success: false,
          message: "Too many requests.Wait a few moments and try again!",
        });
      }

      await redisClient.hSet(userId, {"count": parseInt(result["count"], 10) + 1});
      next();
    } catch (error) {
      console.error("Rate limiter error:", error);
      res.status(500).send({ success: false, message: "Internal server error" });
    }
  },
};
