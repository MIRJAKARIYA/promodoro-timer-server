const express = require("express");
const {
  getAllFocusSessions,
  createFocusSession,
  getUserSpecificFocusSessions,
} = require("../controllers/focusSessionController");
const router = express.Router();

router.route("/")
.get(getAllFocusSessions)
.post(createFocusSession);

router.route("/:id").get(getUserSpecificFocusSessions)

module.exports = router