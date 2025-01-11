const express = require("express");
const {
  getAllFocusSessions,
  createFocusSession,
  getUserSpecificFocusMetrics,
} = require("../controllers/focusSessionController");
const router = express.Router();

router.route("/")
.get(getAllFocusSessions)
.post(createFocusSession);

router.route("/:id").get(getUserSpecificFocusMetrics)


module.exports = router