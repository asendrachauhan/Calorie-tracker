export interface Food {
  _id?: string;
  foodId: number;
  name: string;
  foodGroup: string;
  calories: number;
  servingDescription: string;
  fat?: number;
  protein?: number;
  carbohydrate?: number;
}
