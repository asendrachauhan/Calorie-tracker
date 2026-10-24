const Food = require('../models/Food');

const MAX_SEARCH_RESULTS = 100;

/**
 * GET /api/foods - Search foods with bounded results.
 * Query params: search (text), group (food group), limit (max results)
 */
async function searchFoods(req, res, next) {
  try {
    const { search, group } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || MAX_SEARCH_RESULTS, 500);

    const filter = {};

    if (search && search.trim()) {
      // Case-insensitive prefix/substring search
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    if (group && group.trim()) {
      filter.foodGroup = group.trim();
    }

    const foods = await Food.find(filter)
      .select('foodId name foodGroup calories servingDescription')
      .limit(limit)
      .lean();

    res.json({ success: true, data: foods, count: foods.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/foods/groups - Get distinct food group names
 */
async function getFoodGroups(req, res, next) {
  try {
    const groups = await Food.distinct('foodGroup');
    groups.sort();
    res.json({ success: true, data: groups });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/foods/:foodId - Get a single food by its source ID
 */
async function getFoodById(req, res, next) {
  try {
    const foodId = parseInt(req.params.foodId);
    if (isNaN(foodId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Food ID must be a number.', code: 'INVALID_ID' }
      });
    }

    const food = await Food.findOne({ foodId }).lean();
    if (!food) {
      return res.status(404).json({
        success: false,
        error: { message: 'Food not found.', code: 'NOT_FOUND' }
      });
    }

    res.json({ success: true, data: food });
  } catch (err) {
    next(err);
  }
}

module.exports = { searchFoods, getFoodGroups, getFoodById };
