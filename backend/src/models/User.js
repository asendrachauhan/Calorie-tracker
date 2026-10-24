const mongoose = require('mongoose');
const { calculateBMR, calculateAge } = require('../services/calorie.service');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required.'],
    trim: true,
    minlength: [1, 'Name cannot be empty.'],
    maxlength: [100, 'Name cannot exceed 100 characters.']
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required.'],
    min: [1, 'Weight must be at least 1 kg.'],
    max: [500, 'Weight cannot exceed 500 kg.']
  },
  height: {
    type: Number,
    required: [true, 'Height is required.'],
    min: [30, 'Height must be at least 30 cm.'],
    max: [300, 'Height cannot exceed 300 cm.']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required.'],
    enum: {
      values: ['male', 'female'],
      message: 'Gender must be either "male" or "female".'
    },
    lowercase: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required.'],
    validate: {
      validator: function (v) {
        return v < new Date();
      },
      message: 'Date of birth must be in the past.'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for fast querying and sorting
userSchema.index({ createdAt: -1 });
userSchema.index({ name: 1 });

/**
 * Virtual: age - computed from dateOfBirth using calendar-based calculation.
 */
userSchema.virtual('age').get(function () {
  return calculateAge(this.dateOfBirth);
});

/**
 * Virtual: bmr - computed using the Harris-Benedict equation.
 */
userSchema.virtual('bmr').get(function () {
  const age = calculateAge(this.dateOfBirth);
  return calculateBMR(this.gender, this.weight, this.height, age);
});

/**
 * Method: Calculate BMR as of a specific date (for historical accuracy).
 */
userSchema.methods.getBMRAsOfDate = function (dateStr) {
  const age = calculateAge(this.dateOfBirth, dateStr);
  return calculateBMR(this.gender, this.weight, this.height, age);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
