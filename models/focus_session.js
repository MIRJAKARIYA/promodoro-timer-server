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
    createdAt: { type: Date, default: Date.now }
  },
);

focusSessionSchema.pre('save', function (next) {
  if (this.isNew) {
    const date = new Date(this.createdAt);
    date.setHours(0, 0, 0, 0); // Set time to 00:00:00
    this.createdAt = date;
  }
  next();
});

const focusSessions = mongoose.model('focusSessions', focusSessionSchema);

module.exports = focusSessions;
