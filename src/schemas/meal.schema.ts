import { z } from 'zod'
import { householdEntitySchema } from './base.schema'

export const mealPlanSchema = householdEntitySchema.extend({
  week_start: z.string(),
  note: z.string(),
})

export const mealSchema = householdEntitySchema.extend({
  meal_plan_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  name: z.string(),
  recipe_notes: z.string(),
  servings: z.number().int(),
})
