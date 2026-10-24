const User = require('../models/User');
const DailyRecord = require('../models/DailyRecord');

/**
 * POST /api/users - Create a new user
 */
async function createUser(req, res, next) {
  try {
    const { name, weight, height, gender, dateOfBirth } = req.body;
    const user = new User({
      name: name.trim(),
      weight,
      height,
      gender: gender.toLowerCase(),
      dateOfBirth: new Date(dateOfBirth)
    });

    const savedUser = await user.save();
    res.status(201).json({ success: true, data: savedUser.toJSON() });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const details = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed.', code: 'VALIDATION_ERROR', details }
      });
    }
    next(err);
  }
}

/**
 * GET /api/users - List all users with age and BMR
 */
async function getUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users.map(u => u.toJSON()) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/:id - Get user details
 */
async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found.', code: 'NOT_FOUND' }
      });
    }
    res.json({ success: true, data: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/users/:id - Delete user and associated daily records
 */
async function deleteUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found.', code: 'NOT_FOUND' }
      });
    }

    // Cascade: remove all daily records for this user
    const deleteResult = await DailyRecord.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });

    res.json({
      success: true,
      data: {
        message: 'User deleted successfully.',
        deletedRecords: deleteResult.deletedCount
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createUser, getUsers, getUserById, deleteUser };
