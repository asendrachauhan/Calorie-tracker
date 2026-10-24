const { connectTestDB, closeTestDB, clearTestDB } = require('./test-db');
const Food = require('../src/models/Food');
const Activity = require('../src/models/Activity');
const { generateActivityId } = require('../src/scripts/seed');

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

describe('Seed Script - Deterministic Activity IDs', () => {
  it('generates the same ID for identical inputs', () => {
    const id1 = generateActivityId('Running', 'jogging, general', 7);
    const id2 = generateActivityId('Running', 'jogging, general', 7);
    expect(id1).toBe(id2);
  });

  it('generates different IDs for same activity with different MET values', () => {
    const id1 = generateActivityId('Running', 'jogging, general', 7);
    const id2 = generateActivityId('Running', 'jogging, general', 10);
    expect(id1).not.toBe(id2);
  });

  it('generates different IDs for different specific motions', () => {
    const id1 = generateActivityId('Running', 'jogging, general', 7);
    const id2 = generateActivityId('Running', 'running, 6 mph', 7);
    expect(id1).not.toBe(id2);
  });

  it('IDs always start with ACT- prefix', () => {
    const id = generateActivityId('Swimming', 'laps, vigorous', 10);
    expect(id).toMatch(/^ACT-[0-9a-f]{12}$/);
  });
});

describe('Seed Script - Idempotency via Upsert', () => {
  it('inserting a food twice with same foodId results in only 1 document', async () => {
    const foodData = {
      foodId: 100,
      name: 'Test Food',
      foodGroup: 'Test Group',
      calories: 200,
      servingDescription: '1 serving'
    };

    await Food.findOneAndUpdate(
      { foodId: 100 },
      { $set: foodData },
      { upsert: true }
    );

    await Food.findOneAndUpdate(
      { foodId: 100 },
      { $set: foodData },
      { upsert: true }
    );

    const count = await Food.countDocuments({ foodId: 100 });
    expect(count).toBe(1);
  });

  it('updating a food preserves the document but changes data', async () => {
    await Food.findOneAndUpdate(
      { foodId: 200 },
      { $set: { foodId: 200, name: 'Original Name', foodGroup: 'Grains', calories: 100 } },
      { upsert: true }
    );

    await Food.findOneAndUpdate(
      { foodId: 200 },
      { $set: { foodId: 200, name: 'Updated Name', foodGroup: 'Grains', calories: 150 } },
      { upsert: true }
    );

    const food = await Food.findOne({ foodId: 200 });
    expect(food.name).toBe('Updated Name');
    expect(food.calories).toBe(150);
    expect(await Food.countDocuments({ foodId: 200 })).toBe(1);
  });

  it('inserting an activity twice with same activityId results in only 1 document', async () => {
    const actId = generateActivityId('Running', 'jog', 7);
    const actData = {
      activityId: actId,
      activityName: 'Running',
      specificMotion: 'jog',
      metValue: 7
    };

    await Activity.findOneAndUpdate(
      { activityId: actId },
      { $set: actData },
      { upsert: true }
    );

    await Activity.findOneAndUpdate(
      { activityId: actId },
      { $set: actData },
      { upsert: true }
    );

    const count = await Activity.countDocuments({ activityId: actId });
    expect(count).toBe(1);
  });
});
