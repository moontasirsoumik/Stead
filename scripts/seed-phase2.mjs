/**
 * Phase 2 Seed script — populates new feature tables (from migrations 006-010)
 * with realistic dummy data. Also adds personal-scope entries.
 *
 * Usage: node scripts/seed-phase2.mjs
 */

import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// ── Config ──────────────────────────────────────────────────
const SUPABASE_URL = 'https://ssznueavbhpkpepdxvrm.supabase.co'
const ANON_KEY = 'sb_publishable_mK8jHxMCBxigPn-TCLJ8oQ_SUj7XQAD'
const JWT_SECRET = 'W8+rdG7vae9d6kf34EqnFjDR1UTC4J6v45d8vIl/qlJGNE1G06bzxyTg0H/kjDYuYXj2nwP9gjSsx3/uPC0ysA=='

const serviceRoleToken = jwt.sign(
  { role: 'service_role', iss: 'supabase', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
  JWT_SECRET,
  { algorithm: 'HS256' }
)

const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${serviceRoleToken}` } }
})

// ── Known IDs ───────────────────────────────────────────────
const HOUSEHOLD_ID = 'd4345c0a-09ea-403e-85c8-dfe9c20ffb4e'
const MEMBER_ID = 'dadd41f6-3b65-4c0c-8923-bc2e960ca53d'

// ── Helpers ─────────────────────────────────────────────────
function daysFromNow(n) {
  const d = new Date(); d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}
function daysAgo(n) { return daysFromNow(-n) }
function weekStart(weeksFromNow) {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + 1 + (weeksFromNow * 7)) // Monday
  return d.toISOString().split('T')[0]
}
const today = new Date().toISOString().split('T')[0]

async function seed(table, label, rows) {
  const { data, error } = await supabase.from(table).insert(rows).select('id')
  if (error) { console.error(`  ✗ ${label}: ${error.message}`); return null }
  console.log(`  ✓ ${data.length} ${label}`)
  return data
}

async function skipIfExists(table) {
  const { data } = await supabase.from(table).select('id').limit(1)
  return data?.length > 0
}

// ── Main ────────────────────────────────────────────────────
console.log('=== Stead Phase 2 Seed ===\n')

// ── Wishlists ───────────────────────────────────────────────
console.log('Wishlists:')
if (await skipIfExists('wishlists')) {
  console.log('  (skipped — data exists)')
} else {
  await seed('wishlists', 'wishlists', [
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'Sony WH-1000XM5', description: 'Noise-cancelling headphones', url: 'https://electronics.example.com/xm5', price: 34999, priority: 'high', status: 'saving', saved_amount: 15000, category: 'electronics' },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'Kindle Paperwhite', description: 'E-reader for bedside reading', price: 14999, priority: 'medium', status: 'wanted', saved_amount: 0, category: 'electronics' },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'Cast iron Dutch oven', description: 'Le Creuset 5.5 qt', price: 37000, priority: 'low', status: 'wanted', saved_amount: 0, category: 'kitchen' },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'Standing desk', description: 'Uplift V2 60" bamboo top', price: 59900, priority: 'high', status: 'saving', saved_amount: 20000, category: 'office' },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'Running shoes', description: 'Nike Pegasus 41', price: 12999, priority: 'medium', status: 'bought', saved_amount: 12999, category: 'fitness' },
  ])
}

// ── Subscriptions ───────────────────────────────────────────
console.log('Subscriptions:')
if (await skipIfExists('subscriptions')) {
  console.log('  (skipped — data exists)')
} else {
  await seed('subscriptions', 'subscriptions', [
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'Spotify Premium', amount: 1099, frequency: 'monthly', category: 'entertainment', next_billing_date: daysFromNow(12), auto_renew: true, status: 'active' },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'Netflix Standard', amount: 1549, frequency: 'monthly', category: 'entertainment', next_billing_date: daysFromNow(5), auto_renew: true, status: 'active' },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'iCloud+ 200GB', amount: 299, frequency: 'monthly', category: 'cloud', next_billing_date: daysFromNow(20), auto_renew: true, status: 'active' },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'ChatGPT Plus', amount: 2000, frequency: 'monthly', category: 'productivity', next_billing_date: daysFromNow(8), auto_renew: true, status: 'active' },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'Gym membership', amount: 4999, frequency: 'monthly', category: 'fitness', next_billing_date: daysFromNow(1), auto_renew: true, status: 'paused', note: 'Paused during summer travel' },
  ])
}

// ── Journal Entries ─────────────────────────────────────────
console.log('Journal Entries:')
if (await skipIfExists('journal_entries')) {
  console.log('  (skipped — data exists)')
} else {
  await seed('journal_entries', 'journal entries', [
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, entry_date: daysAgo(0), content: 'Productive morning — finished the budget review and planned next week\'s meals. Feeling on top of things.', mood: 'great', tags: 'productivity,planning' },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, entry_date: daysAgo(1), content: 'Cooked a new pasta recipe for dinner. It turned out really well — will add it to the meal rotation.', mood: 'good', tags: 'cooking,meals' },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, entry_date: daysAgo(3), content: 'Stressful day at work. Took a long walk in the evening which helped clear my head. Need to prioritize sleep.', mood: 'okay', tags: 'work,wellness' },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, entry_date: daysAgo(5), content: 'Spent the afternoon organizing the pantry. Found some expired items that needed tossing. Everything looks so much better now.', mood: 'good', tags: 'home,organization' },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, entry_date: daysAgo(7), content: 'Rainy weekend — stayed in, read a book, and caught up on laundry. Sometimes the quiet days are the best.', mood: 'good', tags: 'weekend,rest' },
  ])
}

// ── Habits ───────────────────────────────────────────────────
console.log('Habits:')
if (await skipIfExists('habits')) {
  console.log('  (skipped — data exists)')
} else {
  const habitsData = await seed('habits', 'habits', [
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'Morning meditation', description: '10 minutes guided meditation after waking up', frequency: 'daily', color: '#7C3AED', active: true },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'Exercise', description: '30+ min workout or run', frequency: 'weekdays', color: '#059669', active: true },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'Read 20 pages', description: 'Non-fiction or fiction — no screens', frequency: 'daily', color: '#2563EB', active: true },
    { household_id: HOUSEHOLD_ID, owner_id: MEMBER_ID, name: 'Meal prep', description: 'Prep lunches for the week', frequency: 'weekends', color: '#D97706', active: true },
  ])

  // Seed habit logs for the past 14 days
  if (habitsData) {
    console.log('Habit Logs:')
    const logs = []
    for (const habit of habitsData) {
      for (let i = 0; i < 14; i++) {
        const date = daysAgo(i)
        const dayOfWeek = new Date(date).getDay() // 0=Sun 6=Sat
        // Simulate some missed days (skip ~20%)
        if (Math.random() < 0.2) continue
        // Skip weekends for weekday habits, weekdays for weekend habits
        const h = habitsData.indexOf(habit)
        if (h === 1 && (dayOfWeek === 0 || dayOfWeek === 6)) continue // exercise: weekdays
        if (h === 3 && dayOfWeek !== 0 && dayOfWeek !== 6) continue  // meal prep: weekends
        logs.push({
          habit_id: habit.id,
          household_id: HOUSEHOLD_ID,
          owner_id: MEMBER_ID,
          log_date: date,
          completed: true,
        })
      }
    }
    await seed('habit_logs', 'habit logs', logs)
  }
}

// ── Contacts ────────────────────────────────────────────────
console.log('Contacts:')
if (await skipIfExists('contacts')) {
  console.log('  (skipped — data exists)')
} else {
  await seed('contacts', 'contacts', [
    { household_id: HOUSEHOLD_ID, name: 'Dr. Sarah Chen', role: 'Family physician', phone: '+1-555-0101', email: 'schen@clinic.example.com', company: 'Riverside Medical', category: 'medical' },
    { household_id: HOUSEHOLD_ID, name: 'Mike Hernandez', role: 'Plumber', phone: '+1-555-0202', company: 'QuickFix Plumbing', category: 'home_services', note: 'Available weekends, fair pricing' },
    { household_id: HOUSEHOLD_ID, name: 'Amanda Liu', role: 'Insurance agent', phone: '+1-555-0303', email: 'aliu@stateinsure.example.com', company: 'StateInsure', category: 'financial' },
    { household_id: HOUSEHOLD_ID, name: 'Dave\'s Auto', role: 'Car mechanic', phone: '+1-555-0404', address: '420 Elm Street', category: 'auto', note: 'Good with European cars' },
    { household_id: HOUSEHOLD_ID, name: 'Emily Parks', role: 'Accountant', phone: '+1-555-0505', email: 'eparks@taxhelp.example.com', company: 'Parks & Associates', category: 'financial' },
  ])
}

// ── Documents ───────────────────────────────────────────────
console.log('Documents:')
if (await skipIfExists('documents')) {
  console.log('  (skipped — data exists)')
} else {
  await seed('documents', 'documents', [
    { household_id: HOUSEHOLD_ID, title: 'Apartment lease', doc_type: 'lease', issuer: 'Maple Realty', issue_date: '2024-09-01', expiry_date: '2025-08-31', reference_number: 'LEASE-2024-4421', description: '1BR apartment at 55 Maple Drive' },
    { household_id: HOUSEHOLD_ID, title: 'Renter\'s insurance', doc_type: 'insurance', issuer: 'StateInsure', issue_date: '2024-09-01', expiry_date: '2025-09-01', reference_number: 'POL-RI-88210', description: 'Covers personal property up to $30k' },
    { household_id: HOUSEHOLD_ID, title: 'Laptop warranty', doc_type: 'warranty', issuer: 'Apple Inc.', issue_date: '2024-03-15', expiry_date: '2027-03-15', reference_number: 'APPL-W-99201', description: 'MacBook Pro 14" — AppleCare+' },
    { household_id: HOUSEHOLD_ID, title: 'Car registration', doc_type: 'other', issuer: 'DMV', issue_date: '2024-11-01', expiry_date: '2025-11-01', reference_number: 'REG-VEH-3301', description: '2020 Honda Civic registration' },
    { household_id: HOUSEHOLD_ID, title: 'Washer/dryer manual', doc_type: 'manual', issuer: 'Samsung', description: 'Model WF45R6100AW — front-load combo' },
  ])
}

// ── Meal Plans & Meals ──────────────────────────────────────
console.log('Meal Plans:')
if (await skipIfExists('meal_plans')) {
  console.log('  (skipped — data exists)')
} else {
  const thisWeekStart = weekStart(0)
  const nextWeekStart = weekStart(1)

  const plans = await seed('meal_plans', 'meal plans', [
    { household_id: HOUSEHOLD_ID, week_start: thisWeekStart, note: 'Focus on using up pantry staples' },
    { household_id: HOUSEHOLD_ID, week_start: nextWeekStart, note: 'Trying more Mediterranean recipes' },
  ])

  if (plans) {
    console.log('Meals:')
    const mealNames = {
      breakfast: ['Oatmeal with berries', 'Greek yogurt parfait', 'Avocado toast', 'Scrambled eggs & toast', 'Smoothie bowl', 'Granola & milk', 'Pancakes'],
      lunch: ['Chicken Caesar wrap', 'Lentil soup', 'Turkey sandwich', 'Quinoa bowl', 'Leftover pasta', 'Tuna salad', 'Rice & beans'],
      dinner: ['Grilled salmon & veggies', 'Spaghetti Bolognese', 'Chicken stir-fry', 'Tacos al pastor', 'Sheet pan chicken', 'Mushroom risotto', 'Thai green curry'],
    }
    const meals = []
    for (const plan of plans) {
      for (let day = 0; day <= 6; day++) {
        for (const type of ['breakfast', 'lunch', 'dinner']) {
          meals.push({
            meal_plan_id: plan.id,
            household_id: HOUSEHOLD_ID,
            day_of_week: day,
            meal_type: type,
            name: mealNames[type][day],
            servings: type === 'dinner' ? 2 : 1,
          })
        }
      }
    }
    await seed('meals', 'meals', meals)
  }
}

// ── Expense Splits ──────────────────────────────────────────
console.log('Expense Splits:')
if (await skipIfExists('expense_splits')) {
  console.log('  (skipped — data exists)')
} else {
  // Get some expense IDs to attach splits to
  const { data: expenses } = await supabase.from('expenses').select('id, amount').limit(3)
  if (expenses?.length > 0) {
    const splits = expenses.map(exp => ({
      expense_id: exp.id,
      household_id: HOUSEHOLD_ID,
      member_id: MEMBER_ID,
      amount: Math.floor(exp.amount / 2),
      settled: false,
    }))
    await seed('expense_splits', 'expense splits', splits)
  } else {
    console.log('  (no expenses found to split)')
  }
}

// ── Personal scope entries ──────────────────────────────────
console.log('\nPersonal Scope Entries:')

// Personal expenses
console.log('Personal Expenses:')
const { data: personalExpCheck } = await supabase.from('expenses').select('id').eq('scope', 'personal').limit(1)
if (personalExpCheck?.length > 0) {
  console.log('  (skipped — personal expenses exist)')
} else {
  await seed('expenses', 'personal expenses', [
    { household_id: HOUSEHOLD_ID, amount: 4599, category: 'entertainment', description: 'Concert tickets — indie show', date: daysAgo(2), paid_by: MEMBER_ID, scope: 'personal', owner_id: MEMBER_ID },
    { household_id: HOUSEHOLD_ID, amount: 1299, category: 'food', description: 'Lunch with friends', date: daysAgo(4), paid_by: MEMBER_ID, scope: 'personal', owner_id: MEMBER_ID },
    { household_id: HOUSEHOLD_ID, amount: 6999, category: 'clothing', description: 'New winter jacket', date: daysAgo(10), paid_by: MEMBER_ID, scope: 'personal', owner_id: MEMBER_ID },
    { household_id: HOUSEHOLD_ID, amount: 2500, category: 'health', description: 'Pharmacy — vitamins', date: daysAgo(6), paid_by: MEMBER_ID, scope: 'personal', owner_id: MEMBER_ID },
  ])
}

// Personal income
console.log('Personal Income:')
const { data: personalIncCheck } = await supabase.from('income').select('id').eq('scope', 'personal').limit(1)
if (personalIncCheck?.length > 0) {
  console.log('  (skipped — personal income exists)')
} else {
  await seed('income', 'personal income', [
    { household_id: HOUSEHOLD_ID, amount: 15000, source: 'Freelance design project', category: 'freelance', date: daysAgo(5), received_by: MEMBER_ID, scope: 'personal', owner_id: MEMBER_ID },
    { household_id: HOUSEHOLD_ID, amount: 5000, source: 'Sold old textbooks', category: 'side_income', date: daysAgo(12), received_by: MEMBER_ID, scope: 'personal', owner_id: MEMBER_ID },
  ])
}

// Personal budget
console.log('Personal Budgets:')
const { data: personalBudgetCheck } = await supabase.from('budgets').select('id').eq('scope', 'personal').limit(1)
if (personalBudgetCheck?.length > 0) {
  console.log('  (skipped — personal budgets exist)')
} else {
  const thisMonth = today.slice(0, 7)
  await seed('budgets', 'personal budgets', [
    { household_id: HOUSEHOLD_ID, category: 'entertainment', budget_amount: 15000, month: thisMonth, scope: 'personal', owner_id: MEMBER_ID },
    { household_id: HOUSEHOLD_ID, category: 'clothing', budget_amount: 10000, month: thisMonth, scope: 'personal', owner_id: MEMBER_ID },
  ])
}

// Personal savings goal
console.log('Personal Savings Goals:')
const { data: personalGoalCheck } = await supabase.from('savings_goals').select('id').eq('scope', 'personal').limit(1)
if (personalGoalCheck?.length > 0) {
  console.log('  (skipped — personal savings goals exist)')
} else {
  await seed('savings_goals', 'personal savings goals', [
    { household_id: HOUSEHOLD_ID, name: 'Japan trip fund', target_amount: 500000, current_amount: 125000, deadline: '2026-03-01', scope: 'personal', owner_id: MEMBER_ID },
  ])
}

// Personal notes
console.log('Personal Notes:')
const { data: personalNoteCheck } = await supabase.from('notes').select('id').eq('scope', 'personal').limit(1)
if (personalNoteCheck?.length > 0) {
  console.log('  (skipped — personal notes exist)')
} else {
  await seed('notes', 'personal notes', [
    { household_id: HOUSEHOLD_ID, title: 'Book recommendations', content: '- "Atomic Habits" by James Clear\n- "Deep Work" by Cal Newport\n- "The Art of Doing Science and Engineering" by Hamming', category: 'reading', created_by: MEMBER_ID, scope: 'personal', owner_id: MEMBER_ID },
    { household_id: HOUSEHOLD_ID, title: 'Gift ideas', content: '- Mom: new garden tools\n- Dad: noise-cancelling earbuds\n- Sister: cooking class voucher', category: 'personal', created_by: MEMBER_ID, scope: 'personal', owner_id: MEMBER_ID },
  ])
}

// Personal tasks
console.log('Personal Tasks:')
const { data: personalTaskCheck } = await supabase.from('tasks').select('id').eq('scope', 'personal').limit(1)
if (personalTaskCheck?.length > 0) {
  console.log('  (skipped — personal tasks exist)')
} else {
  await seed('tasks', 'personal tasks', [
    { household_id: HOUSEHOLD_ID, title: 'Renew passport', status: 'not_started', priority: 'high', due_date: daysFromNow(30), assignee: MEMBER_ID, scope: 'personal', owner_id: MEMBER_ID },
    { household_id: HOUSEHOLD_ID, title: 'Schedule dentist appointment', status: 'not_started', priority: 'medium', due_date: daysFromNow(14), assignee: MEMBER_ID, scope: 'personal', owner_id: MEMBER_ID },
  ])
}

console.log('\n=== Phase 2 Seed Complete ===')
