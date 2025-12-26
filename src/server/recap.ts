import { createServerFn } from '@tanstack/react-start'
import { searchTavily, type TavilySearchResult } from '~/lib/tavily'
import { streamMinimaxChat, createBookRecapPrompt } from '~/lib/minimax'

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
}

export const generateRecap = createServerFn({ method: 'POST' })
  .inputValidator((data: RecapRequest) => data)
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

      return {
        content: fullContent,
        sources: searchResults.results,
      }
    } catch (error) {
      console.error('Error generating recap:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate recap'
      )
    }
  })

export const streamRecap = createServerFn({ method: 'POST' })
  .inputValidator((data: RecapRequest) => data)
  .handler(async function* ({ data }) {
    const { bookTitle, seriesName, author, additionalContext } = data
    console.log('[Server] Starting streamRecap for:', bookTitle)

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
      console.log('[Server] Searching Tavily with query:', searchQuery)
      const searchResults = await searchTavily(searchQuery)
      console.log('[Server] Found', searchResults.results.length, 'search results')

      // Yield sources first
      const sourcesPayload = JSON.stringify({
        type: 'sources',
        sources: searchResults.results,
      } as RecapStreamResponse)
      console.log('[Server] Yielding sources')
      yield sourcesPayload

      // Format search results for the prompt
      const searchContext = searchResults.results
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}`)
        .join('\n\n')

      // Create messages for MiniMax
      const messages = createBookRecapPrompt(promptQuery, searchContext)
      console.log('[Server] Starting MiniMax stream')

      // Stream the response
      let chunkCount = 0
      for await (const chunk of streamMinimaxChat(messages)) {
        chunkCount++
        if (chunkCount % 10 === 0) {
          console.log(`[Server] Yielded ${chunkCount} chunks`)
        }
        yield JSON.stringify({
          type: 'content',
          data: chunk,
        } as RecapStreamResponse)
      }

      console.log(`[Server] MiniMax stream complete. Total chunks: ${chunkCount}`)
      yield JSON.stringify({
        type: 'done',
      } as RecapStreamResponse)
      console.log('[Server] Stream finished successfully')
    } catch (error) {
      console.error('[Server] Error generating recap:', error)
      yield JSON.stringify({
        type: 'error',
        data: error instanceof Error ? error.message : 'Failed to generate recap',
      } as RecapStreamResponse)
    }
  })
