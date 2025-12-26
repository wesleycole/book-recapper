import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const recaps = sqliteTable('recaps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bookTitle: text('book_title').notNull(),
  seriesName: text('series_name'),
  author: text('author'),
  query: text('query').notNull(),
  recap: text('recap').notNull(),
  sources: text('sources'), // JSON string of source URLs
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Recap = typeof recaps.$inferSelect
export type NewRecap = typeof recaps.$inferInsert
