const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  activityId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  activityName: {
    type: String,
    required: [true, 'Activity name is required.'],
    trim: true,
    index: true
  },
  specificMotion: {
    type: String,
    required: [true, 'Specific motion is required.'],
    trim: true
  },
  metValue: {
    type: Number,
    required: [true, 'MET value is required.'],
    min: [0, 'MET value cannot be negative.']
  }
});

// Compound index for efficient category + text filtering
activitySchema.index({ activityName: 1, specificMotion: 1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
