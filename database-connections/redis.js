const Redis = require("redis");
require("dotenv").config();

const redisClient = Redis.createClient({
    url: process.env.REDIS_URL
  });
async function connectToRedis() {
  return redisClient.connect();
}

module.exports = {
  connectToRedis,
};
