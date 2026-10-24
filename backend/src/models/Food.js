const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  foodId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Food name is required.'],
    trim: true,
    index: true
  },
  foodGroup: {
    type: String,
    required: [true, 'Food group is required.'],
    trim: true,
    index: true
  },
  calories: {
    type: Number,
    required: [true, 'Calories value is required.'],
    min: [0, 'Calories cannot be negative.']
  },
  servingDescription: {
    type: String,
    default: '1 serving',
    trim: true
  },
  fat: {
    type: Number,
    default: 0,
    min: 0
  },
  protein: {
    type: Number,
    default: 0,
    min: 0
  },
  carbohydrate: {
    type: Number,
    default: 0,
    min: 0
  }
});

// Compound text index for efficient search across name and foodGroup
foodSchema.index({ name: 'text', foodGroup: 'text' });

const Food = mongoose.model('Food', foodSchema);

module.exports = Food;
