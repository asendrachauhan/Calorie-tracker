const Activity = require('../models/Activity');

const MAX_SEARCH_RESULTS = 100;

/**
 * GET /api/activities - Search activities with bounded results.
 * Query params: search (text), category (activity name), limit (max results)
 */
async function searchActivities(req, res, next) {
  try {
    const { search, category } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || MAX_SEARCH_RESULTS, 500);

    const filter = {};

    if (search && search.trim()) {
      filter.specificMotion = { $regex: search.trim(), $options: 'i' };
    }

    if (category && category.trim()) {
      filter.activityName = category.trim();
    }

    const activities = await Activity.find(filter)
      .select('activityId activityName specificMotion metValue')
      .limit(limit)
      .lean();

    res.json({ success: true, data: activities, count: activities.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/activities/categories - Get distinct activity category names
 */
async function getActivityCategories(req, res, next) {
  try {
    const categories = await Activity.distinct('activityName');
    categories.sort();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

module.exports = { searchActivities, getActivityCategories };
