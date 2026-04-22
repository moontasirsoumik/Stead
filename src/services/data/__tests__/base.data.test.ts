import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import { BaseDataService } from '../base.data'

const mockSelect = vi.fn().mockReturnThis()
const mockInsert = vi.fn().mockReturnThis()
const mockUpdate = vi.fn().mockReturnThis()
const mockEq = vi.fn().mockReturnThis()
const mockLimit = vi.fn().mockReturnThis()
const mockSingle = vi.fn()
const mockMaybeSingle = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      limit: mockLimit,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    })),
  },
}))

const testSchema = z.object({
  id: z.string(),
  household_id: z.string(),
  name: z.string(),
  deleted: z.boolean(),
})

type TestEntity = z.infer<typeof testSchema>

const mockDexieTable = {
  toArray: vi.fn(),
  bulkPut: vi.fn(),
  put: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
}

describe('BaseDataService', () => {
  let service: BaseDataService<TestEntity>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new BaseDataService(
      'test_table',
      mockDexieTable as never,
      testSchema,
    )
  })

  describe('getAll', () => {
    it('returns cached data and fetches fresh', async () => {
      const cachedItems: TestEntity[] = [
        { id: '1', household_id: 'h1', name: 'Cached', deleted: false },
      ]
      const freshItems: TestEntity[] = [
        { id: '2', household_id: 'h1', name: 'Fresh', deleted: false },
      ]

      mockDexieTable.toArray.mockResolvedValue(cachedItems)
      mockLimit.mockResolvedValue({ data: freshItems, error: null })

      const result = await service.getAll('h1')

      expect(result.cached).toEqual(cachedItems)
      expect(result.fresh).toEqual(freshItems)
      expect(mockDexieTable.toArray).toHaveBeenCalled()
      expect(mockDexieTable.bulkPut).toHaveBeenCalledWith(freshItems)
    })
  })

  describe('create', () => {
    it('calls supabase insert and caches result', async () => {
      const created: TestEntity = {
        id: '3',
        household_id: 'h1',
        name: 'New',
        deleted: false,
      }

      mockSingle.mockResolvedValue({ data: created, error: null })

      const result = await service.create({
        household_id: 'h1',
        name: 'New',
        deleted: false,
      })

      expect(result).toEqual(created)
      expect(mockDexieTable.put).toHaveBeenCalledWith(created)
    })
  })

  describe('softDelete', () => {
    it('calls supabase update with deleted=true', async () => {
      mockEq.mockResolvedValue({ error: null })

      await service.softDelete('1')

      expect(mockUpdate).toHaveBeenCalledWith({ deleted: true })
      expect(mockDexieTable.delete).toHaveBeenCalledWith('1')
    })
  })
})
