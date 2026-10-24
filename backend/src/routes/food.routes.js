const express = require('express');
const router = express.Router();
const { searchFoods, getFoodGroups, getFoodById } = require('../controllers/food.controller');

router.get('/groups', getFoodGroups);
router.get('/:foodId', getFoodById);
router.get('/', searchFoods);

module.exports = router;
