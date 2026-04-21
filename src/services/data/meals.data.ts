import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { mealPlanSchema, mealSchema } from '@/schemas/meal.schema'
import type { MealPlan, Meal } from '@/models/meal.model'

export const mealPlansDataService = new BaseDataService<MealPlan>(
  'meal_plans',
  db.meal_plans,
  mealPlanSchema,
)

export const mealsDataService = new BaseDataService<Meal>(
  'meals',
  db.meals,
  mealSchema,
)
