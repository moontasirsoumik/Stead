import type { Table } from 'dexie'

export class BaseRepository<T> {
  constructor(private table: Table<T, string>) {}

  async getAll(): Promise<T[]> {
    return this.table.toArray()
  }

  async getById(id: string): Promise<T | undefined> {
    return this.table.get(id)
  }

  async put(entity: T): Promise<void> {
    await this.table.put(entity)
  }

  async putMany(entities: T[]): Promise<void> {
    await this.table.bulkPut(entities)
  }

  async remove(id: string): Promise<void> {
    await this.table.delete(id)
  }

  async clear(): Promise<void> {
    await this.table.clear()
  }
}
