import type { HouseholdEntity } from './base.model'
import type { MealType } from './enums'

export interface MealPlan extends HouseholdEntity {
  week_start: string
  note: string
}

export interface Meal extends HouseholdEntity {
  meal_plan_id: string
  day_of_week: number
  meal_type: MealType
  name: string
  recipe_notes: string
  servings: number
}
