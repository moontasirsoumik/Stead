import { z } from 'zod'
import { householdEntitySchema } from './base.schema'

export const trackerSchema = householdEntitySchema.extend({
  owner_id: z.string().uuid().nullable(),
  scope: z.enum(['household', 'personal']),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  value_type: z.enum(['numeric', 'boolean', 'category', 'duration', 'counter']),
  unit: z.string().nullable(),
  categories: z.string().nullable(),
  target_value: z.coerce.number().nullable(),
  target_direction: z.enum(['increase', 'decrease', 'maintain']).nullable(),
  is_cyclic: z.coerce.boolean(),
  position: z.coerce.number(),
})

export const trackerEntrySchema = householdEntitySchema.extend({
  tracker_id: z.string().uuid(),
  entry_date: z.string(),
  numeric_value: z.coerce.number().nullable(),
  text_value: z.string().nullable(),
  boolean_value: z.coerce.boolean().nullable(),
  notes: z.string().nullable(),
  tags: z.string().nullable(),
})
