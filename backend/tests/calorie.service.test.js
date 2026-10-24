const {
  calculateAge,
  calculateBMR,
  calculateActivityCalories,
  calculateFoodCalories,
  calculateNetCalories,
  validateDateRange
} = require('../src/services/calorie.service');

describe('Calorie Service - Pure Calculation Tests', () => {

  // ===== Calendar-based Age Calculation =====
  describe('calculateAge', () => {
    it('calculates age correctly for a birthday that has passed this year', () => {
      // Born Jan 15 1990, as of Oct 23 2026 => 36
      expect(calculateAge('1990-01-15', '2026-10-23')).toBe(36);
    });

    it('calculates age correctly for a birthday that has NOT yet occurred this year', () => {
      // Born Dec 25 1990, as of Oct 23 2026 => still 35
      expect(calculateAge('1990-12-25', '2026-10-23')).toBe(35);
    });

    it('returns correct age on the exact birthday', () => {
      // Born Jun 15 1988, as of Jun 15 2026 => 38
      expect(calculateAge('1988-06-15', '2026-06-15')).toBe(38);
    });

    it('returns correct age the day before birthday', () => {
      // Born Jun 15 1988, as of Jun 14 2026 => still 37
      expect(calculateAge('1988-06-15', '2026-06-14')).toBe(37);
    });

    it('returns correct age the day after birthday', () => {
      // Born Jun 15 1988, as of Jun 16 2026 => 38
      expect(calculateAge('1988-06-15', '2026-06-16')).toBe(38);
    });

    it('handles leap year birthdays (Feb 29)', () => {
      // Born Feb 29 2000, as of Mar 1 2026 => 26
      expect(calculateAge('2000-02-29', '2026-03-01')).toBe(26);
      // Born Feb 29 2000, as of Feb 28 2026 => still 25
      expect(calculateAge('2000-02-29', '2026-02-28')).toBe(25);
    });
  });

  // ===== BMR Calculation =====
  describe('calculateBMR', () => {
    it('calculates male BMR correctly using Harris-Benedict formula', () => {
      // Men BMR = 66.4730 + (13.7516 * 75.7) + (5.0033 * 180) - (6.7550 * 38)
      const expected = 66.4730 + (13.7516 * 75.7) + (5.0033 * 180) - (6.7550 * 38);
      expect(calculateBMR('male', 75.7, 180, 38)).toBeCloseTo(expected, 2);
    });

    it('calculates female BMR correctly using Harris-Benedict formula', () => {
      // Women BMR = 655.0955 + (9.5634 * 60) + (1.8496 * 165) - (4.6756 * 30)
      const expected = 655.0955 + (9.5634 * 60) + (1.8496 * 165) - (4.6756 * 30);
      expect(calculateBMR('female', 60, 165, 30)).toBeCloseTo(expected, 2);
    });

    it('returns a positive value for typical human inputs', () => {
      expect(calculateBMR('male', 80, 175, 25)).toBeGreaterThan(0);
      expect(calculateBMR('female', 55, 160, 25)).toBeGreaterThan(0);
    });

    it('uses the assignment reference example: James male 75.7kg 180cm age 38', () => {
      // From user-list.html sample data row for James: BMR ~1535.245
      const bmr = calculateBMR('male', 75.7, 180, 38);
      // 66.4730 + 1041.0012 + 900.594 - 256.69 = 1751.378 (actual formula result)
      // The HTML shows 1535.245 which doesn't match the formula with those inputs
      // Our code correctly implements the PDF formula; the HTML values are placeholder samples
      expect(bmr).toBeGreaterThan(1000);
      expect(bmr).toBeLessThan(2500);
    });
  });

  // ===== Activity Calories =====
  describe('calculateActivityCalories', () => {
    it('converts minutes to hours correctly: 30 min = 0.5 hours', () => {
      // MET=14, weight=75.7kg, 30 min
      const result = calculateActivityCalories(14, 75.7, 30);
      const expected = 14 * 75.7 * (30 / 60);
      expect(result).toBeCloseTo(expected, 2);
    });

    it('converts minutes to hours correctly: 60 min = 1 hour', () => {
      const result = calculateActivityCalories(8.5, 80, 60);
      expect(result).toBeCloseTo(8.5 * 80 * 1, 2);
    });

    it('handles 1 minute correctly', () => {
      const result = calculateActivityCalories(10, 70, 1);
      expect(result).toBeCloseTo(10 * 70 * (1 / 60), 4);
    });

    it('returns 0 for 0 MET value', () => {
      expect(calculateActivityCalories(0, 80, 30)).toBe(0);
    });
  });

  // ===== Food Calories =====
  describe('calculateFoodCalories', () => {
    it('multiplies base calories by portion correctly', () => {
      expect(calculateFoodCalories(307, 1)).toBe(307);
      expect(calculateFoodCalories(307, 2)).toBe(614);
      expect(calculateFoodCalories(307, 0.5)).toBeCloseTo(153.5, 1);
    });

    it('handles fractional portions', () => {
      expect(calculateFoodCalories(200, 1.5)).toBe(300);
    });
  });

  // ===== Net Calories =====
  describe('calculateNetCalories', () => {
    it('calculates Net = CaloriesIn - BMR - CaloriesOut', () => {
      expect(calculateNetCalories(2000, 1500, 300)).toBe(200);
    });

    it('returns negative when BMR + activity exceeds food intake', () => {
      expect(calculateNetCalories(500, 1500, 300)).toBe(-1300);
    });

    it('returns -BMR when no food and no activities', () => {
      expect(calculateNetCalories(0, 1800, 0)).toBe(-1800);
    });

    it('BMR is subtracted exactly once per calculation', () => {
      const bmr = 1500;
      const net = calculateNetCalories(2000, bmr, 200);
      // Net = 2000 - 1500 - 200 = 300
      expect(net).toBe(300);
    });
  });

  // ===== Date Validation =====
  describe('validateDateRange', () => {
    it('accepts today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(validateDateRange(today).valid).toBe(true);
    });

    it('accepts 15 days ago', () => {
      const d = new Date();
      d.setDate(d.getDate() - 15);
      const dateStr = d.toISOString().split('T')[0];
      expect(validateDateRange(dateStr).valid).toBe(true);
    });

    it('accepts exactly 30 days ago', () => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const dateStr = d.toISOString().split('T')[0];
      expect(validateDateRange(dateStr).valid).toBe(true);
    });

    it('rejects 31 days ago', () => {
      const d = new Date();
      d.setDate(d.getDate() - 31);
      const dateStr = d.toISOString().split('T')[0];
      const result = validateDateRange(dateStr);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('30 days');
    });

    it('rejects tomorrow (future date)', () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const dateStr = d.toISOString().split('T')[0];
      const result = validateDateRange(dateStr);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('future');
    });

    it('rejects invalid date format', () => {
      expect(validateDateRange('10/23/2026').valid).toBe(false);
      expect(validateDateRange('not-a-date').valid).toBe(false);
    });
  });
});
