const express = require("express");
const { getAllUsers, createANewUser } = require("../controllers/userController");
const router = express.Router();

router.route("/")
.get(getAllUsers)
.post(createANewUser)

module.exports = router;
