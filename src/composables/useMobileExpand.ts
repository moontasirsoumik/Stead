import { ref, onBeforeUnmount } from 'vue'

/**
 * Composable for expandable mobile table rows.
 * On mobile (≤ breakpoint): tap toggles expand/collapse.
 * On desktop (> breakpoint): tap fires the edit callback directly.
 */
export function useMobileExpand(breakpoint = 640) {
  const mobileExpandedId = ref<string | null>(null)
  let mql: MediaQueryList | null = null

  if (typeof window !== 'undefined') {
    mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
  }

  function isMobile(): boolean {
    return mql?.matches ?? false
  }

  /** Row click handler — expand on mobile, edit on desktop */
  function handleRowClick(id: string, editFn: () => void) {
    if (isMobile()) {
      mobileExpandedId.value = mobileExpandedId.value === id ? null : id
    } else {
      editFn()
    }
  }

  /** Collapse any open row */
  function collapse() {
    mobileExpandedId.value = null
  }

  onBeforeUnmount(() => {
    mobileExpandedId.value = null
  })

  return { mobileExpandedId, handleRowClick, collapse }
}
