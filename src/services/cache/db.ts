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
import type { MaintenanceItem } from '@/models/maintenance.model'

class SteadDatabase extends Dexie {
  members!: Table<Member, string>
  expenses!: Table<Expense, string>
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
  maintenance!: Table<MaintenanceItem, string>

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
  }
}

export const db = new SteadDatabase()
