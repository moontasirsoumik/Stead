import { BaseDataService } from '@/services/data/base.data'
import { db } from '@/services/cache/db'
import { boardSchema, boardItemSchema } from '@/schemas/board.schema'
import type { Board, BoardItem } from '@/models/board.model'

export const boardsDataService = new BaseDataService<Board>(
  'boards',
  db.boards,
  boardSchema,
)

export const boardItemsDataService = new BaseDataService<BoardItem>(
  'board_items',
  db.board_items,
  boardItemSchema,
)
