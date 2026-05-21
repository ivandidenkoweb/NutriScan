/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  isCalculated: boolean;
  weightCc: number; // in kg
  heightCc: number; // in cm
  ageCc: number;
  genderCc: 'male' | 'female';
  activityLevelCc: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goalCc: 'lose' | 'maintain' | 'gain';
  targetKcal: number;
  targetProtein: number; // in grams
  targetFat: number; // in grams
  targetCarbs: number; // in grams
}

export interface Ingredient {
  name: string;
  weight: number; // in grams
}

export interface FoodItem {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number; // Unix timestamp in ms
  name: string;
  imageUrl?: string; // base64 or uploaded image URL
  weightGrams: number;
  volumeMl: number;
  proteins: number; // grams
  fats: number; // grams
  carbohydrates: number; // grams
  kcal: number;
  ingredients: Ingredient[];
  explanation: string;
}

export interface DailySummary {
  date: string;
  totalKcal: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  items: FoodItem[];
}
