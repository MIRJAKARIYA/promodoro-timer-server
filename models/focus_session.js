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
    timestamps: {
        createdAt: true,
        updatedAt: false, // Disable the `updatedAt` field
      },
  }
);

const focusSessions = mongoose.model('focusSessions', focusSessionSchema);

module.exports = focusSessions;
