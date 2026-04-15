import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'

export function useAuth() {
  const store = useAuthStore()
  const { user, session, householdId, memberId, loading, error, isAuthenticated, hasHousehold } =
    storeToRefs(store)

  return {
    user,
    session,
    householdId,
    memberId,
    loading,
    error,
    isAuthenticated,
    hasHousehold,
    signIn: store.signIn,
    signUp: store.signUp,
    signOut: store.signOut,
    createHousehold: store.createHousehold,
  }
}
