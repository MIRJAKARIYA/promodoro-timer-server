const express = require("express");
const {
  getAllFocusSessions,
  createFocusSession,
  getUserSpecificFocusMetrics,
} = require("../controllers/focusSessionController");
const { rateLimiter } = require("../middlewares/apiRateLimiter");
const router = express.Router();

router.route("/")
.get(rateLimiter,getAllFocusSessions)
.post(rateLimiter,createFocusSession);

router.route("/:id").get(rateLimiter,getUserSpecificFocusMetrics)


module.exports = router