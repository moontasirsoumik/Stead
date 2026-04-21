import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tasksDataService } from '@/services/data/tasks.data'
import { subtasksDataService } from '@/services/data/subtasks.data'
import type { Task } from '@/models/task.model'
import type { Subtask } from '@/models/subtask.model'
import type { TaskStatus, TaskPriority, TaskType } from '@/models/enums'

export const useTasksStore = defineStore('tasks', () => {
  const items = ref<Task[]>([])
  const subtasks = ref<Map<string, Subtask[]>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTasks(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await tasksDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load tasks'
    } finally {
      loading.value = false
    }
  }

  async function fetchSubtasks(taskId: string) {
    try {
      const result = await subtasksDataService.getAllByTask(taskId)
      subtasks.value.set(taskId, result.cached)
      if (result.fresh) {
        subtasks.value.set(taskId, result.fresh)
      }
    } catch (err) {
      console.error('Failed to load subtasks:', err)
    }
  }

  async function createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await tasksDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create task'
      throw err
    }
  }

  async function updateTask(id: string, data: Partial<Task>) {
    error.value = null
    try {
      const updated = await tasksDataService.update(id, data)
      const idx = items.value.findIndex((t) => t.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update task'
      throw err
    }
  }

  async function removeTask(id: string) {
    error.value = null
    try {
      await tasksDataService.softDelete(id)
      const idx = items.value.findIndex((t) => t.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
      subtasks.value.delete(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete task'
      throw err
    }
  }

  async function updateStatus(taskId: string, status: TaskStatus) {
    const payload: Partial<Task> = { status }
    if (status === 'done') {
      payload.completed_at = new Date().toISOString()
    } else {
      payload.completed_at = null
    }
    return updateTask(taskId, payload)
  }

  async function addSubtask(taskId: string, data: Omit<Subtask, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await subtasksDataService.create(data)
      const existing = subtasks.value.get(taskId) ?? []
      subtasks.value.set(taskId, [...existing, created])
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add subtask'
      throw err
    }
  }

  async function toggleSubtask(subtaskId: string, taskId: string) {
    const taskSubs = subtasks.value.get(taskId)
    const sub = taskSubs?.find((s) => s.id === subtaskId)
    if (!sub) return

    try {
      const updated = await subtasksDataService.update(subtaskId, { done: !sub.done })
      const list = subtasks.value.get(taskId) ?? []
      const idx = list.findIndex((s) => s.id === subtaskId)
      if (idx !== -1) list[idx] = updated
      subtasks.value.set(taskId, [...list])
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update subtask'
    }
  }

  async function removeSubtask(subtaskId: string, taskId: string) {
    try {
      await subtasksDataService.softDelete(subtaskId)
      const list = subtasks.value.get(taskId) ?? []
      subtasks.value.set(taskId, list.filter((s) => s.id !== subtaskId))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete subtask'
    }
  }

  const groupedByStatus = computed(() => {
    const groups: Record<string, Task[]> = {
      not_started: [],
      in_progress: [],
      done: [],
      skipped: [],
      overdue: [],
    }
    for (const task of items.value) {
      if (groups[task.status]) {
        groups[task.status].push(task)
      }
    }
    return groups
  })

  const overdueTasks = computed(() =>
    items.value.filter((t) => {
      if (t.status === 'done' || t.status === 'skipped') return false
      if (!t.due_date) return false
      return new Date(t.due_date) < new Date(new Date().toDateString())
    }),
  )

  const dueToday = computed(() =>
    items.value.filter((t) => {
      if (t.status === 'done' || t.status === 'skipped') return false
      if (!t.due_date) return false
      const today = new Date().toDateString()
      return new Date(t.due_date).toDateString() === today
    }),
  )

  function filteredByAssignee(assigneeId: string) {
    return items.value.filter((t) => t.assignee === assigneeId)
  }

  function filteredByPriority(priority: TaskPriority) {
    return items.value.filter((t) => t.priority === priority)
  }

  // Task type filters
  const regularTasks = computed(() =>
    items.value.filter((t) => t.task_type === 'regular'),
  )

  const maintenanceTasks = computed(() =>
    items.value.filter((t) => t.task_type === 'maintenance'),
  )

  function filteredByType(taskType: TaskType | 'all') {
    if (taskType === 'all') return items.value
    return items.value.filter((t) => t.task_type === taskType)
  }

  // Maintenance-specific actions
  async function markMaintenanceDone(id: string) {
    return updateTask(id, {
      status: 'done' as TaskStatus,
      completed_at: new Date().toISOString(),
      last_done_date: new Date().toISOString().split('T')[0],
    })
  }

  async function skipTask(id: string) {
    return updateTask(id, { status: 'skipped' as TaskStatus })
  }

  // Maintenance-specific computed
  const overdueMaintenanceTasks = computed(() =>
    maintenanceTasks.value.filter((t) => {
      if (t.status === 'done' || t.status === 'skipped') return false
      if (!t.due_date) return false
      return new Date(t.due_date) < new Date(new Date().toDateString())
    }),
  )

  const upcomingMaintenanceTasks = computed(() =>
    maintenanceTasks.value
      .filter((t) => t.status === 'not_started')
      .sort((a, b) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return a.due_date.localeCompare(b.due_date)
      }),
  )

  return {
    items,
    subtasks,
    loading,
    error,
    fetchTasks,
    fetchSubtasks,
    createTask,
    updateTask,
    removeTask,
    updateStatus,
    addSubtask,
    toggleSubtask,
    removeSubtask,
    groupedByStatus,
    overdueTasks,
    dueToday,
    filteredByAssignee,
    filteredByPriority,
    regularTasks,
    maintenanceTasks,
    filteredByType,
    markMaintenanceDone,
    skipTask,
    overdueMaintenanceTasks,
    upcomingMaintenanceTasks,
  }
})
