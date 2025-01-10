const { default: mongoose } = require("mongoose");
async function connectToMongodb() {
  return mongoose.connect(process.env.MONGODB_URL);
}

module.exports = {
  connectToMongodb,
};
