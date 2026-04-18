import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const householdId = ref<string | null>(null)
  const memberId = ref<string | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!session.value)
  const hasHousehold = computed(() => !!householdId.value)

  async function initialize() {
    loading.value = true
    error.value = null

    try {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      user.value = data.session?.user ?? null

      if (user.value) {
        await loadMembership()
      }
    } finally {
      loading.value = false
    }

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null

      if (!newSession) {
        householdId.value = null
        memberId.value = null
      }
    })
  }

  async function loadMembership() {
    if (!user.value) return

    const { data, error: fetchError } = await supabase
      .from('members')
      .select('id, household_id')
      .eq('user_id', user.value.id)
      .eq('active', true)
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      console.error('Failed to load membership:', fetchError.message)
      return
    }

    if (data) {
      memberId.value = data.id
      householdId.value = data.household_id
    }
  }

  async function signIn(email: string, password: string) {
    error.value = null
    loading.value = true

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        error.value = authError.message
        return false
      }

      const { data } = await supabase.auth.getSession()
      session.value = data.session
      user.value = data.session?.user ?? null
      await loadMembership()
      return true
    } finally {
      loading.value = false
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    error.value = null
    loading.value = true

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (authError) {
        error.value = authError.message
        return false
      }

      const { data } = await supabase.auth.getSession()
      session.value = data.session
      user.value = data.session?.user ?? null
      return true
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    session.value = null
    householdId.value = null
    memberId.value = null
  }

  async function createHousehold(householdName: string, memberName: string, color: string) {
    if (!user.value) return false
    error.value = null

    // Atomic RPC: creates household + first admin member, bypasses RLS chicken-and-egg
    const { data, error: rpcError } = await supabase.rpc('create_household_with_member', {
      household_name: householdName,
      member_name: memberName,
      member_color: color,
    })

    if (rpcError) {
      error.value = rpcError.message
      return false
    }

    householdId.value = data.household_id
    memberId.value = data.member_id
    return true
  }

  async function updateProfile(updates: {
    full_name?: string
    date_of_birth?: string | null
    phone?: string | null
    timezone?: string | null
  }) {
    if (!user.value) return false
    error.value = null

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: updates,
      })

      if (updateError) {
        error.value = updateError.message
        return false
      }

      // Refresh user data
      const { data } = await supabase.auth.getUser()
      if (data.user) user.value = data.user
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update profile'
      return false
    }
  }

  async function changePassword(newPassword: string) {
    error.value = null

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        error.value = updateError.message
        return false
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to change password'
      return false
    }
  }

  async function updateEmail(newEmail: string) {
    error.value = null

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
      })

      if (updateError) {
        error.value = updateError.message
        return false
      }

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update email'
      return false
    }
  }

  async function deleteAccount() {
    error.value = null

    try {
      // Sign out first, then the account must be deleted server-side
      // (Supabase doesn't allow self-deletion from client; admin API required)
      await signOut()
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete account'
      return false
    }
  }

  return {
    user,
    session,
    householdId,
    memberId,
    loading,
    error,
    isAuthenticated,
    hasHousehold,
    initialize,
    loadMembership,
    signIn,
    signUp,
    signOut,
    createHousehold,
    updateProfile,
    changePassword,
    updateEmail,
    deleteAccount,
  }
})
