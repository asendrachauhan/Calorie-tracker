const express = require('express');
const router = express.Router();
const { searchActivities, getActivityCategories } = require('../controllers/activity.controller');

router.get('/categories', getActivityCategories);
router.get('/', searchActivities);

module.exports = router;
