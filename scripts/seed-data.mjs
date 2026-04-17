/**
 * Seed script — populates all existing Stead tables with realistic dummy data.
 * Uses JWT secret to generate service_role token (bypasses RLS).
 *
 * NOTE: Migrations 006-010 have NOT been applied to remote DB yet.
 * This script seeds only tables/columns that currently exist.
 *
 * Usage: node scripts/seed-data.mjs
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

// ── Helpers ─────────────────────────────────────────────────
function daysFromNow(n) {
  const d = new Date(); d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}
function daysAgo(n) { return daysFromNow(-n) }
const today = new Date().toISOString().split('T')[0]
const thisMonth = today.slice(0, 7)

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
async function main() {
  console.log('🌱 Seeding Stead database...\n')

  const { data: members, error: memErr } = await supabase.from('members').select('*')
  if (memErr) { console.error('Failed to fetch members:', memErr); process.exit(1) }
  if (!members.length) { console.error('No members found. Complete onboarding first.'); process.exit(1) }

  const m = members[0]
  const hid = m.household_id
  const mid = m.id
  console.log(`Household: ${hid}\nMember: ${mid} (${m.name})\n`)

  // ── EXPENSES ──────────────────────────────────────────────
  console.log('💰 Expenses...')
  await seed('expenses', 'expenses', [
    { household_id: hid, date: daysAgo(1), amount: 8500, category: 'groceries', subcategory: 'produce', description: 'Weekly grocery run at Whole Foods', paid_by: mid, shared: true, tags: ['food', 'weekly'] },
    { household_id: hid, date: daysAgo(3), amount: 15000, category: 'utilities', subcategory: 'electric', description: 'April electricity bill', paid_by: mid, shared: true, tags: ['bills'] },
    { household_id: hid, date: daysAgo(5), amount: 4200, category: 'dining', subcategory: 'restaurant', description: 'Dinner at Olive Garden', paid_by: mid, shared: true, tags: ['dining'] },
    { household_id: hid, date: daysAgo(8), amount: 220000, category: 'housing', subcategory: 'rent', description: 'April rent payment', paid_by: mid, shared: true, tags: ['rent', 'monthly'] },
    { household_id: hid, date: daysAgo(2), amount: 3500, category: 'transportation', subcategory: 'gas', description: 'Gas fill-up at Shell', paid_by: mid, shared: false, tags: ['car'] },
    { household_id: hid, date: daysAgo(4), amount: 1299, category: 'entertainment', description: 'Netflix monthly subscription', paid_by: mid, tags: ['subscription'] },
    { household_id: hid, date: daysAgo(6), amount: 4500, category: 'personal', description: 'New running shoes from Nike outlet', paid_by: mid, tags: ['fitness'] },
    { household_id: hid, date: daysAgo(10), amount: 2000, category: 'education', description: 'Udemy course — Advanced TypeScript', paid_by: mid, tags: ['learning'] },
    { household_id: hid, date: daysAgo(12), amount: 800, category: 'health', description: 'Vitamin D + Omega-3 supplements', paid_by: mid, tags: ['health'] },
    { household_id: hid, date: daysAgo(14), amount: 3200, category: 'shopping', description: 'Book haul from Amazon (4 books)', paid_by: mid, tags: ['books'] },
  ])

  // ── INCOME ────────────────────────────────────────────────
  console.log('💵 Income...')
  await seed('income', 'income entries', [
    { household_id: hid, date: daysAgo(15), amount: 450000, source: 'TechCorp Inc.', category: 'salary', received_by: mid, recurring: true, recurring_rule: 'biweekly' },
    { household_id: hid, date: daysAgo(1), amount: 450000, source: 'TechCorp Inc.', category: 'salary', received_by: mid, recurring: true, recurring_rule: 'biweekly' },
    { household_id: hid, date: daysAgo(20), amount: 15000, source: 'Vanguard dividends', category: 'investment', received_by: mid },
    { household_id: hid, date: daysAgo(7), amount: 25000, source: 'Freelance web project', category: 'freelance', received_by: mid },
    { household_id: hid, date: daysAgo(18), amount: 5000, source: 'Survey rewards cashout', category: 'other', received_by: mid },
  ])

  // ── BILLS ─────────────────────────────────────────────────
  if (await skipIfExists('bills')) {
    console.log('📋 Bills... (already seeded)')
  } else {
    console.log('📋 Bills...')
    await seed('bills', 'bills', [
      { household_id: hid, name: 'Rent', amount: 220000, category: 'housing', due_day: 1, frequency: 'monthly', auto_pay: false, paid_by: mid, status: 'paid', last_paid_date: daysAgo(16) },
      { household_id: hid, name: 'Electric bill', amount: 15000, category: 'utilities', due_day: 15, frequency: 'monthly', auto_pay: true, paid_by: mid, status: 'upcoming' },
      { household_id: hid, name: 'Internet', amount: 7999, category: 'utilities', due_day: 20, frequency: 'monthly', auto_pay: true, paid_by: mid, status: 'upcoming' },
      { household_id: hid, name: 'Car insurance', amount: 45000, category: 'insurance', due_day: 5, frequency: 'quarterly', auto_pay: false, paid_by: mid, status: 'upcoming' },
      { household_id: hid, name: 'Gym membership', amount: 4999, category: 'health', due_day: 10, frequency: 'monthly', auto_pay: true, paid_by: mid, status: 'paid', last_paid_date: daysAgo(7) },
    ])
  }

  // ── BUDGETS ───────────────────────────────────────────────
  console.log('📊 Budgets...')
  await seed('budgets', 'budgets', [
    { household_id: hid, month: thisMonth, category: 'groceries', budget_amount: 40000 },
    { household_id: hid, month: thisMonth, category: 'dining', budget_amount: 15000 },
    { household_id: hid, month: thisMonth, category: 'utilities', budget_amount: 25000 },
    { household_id: hid, month: thisMonth, category: 'transportation', budget_amount: 20000 },
    { household_id: hid, month: thisMonth, category: 'entertainment', budget_amount: 10000 },
  ])

  // ── SAVINGS GOALS ─────────────────────────────────────────
  console.log('🎯 Savings goals...')
  const goals = await seed('savings_goals', 'savings goals', [
    { household_id: hid, name: 'Emergency fund', target_amount: 1000000, current_amount: 350000, deadline: '2026-12-31', priority: 'high', status: 'active' },
    { household_id: hid, name: 'Summer vacation to Italy', target_amount: 500000, current_amount: 125000, deadline: '2026-08-01', priority: 'medium', status: 'active' },
    { household_id: hid, name: 'New living room couch', target_amount: 200000, current_amount: 80000, deadline: '2026-06-15', priority: 'low', status: 'active' },
    { household_id: hid, name: 'MacBook Pro upgrade', target_amount: 250000, current_amount: 75000, deadline: '2026-09-01', priority: 'medium', status: 'active' },
    { household_id: hid, name: 'Photography course', target_amount: 80000, current_amount: 40000, deadline: '2026-07-01', priority: 'low', status: 'active' },
  ])

  // ── GOAL CONTRIBUTIONS ────────────────────────────────────
  if (goals?.length) {
    console.log('💎 Goal contributions...')
    const contribs = []
    for (const g of goals) {
      contribs.push(
        { household_id: hid, goal_id: g.id, amount: 50000, date: daysAgo(30), contributed_by: mid },
        { household_id: hid, goal_id: g.id, amount: 25000, date: daysAgo(14), contributed_by: mid },
      )
    }
    await seed('goal_contributions', 'contributions', contribs)
  }

  // ── TASKS ─────────────────────────────────────────────────
  console.log('✅ Tasks...')
  const tasks = await seed('tasks', 'tasks', [
    { household_id: hid, title: 'Clean kitchen counters', description: 'Wipe down all counters and stovetop', assignee: mid, room: 'kitchen', category: 'cleaning', due_date: daysFromNow(1), priority: 'high', status: 'not_started' },
    { household_id: hid, title: 'Vacuum living room', description: 'Full vacuum including under furniture', assignee: mid, room: 'living_room', category: 'cleaning', due_date: daysFromNow(2), priority: 'medium', status: 'not_started' },
    { household_id: hid, title: 'Organize garage', description: 'Sort tools and seasonal items into labeled bins', assignee: mid, room: 'garage', category: 'organization', due_date: daysFromNow(7), priority: 'low', status: 'not_started' },
    { household_id: hid, title: 'Take out recycling', assignee: mid, category: 'waste', due_date: today, priority: 'high', status: 'in_progress' },
    { household_id: hid, title: 'Water indoor plants', assignee: mid, category: 'garden', due_date: daysFromNow(1), recurring_rule: 'every 3 days', priority: 'medium', status: 'not_started' },
    { household_id: hid, title: 'Replace HVAC filter', description: 'Standard 20x25x1 filter — pick up from Home Depot', assignee: mid, category: 'maintenance', due_date: daysFromNow(14), priority: 'medium', status: 'not_started' },
    { household_id: hid, title: 'Schedule dentist appointment', description: 'Overdue for 6-month checkup', priority: 'high', status: 'not_started', due_date: daysFromNow(3) },
    { household_id: hid, title: 'Renew passport', description: 'Expires in 3 months — need new photos first', priority: 'high', status: 'in_progress', due_date: daysFromNow(14) },
  ])

  // ── SUBTASKS ──────────────────────────────────────────────
  if (tasks?.length) {
    console.log('📝 Subtasks...')
    await seed('subtasks', 'subtasks', [
      { household_id: hid, task_id: tasks[0].id, title: 'Clear off counters', order: 0 },
      { household_id: hid, task_id: tasks[0].id, title: 'Spray and wipe surfaces', order: 1 },
      { household_id: hid, task_id: tasks[0].id, title: 'Clean stovetop grates', order: 2 },
      { household_id: hid, task_id: tasks[2].id, title: 'Sort tools into labeled bins', order: 0 },
      { household_id: hid, task_id: tasks[2].id, title: 'Move seasonal items to top shelves', order: 1 },
      { household_id: hid, task_id: tasks[2].id, title: 'Sweep and mop floor', order: 2 },
    ])
  }

  // ── GROCERIES ─────────────────────────────────────────────
  if (await skipIfExists('groceries')) {
    console.log('🛒 Groceries... (already seeded)')
  } else {
    console.log('🛒 Groceries...')
    await seed('groceries', 'groceries', [
      { household_id: hid, name: 'Whole milk', quantity: 2, unit: 'gallon', category: 'dairy', priority: 'high', status: 'needed', preferred_store: 'Costco' },
      { household_id: hid, name: 'Chicken breast', quantity: 3, unit: 'lb', category: 'meat', priority: 'high', status: 'needed', preferred_store: "Trader Joe's" },
      { household_id: hid, name: 'Bananas', quantity: 1, unit: 'bunch', category: 'produce', priority: 'medium', status: 'in_cart' },
      { household_id: hid, name: 'Olive oil (extra virgin)', quantity: 1, unit: 'bottle', category: 'pantry', priority: 'low', status: 'needed', preferred_store: 'Whole Foods' },
      { household_id: hid, name: 'Paper towels', quantity: 1, unit: 'pack', category: 'household', priority: 'medium', status: 'needed', preferred_store: 'Costco' },
    ])
  }

  // ── INVENTORY ─────────────────────────────────────────────
  if (await skipIfExists('inventory')) {
    console.log('📦 Inventory... (already seeded)')
  } else {
    console.log('📦 Inventory...')
    await seed('inventory', 'inventory items', [
      { household_id: hid, name: 'Rice (basmati 10lb)', category: 'pantry', location: 'kitchen', stock_status: 'enough', target_level: 'keep_2' },
      { household_id: hid, name: 'Laundry detergent', category: 'cleaning', location: 'laundry_room', stock_status: 'low', target_level: 'keep_1', restock_needed: true },
      { household_id: hid, name: 'AA batteries', category: 'household', location: 'utility_drawer', stock_status: 'almost_finished', target_level: 'keep_3_plus', restock_needed: true },
      { household_id: hid, name: 'Coffee beans (medium roast)', category: 'pantry', location: 'kitchen', stock_status: 'enough', target_level: 'weekly_item', last_checked_date: daysAgo(2) },
      { household_id: hid, name: 'Toilet paper', category: 'bathroom', location: 'bathroom_closet', stock_status: 'extra_stock', target_level: 'keep_3_plus' },
    ])
  }

  // ── REMINDERS ─────────────────────────────────────────────
  if (await skipIfExists('reminders')) {
    console.log('⏰ Reminders... (already seeded)')
  } else {
    console.log('⏰ Reminders...')
    await seed('reminders', 'reminders', [
      { household_id: hid, title: 'Pay rent', type: 'bill', due_date: daysFromNow(14), repeat_rule: 'monthly', assigned_to: mid, status: 'active' },
      { household_id: hid, title: 'Dentist checkup', type: 'health', due_date: daysFromNow(7), assigned_to: mid, status: 'active' },
      { household_id: hid, title: 'Car oil change', type: 'maintenance', due_date: daysFromNow(21), assigned_to: mid, status: 'active', note: 'Every 5,000 miles' },
      { household_id: hid, title: 'Renew library books', type: 'personal', due_date: daysFromNow(3), assigned_to: mid, status: 'active' },
      { household_id: hid, title: 'Annual furnace inspection', type: 'maintenance', due_date: daysFromNow(45), repeat_rule: 'yearly', assigned_to: mid, status: 'snoozed', note: 'Call ABC Heating — 555-9876' },
    ])
  }

  // ── NOTES ─────────────────────────────────────────────────
  console.log('📒 Notes...')
  await seed('notes', 'notes', [
    { household_id: hid, title: 'WiFi credentials', category: 'reference', content: 'Network: SteadHome_5G\nPassword: Sup3rS3cure!2026\n\nGuest network: SteadGuest\nPassword: Welcome2026', pinned: true, created_by: mid },
    { household_id: hid, title: 'Emergency contacts', category: 'reference', content: "- Plumber: Bob's Plumbing — 555-0123\n- Electrician: Spark Electric — 555-0456\n- Landlord: John Peterson — 555-1010\n- Poison Control: 1-800-222-1222", pinned: true, created_by: mid },
    { household_id: hid, title: 'Paint colors for rooms', category: 'home', content: 'Living room: Benjamin Moore "Simply White" OC-117\nBedroom: "Silver Satin" OC-26\nKitchen: "Chantilly Lace" OC-65\nBathroom: "Palladian Blue" HC-144', pinned: false, created_by: mid },
    { household_id: hid, title: 'Book reading list 2026', category: 'personal', content: '1. ✅ Atomic Habits — James Clear\n2. 📖 Deep Work — Cal Newport (in progress)\n3. The Pragmatic Programmer\n4. Designing Data-Intensive Applications\n5. Project Hail Mary — Andy Weir', pinned: true, created_by: mid },
    { household_id: hid, title: 'Workout routine', category: 'fitness', content: 'Mon: Push (chest, shoulders, triceps)\nTue: Pull (back, biceps)\nWed: Legs + core\nThu: Rest / active recovery\nFri: Full upper body\nSat: 5K run or cycling\nSun: Rest', pinned: false, created_by: mid },
  ])

  // ── SETTINGS ──────────────────────────────────────────────
  if (await skipIfExists('settings')) {
    console.log('⚙️ Settings... (already seeded)')
  } else {
    console.log('⚙️ Settings...')
    const { error } = await supabase.from('settings').upsert([
      { household_id: hid, key: 'currency', value: 'USD' },
      { household_id: hid, key: 'timezone', value: 'America/New_York' },
      { household_id: hid, key: 'week_start', value: 'monday' },
      { household_id: hid, key: 'theme', value: 'system' },
      { household_id: hid, key: 'date_format', value: 'MM/DD/YYYY' },
    ], { onConflict: 'household_id,key' })
    if (error) console.error(`  ✗ Settings: ${error.message}`)
    else console.log('  ✓ 5 settings')
  }

  console.log('\n🎉 Seed complete!\n')
  console.log('⚠️  Tables NOT seeded (migrations 006-010 not yet applied to remote DB):')
  console.log('   Wishlists, Subscriptions, Journal, Habits, Contacts, Documents, Meal Plans')
  console.log('   Also: personal scope columns, task_type/maintenance fields, expense splits')
  console.log('   → Apply migrations from supabase/migrations/ in the Supabase Dashboard SQL Editor')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
