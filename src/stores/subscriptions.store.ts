import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { subscriptionsDataService } from '@/services/data/subscriptions.data'
import type { Subscription } from '@/models/subscription.model'

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const items = ref<Subscription[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSubscriptions(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await subscriptionsDataService.getAll(householdId)
      items.value = result.cached
      if (result.fresh) {
        items.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load subscriptions'
    } finally {
      loading.value = false
    }
  }

  async function create(data: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await subscriptionsDataService.create(data)
      items.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create subscription'
      throw err
    }
  }

  async function update(id: string, data: Partial<Subscription>) {
    error.value = null
    try {
      const updated = await subscriptionsDataService.update(id, data)
      const idx = items.value.findIndex((s) => s.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update subscription'
      throw err
    }
  }

  async function remove(id: string) {
    error.value = null
    try {
      await subscriptionsDataService.softDelete(id)
      const idx = items.value.findIndex((s) => s.id === id)
      if (idx !== -1) items.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete subscription'
      throw err
    }
  }

  const activeSubscriptions = computed(() =>
    items.value.filter((s) => s.status === 'active'),
  )

  const monthlyTotal = computed(() => {
    return activeSubscriptions.value.reduce((sum, s) => {
      switch (s.frequency) {
        case 'weekly': return sum + Math.round(s.amount * 4.33)
        case 'monthly': return sum + s.amount
        case 'quarterly': return sum + Math.round(s.amount / 3)
        case 'yearly': return sum + Math.round(s.amount / 12)
        default: return sum
      }
    }, 0)
  })

  const upcomingRenewals = computed(() => {
    const now = new Date()
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return activeSubscriptions.value
      .filter((s) => {
        if (!s.next_billing_date) return false
        const d = new Date(s.next_billing_date)
        return d >= now && d <= thirtyDaysOut
      })
      .sort((a, b) =>
        new Date(a.next_billing_date!).getTime() - new Date(b.next_billing_date!).getTime(),
      )
  })

  return {
    items,
    loading,
    error,
    fetchSubscriptions,
    create,
    update,
    remove,
    activeSubscriptions,
    monthlyTotal,
    upcomingRenewals,
  }
})
