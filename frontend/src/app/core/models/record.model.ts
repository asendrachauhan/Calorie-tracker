export interface FoodEntry {
  _id?: string;
  foodId: number;
  foodName: string;
  foodGroup: string;
  servingDescription: string;
  baseCalories: number;
  portion: number;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calculatedCalories: number;
}

export interface ActivityEntry {
  _id?: string;
  activityId: string;
  activityName: string;
  specificMotion: string;
  metValue: number;
  userWeightKg: number;
  durationMinutes: number;
  calculatedCaloriesBurned: number;
}

export interface DailyRecord {
  _id?: string;
  userId: string;
  date: string;
  bmr: number;
  foodEntries: FoodEntry[];
  activityEntries: ActivityEntry[];
  totalCaloriesIn: number;
  totalCaloriesOut: number;
  netCalories: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddFoodDto {
  foodId: number;
  portion: number;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
}

export interface AddActivityDto {
  activityId: string;
  durationMinutes: number;
}
