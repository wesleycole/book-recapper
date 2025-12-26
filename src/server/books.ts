import { createServerFn } from '@tanstack/react-start'
import { searchBooks, searchSeries, getBookDetails } from '~/lib/openlib'

export const searchBooksServer = createServerFn({ method: 'GET' })
  .inputValidator((query: string) => query)
  .handler(async ({ data: query }) => {
    if (!query || query.length < 2) {
      return []
    }
    return searchBooks(query, 20)
  })

export const searchSeriesServer = createServerFn({ method: 'GET' })
  .inputValidator((query: string) => query)
  .handler(async ({ data: query }) => {
    if (!query || query.length < 2) {
      return []
    }
    return searchSeries(query)
  })

export const getBookDetailsServer = createServerFn({ method: 'GET' })
  .inputValidator((workKey: string) => workKey)
  .handler(async ({ data: workKey }) => {
    return getBookDetails(workKey)
  })
