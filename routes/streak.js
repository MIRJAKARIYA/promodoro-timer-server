const express = require("express")
const { getUserSpecificCurrentAndLongestStreak } = require("../controllers/streakController")
const { rateLimiter } = require("../middlewares/apiRateLimiter")


const router = express.Router()

router.route("/:id").get(rateLimiter,getUserSpecificCurrentAndLongestStreak)

module.exports = router