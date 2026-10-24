export interface User {
  _id: string;
  name: string;
  weight: number;
  height: number;
  gender: 'male' | 'female';
  dateOfBirth: string;
  age?: number;
  bmr?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserDto {
  name: string;
  weight: number;
  height: number;
  gender: 'male' | 'female';
  dateOfBirth: string;
}
