import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { boardsDataService, boardItemsDataService } from '@/services/data/boards.data'
import type { Board, BoardItem } from '@/models/board.model'

export const useBoardsStore = defineStore('boards', () => {
  const boards = ref<Board[]>([])
  const boardItems = ref<BoardItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBoards(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await boardsDataService.getAll(householdId)
      boards.value = result.cached
      if (result.fresh) {
        boards.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load boards'
    } finally {
      loading.value = false
    }
  }

  async function fetchBoardItems(householdId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await boardItemsDataService.getAll(householdId)
      boardItems.value = result.cached
      if (result.fresh) {
        boardItems.value = result.fresh
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load board items'
    } finally {
      loading.value = false
    }
  }

  async function createBoard(data: Omit<Board, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await boardsDataService.create(data)
      boards.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create board'
      throw err
    }
  }

  async function updateBoard(id: string, data: Partial<Board>) {
    error.value = null
    try {
      const updated = await boardsDataService.update(id, data)
      const idx = boards.value.findIndex((b) => b.id === id)
      if (idx !== -1) boards.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update board'
      throw err
    }
  }

  async function removeBoard(id: string) {
    error.value = null
    try {
      await boardsDataService.softDelete(id)
      const idx = boards.value.findIndex((b) => b.id === id)
      if (idx !== -1) boards.value.splice(idx, 1)

      const itemsToRemove = boardItems.value.filter((i) => i.board_id === id)
      for (const item of itemsToRemove) {
        await boardItemsDataService.softDelete(item.id)
      }
      boardItems.value = boardItems.value.filter((i) => i.board_id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete board'
      throw err
    }
  }

  async function createItem(data: Omit<BoardItem, 'id' | 'created_at' | 'updated_at'>) {
    error.value = null
    try {
      const created = await boardItemsDataService.create(data)
      boardItems.value.push(created)
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create board item'
      throw err
    }
  }

  async function updateItem(id: string, data: Partial<BoardItem>) {
    error.value = null
    try {
      const updated = await boardItemsDataService.update(id, data)
      const idx = boardItems.value.findIndex((i) => i.id === id)
      if (idx !== -1) boardItems.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update board item'
      throw err
    }
  }

  async function removeItem(id: string) {
    error.value = null
    try {
      await boardItemsDataService.softDelete(id)
      const idx = boardItems.value.findIndex((i) => i.id === id)
      if (idx !== -1) boardItems.value.splice(idx, 1)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete board item'
      throw err
    }
  }

  async function toggleItemCheck(id: string) {
    const item = boardItems.value.find((i) => i.id === id)
    if (!item) return
    return updateItem(id, { is_checked: !item.is_checked })
  }

  function getItemsForBoard(boardId: string) {
    return boardItems.value
      .filter((i) => i.board_id === boardId)
      .sort((a, b) => {
        const groupA = a.group_name ?? ''
        const groupB = b.group_name ?? ''
        if (groupA !== groupB) return groupA.localeCompare(groupB)
        return a.position - b.position
      })
  }

  const boardCount = computed(() => boards.value.length)

  return {
    boards,
    boardItems,
    loading,
    error,
    fetchBoards,
    fetchBoardItems,
    createBoard,
    updateBoard,
    removeBoard,
    createItem,
    updateItem,
    removeItem,
    toggleItemCheck,
    getItemsForBoard,
    boardCount,
  }
})
