const mongoose = require('mongoose');
const focusSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: [true, 'user_id is required'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
    },
  },
  {
    timestamps: true,
  }
);

const focusSessions = mongoose.model('focusSessions', focusSessionSchema);

module.exports = focusSessions;
