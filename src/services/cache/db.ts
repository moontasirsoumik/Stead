import Dexie, { type Table } from 'dexie'
import type { Member } from '@/models/member.model'
import type { Expense } from '@/models/expense.model'
import type { Income } from '@/models/income.model'
import type { Bill } from '@/models/bill.model'
import type { Budget } from '@/models/budget.model'
import type { SavingsGoal } from '@/models/savings-goal.model'
import type { GoalContribution } from '@/models/goal-contribution.model'
import type { Task } from '@/models/task.model'
import type { Subtask } from '@/models/subtask.model'
import type { GroceryItem } from '@/models/grocery.model'
import type { InventoryItem } from '@/models/inventory.model'
import type { Reminder } from '@/models/reminder.model'
import type { Note } from '@/models/note.model'
import type { WishlistItem } from '@/models/wishlist.model'
import type { Subscription } from '@/models/subscription.model'
import type { JournalEntry } from '@/models/journal.model'
import type { Habit, HabitLog } from '@/models/habit.model'
import type { Contact } from '@/models/contact.model'
import type { HouseholdDocument } from '@/models/document.model'
import type { MealPlan, Meal } from '@/models/meal.model'
import type { ExpenseSplit } from '@/models/expense-split.model'
import type { CalendarEvent } from '@/models/calendar-event.model'
import type { EntityShare } from '@/models/entity-share.model'

class SteadDatabase extends Dexie {
  members!: Table<Member, string>
  expenses!: Table<Expense, string>
  expense_splits!: Table<ExpenseSplit, string>
  income!: Table<Income, string>
  bills!: Table<Bill, string>
  budgets!: Table<Budget, string>
  savings_goals!: Table<SavingsGoal, string>
  goal_contributions!: Table<GoalContribution, string>
  tasks!: Table<Task, string>
  subtasks!: Table<Subtask, string>
  groceries!: Table<GroceryItem, string>
  inventory!: Table<InventoryItem, string>
  reminders!: Table<Reminder, string>
  notes!: Table<Note, string>
  wishlists!: Table<WishlistItem, string>
  subscriptions!: Table<Subscription, string>
  journal_entries!: Table<JournalEntry, string>
  habits!: Table<Habit, string>
  habit_logs!: Table<HabitLog, string>
  contacts!: Table<Contact, string>
  documents!: Table<HouseholdDocument, string>
  meal_plans!: Table<MealPlan, string>
  meals!: Table<Meal, string>
  calendar_events!: Table<CalendarEvent, string>
  entity_shares!: Table<EntityShare, string>

  constructor() {
    super('stead-db')
    this.version(1).stores({
      members: 'id, household_id',
      expenses: 'id, household_id, date, category',
      income: 'id, household_id, date',
      bills: 'id, household_id, status',
      budgets: 'id, household_id, month',
      savings_goals: 'id, household_id, status',
      goal_contributions: 'id, goal_id',
      tasks: 'id, household_id, status, due_date, assignee',
      subtasks: 'id, task_id',
      groceries: 'id, household_id, status, category',
      inventory: 'id, household_id, stock_status',
      reminders: 'id, household_id, due_date, status',
      notes: 'id, household_id, pinned',
      maintenance: 'id, household_id, status, next_due_date',
    })
    this.version(2).stores({
      tasks: 'id, household_id, status, due_date, assignee, task_type',
      maintenance: null, // remove maintenance table
    })
    this.version(3).stores({
      expenses: 'id, household_id, date, category, scope, owner_id',
      income: 'id, household_id, date, scope, owner_id',
      budgets: 'id, household_id, month, scope, owner_id',
      savings_goals: 'id, household_id, status, scope, owner_id',
      goal_contributions: 'id, goal_id, scope, owner_id',
      tasks: 'id, household_id, status, due_date, assignee, task_type, scope, owner_id',
      notes: 'id, household_id, pinned, scope, owner_id',
    })
    this.version(4).stores({
      wishlists: 'id, household_id, owner_id, status',
      subscriptions: 'id, household_id, owner_id, status',
      journal_entries: 'id, household_id, owner_id, entry_date',
      habits: 'id, household_id, owner_id',
      habit_logs: 'id, habit_id, log_date',
      contacts: 'id, household_id',
      documents: 'id, household_id, doc_type',
      meal_plans: 'id, household_id, week_start',
      meals: 'id, meal_plan_id, household_id',
    })
    this.version(5).stores({
      expense_splits: 'id, expense_id, household_id, member_id, settled',
    })
    this.version(6).stores({
      calendar_events: 'id, household_id, start_date, scope, owner_id',
    })
    this.version(7).stores({
      entity_shares: 'id, entity_type, entity_id, shared_with, household_id',
      calendar_events: 'id, household_id, start_date, scope, owner_id, visibility',
      notes: 'id, household_id, pinned, scope, owner_id, visibility',
      tasks: 'id, household_id, status, due_date, assignee, task_type, scope, owner_id, visibility',
      wishlists: 'id, household_id, owner_id, status, visibility',
    })
  }
}

export const db = new SteadDatabase()
