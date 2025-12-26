import { createServerFn } from '@tanstack/start'
import { searchTavily, type TavilySearchResult } from '~/lib/tavily'
import { streamMinimaxChat, createBookRecapPrompt } from '~/lib/minimax'
import { db } from '~/db'
import { recaps } from '~/db/schema'
import { desc } from 'drizzle-orm'

export interface RecapRequest {
  bookTitle: string
  seriesName?: string
  author?: string
  additionalContext?: string
}

export interface RecapStreamResponse {
  type: 'sources' | 'content' | 'done' | 'error'
  data?: string
  sources?: TavilySearchResult[]
  recapId?: number
}

export const generateRecap = createServerFn({ method: 'POST' })
  .validator((data: RecapRequest) => data)
  .handler(async ({ data }) => {
    const { bookTitle, seriesName, author, additionalContext } = data

    // Build the search query
    const searchQuery = [bookTitle, seriesName, author, 'book summary plot recap']
      .filter(Boolean)
      .join(' ')

    // Build the prompt query
    const promptQuery = [
      bookTitle,
      seriesName ? `(${seriesName} series)` : '',
      author ? `by ${author}` : '',
      additionalContext,
    ]
      .filter(Boolean)
      .join(' ')

    try {
      // Search Tavily for context
      const searchResults = await searchTavily(searchQuery)

      // Format search results for the prompt
      const searchContext = searchResults.results
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}`)
        .join('\n\n')

      // Create messages for MiniMax
      const messages = createBookRecapPrompt(promptQuery, searchContext)

      // Stream the response
      let fullContent = ''
      const chunks: string[] = []

      for await (const chunk of streamMinimaxChat(messages)) {
        fullContent += chunk
        chunks.push(chunk)
      }

      // Save to database
      const [saved] = await db
        .insert(recaps)
        .values({
          bookTitle,
          seriesName: seriesName || null,
          author: author || null,
          query: promptQuery,
          recap: fullContent,
          sources: JSON.stringify(searchResults.results),
        })
        .returning()

      return {
        content: fullContent,
        sources: searchResults.results,
        recapId: saved.id,
      }
    } catch (error) {
      console.error('Error generating recap:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate recap'
      )
    }
  })

export const streamRecap = createServerFn({ method: 'POST' })
  .validator((data: RecapRequest) => data)
  .handler(async function* ({ data }) {
    const { bookTitle, seriesName, author, additionalContext } = data

    // Build the search query
    const searchQuery = [bookTitle, seriesName, author, 'book summary plot recap']
      .filter(Boolean)
      .join(' ')

    // Build the prompt query
    const promptQuery = [
      bookTitle,
      seriesName ? `(${seriesName} series)` : '',
      author ? `by ${author}` : '',
      additionalContext,
    ]
      .filter(Boolean)
      .join(' ')

    try {
      // Search Tavily for context
      const searchResults = await searchTavily(searchQuery)

      // Yield sources first
      yield JSON.stringify({
        type: 'sources',
        sources: searchResults.results,
      } as RecapStreamResponse)

      // Format search results for the prompt
      const searchContext = searchResults.results
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}`)
        .join('\n\n')

      // Create messages for MiniMax
      const messages = createBookRecapPrompt(promptQuery, searchContext)

      // Stream the response
      let fullContent = ''

      for await (const chunk of streamMinimaxChat(messages)) {
        fullContent += chunk
        yield JSON.stringify({
          type: 'content',
          data: chunk,
        } as RecapStreamResponse)
      }

      // Save to database
      const [saved] = await db
        .insert(recaps)
        .values({
          bookTitle,
          seriesName: seriesName || null,
          author: author || null,
          query: promptQuery,
          recap: fullContent,
          sources: JSON.stringify(searchResults.results),
        })
        .returning()

      yield JSON.stringify({
        type: 'done',
        recapId: saved.id,
      } as RecapStreamResponse)
    } catch (error) {
      console.error('Error generating recap:', error)
      yield JSON.stringify({
        type: 'error',
        data: error instanceof Error ? error.message : 'Failed to generate recap',
      } as RecapStreamResponse)
    }
  })

export const getRecentRecaps = createServerFn({ method: 'GET' }).handler(
  async () => {
    const recentRecaps = await db
      .select()
      .from(recaps)
      .orderBy(desc(recaps.createdAt))
      .limit(20)

    return recentRecaps.map((r) => ({
      ...r,
      sources: r.sources ? JSON.parse(r.sources) : [],
    }))
  }
)

export const getRecapById = createServerFn({ method: 'GET' })
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    const [recap] = await db.select().from(recaps).where({ id }).limit(1)
    if (!recap) return null

    return {
      ...recap,
      sources: recap.sources ? JSON.parse(recap.sources) : [],
    }
  })
