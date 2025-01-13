const User = require("../models/user");

const getUser = async (req, res) => {
  const email = req.params.email
  const user = await User.find({email:email});
  return res.send({ success: true, data: user[0] });
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
  const result = await User.create({
    name,
    email,
    avatar_url
  })
  res.send({success:true,data:result})
};
module.exports = {
  getUser,
  createANewUser
};
