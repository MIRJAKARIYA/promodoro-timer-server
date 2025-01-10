const User = require("../models/user");

const getAllUsers = async (req, res) => {
  const users = await User.find({});
  return res.send({ success: true, data: users });
};

const createANewUser = async (req, res) => {
  const data = req.body;
  const { name, email, avatar_url } = data;
  if (!name || !email || !avatar_url) {
    return res.send({
      success: false,
      err: "Please provide all the necessary data",
    });
  }
  const result =await User.create({
    name,
    email,
    avatar_url
  })
  res.send({success:true,data:result})
};
module.exports = {
  getAllUsers,
  createANewUser
};
