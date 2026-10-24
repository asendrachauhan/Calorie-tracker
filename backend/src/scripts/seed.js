const crypto = require('crypto');
require('dotenv').config();
const path = require('path');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const Food = require('../models/Food');
const Activity = require('../models/Activity');

const DATA_DIR = path.resolve(__dirname, '../../../data-excels-for-db');

/**
 * Generate a deterministic activity ID from row data.
 */
function generateActivityId(activityName, specificMotion, metValue) {
  const input = `${activityName}||${specificMotion}||${metValue}`;
  const hash = crypto.createHash('md5').update(input).digest('hex').slice(0, 12);
  return `ACT-${hash}`;
}

async function seedFoods() {
  const filePath = path.join(DATA_DIR, 'food-calories.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const stats = { inserted: 0, updated: 0, skipped: 0, invalid: 0, total: rows.length };
  const operations = [];

  for (const row of rows) {
    const foodId = row['ID'];
    const name = row['name'];
    const foodGroup = row['Food Group'];
    const calories = row['Calories'];

    if (!foodId || !name || !foodGroup || calories === undefined || calories === null || typeof calories !== 'number' || calories < 0) {
      stats.invalid++;
      continue;
    }

    const foodData = {
      foodId,
      name: String(name).trim(),
      foodGroup: String(foodGroup).trim(),
      calories,
      servingDescription: row['Serving Description 1 (g)']
        ? String(row['Serving Description 1 (g)']).trim()
        : '1 serving',
      fat: typeof row['Fat (g)'] === 'number' ? row['Fat (g)'] : 0,
      protein: typeof row['Protein (g)'] === 'number' ? row['Protein (g)'] : 0,
      carbohydrate: typeof row['Carbohydrate (g)'] === 'number' ? row['Carbohydrate (g)'] : 0
    };

    operations.push({
      updateOne: {
        filter: { foodId },
        update: { $set: foodData },
        upsert: true
      }
    });
  }

  // Execute in batches of 500 with real-time progress updates
  const BATCH_SIZE = 500;
  const totalBatches = Math.ceil(operations.length / BATCH_SIZE);
  console.log(`[Seed] Processing ${operations.length} foods in ${totalBatches} batches (batch size: ${BATCH_SIZE})...`);

  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const batch = operations.slice(i, i + BATCH_SIZE);
    const result = await Food.bulkWrite(batch, { ordered: false });
    const inserted = result.upsertedCount || 0;
    const updated = result.modifiedCount || 0;
    stats.inserted += inserted;
    stats.updated += updated;

    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const processed = Math.min(i + BATCH_SIZE, operations.length);
    console.log(`[Seed] Foods: Batch ${batchNum}/${totalBatches} (${processed}/${operations.length}) -> +${inserted} inserted, ~${updated} updated`);
  }

  return stats;
}

async function seedActivities() {
  const filePath = path.join(DATA_DIR, 'MET-values.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const stats = { inserted: 0, updated: 0, skipped: 0, invalid: 0, total: rows.length };
  const operations = [];

  for (const row of rows) {
    const activityName = row['ACTIVITY'];
    const specificMotion = row['SPECIFIC MOTION'];
    const metValue = row['METs'];

    if (!activityName || !specificMotion || metValue === undefined || metValue === null || typeof metValue !== 'number' || metValue < 0) {
      stats.invalid++;
      continue;
    }

    const activityId = generateActivityId(activityName, specificMotion, metValue);
    const activityData = {
      activityId,
      activityName: String(activityName).trim(),
      specificMotion: String(specificMotion).trim(),
      metValue
    };

    operations.push({
      updateOne: {
        filter: { activityId },
        update: { $set: activityData },
        upsert: true
      }
    });
  }

  // Execute in batches of 500 with real-time progress updates
  const BATCH_SIZE = 500;
  const totalBatches = Math.ceil(operations.length / BATCH_SIZE);
  console.log(`[Seed] Processing ${operations.length} activities in ${totalBatches} batches (batch size: ${BATCH_SIZE})...`);

  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const batch = operations.slice(i, i + BATCH_SIZE);
    const result = await Activity.bulkWrite(batch, { ordered: false });
    const inserted = result.upsertedCount || 0;
    const updated = result.modifiedCount || 0;
    stats.inserted += inserted;
    stats.updated += updated;

    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const processed = Math.min(i + BATCH_SIZE, operations.length);
    console.log(`[Seed] Activities: Batch ${batchNum}/${totalBatches} (${processed}/${operations.length}) -> +${inserted} inserted, ~${updated} updated`);
  }

  return stats;
}

async function seed() {
  console.log('[Seed] Starting dataset import...');
  console.log(`[Seed] Data directory: ${DATA_DIR}`);

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[Seed] MONGODB_URI not set. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`[Seed] Connected to MongoDB.`);

  console.log('\n[Seed] Importing foods from food-calories.xlsx...');
  const foodStats = await seedFoods();
  console.log(`[Seed] Foods: ${JSON.stringify(foodStats)}`);

  console.log('\n[Seed] Importing activities from MET-values.xlsx...');
  const activityStats = await seedActivities();
  console.log(`[Seed] Activities: ${JSON.stringify(activityStats)}`);

  console.log('\n[Seed] Verifying collection counts...');
  const foodCount = await Food.countDocuments();
  const activityCount = await Activity.countDocuments();
  console.log(`[Seed] Total foods in database: ${foodCount}`);
  console.log(`[Seed] Total activities in database: ${activityCount}`);

  await mongoose.disconnect();
  console.log('\n[Seed] Done.');

  return { foodStats, activityStats, foodCount, activityCount };
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('[Seed] Fatal error:', err.message);
    process.exit(1);
  });
}

module.exports = { seed, seedFoods, seedActivities, generateActivityId };
