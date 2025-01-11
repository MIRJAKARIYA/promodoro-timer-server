const express = require("express")
const { getUserSpecificCurrentAndLongestStreak } = require("../controllers/streakController")


const router = express.Router()

router.route("/:id").get(getUserSpecificCurrentAndLongestStreak)

module.exports = router