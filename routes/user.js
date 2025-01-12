const express = require("express");
const { createANewUser, getUser } = require("../controllers/userController");
const router = express.Router();

router.route("/")
.post(createANewUser)

router.route("/:email")
.get(getUser)

module.exports = router;
