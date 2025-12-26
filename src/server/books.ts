import { createServerFn } from '@tanstack/react-start'
import { searchBooks, searchSeries, getBookDetails, type BookDetails, type PaginatedSearchResult } from '~/lib/openlib'

interface AISearchTerms {
  searchQueries: string[]
  explanation: string
}

async function extractSearchTerms(naturalQuery: string): Promise<AISearchTerms> {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) {
    // Fallback to simple search if no API key
    return {
      searchQueries: [naturalQuery],
      explanation: 'Direct search'
    }
  }

  const response = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'MiniMax-Text-01',
      messages: [
        {
          role: 'system',
          content: `You are a book search expert. Given a natural language query about books, extract the most effective search terms to find relevant books in the Open Library database.

Return a JSON object with:
- searchQueries: Array of 2-4 search strings optimized for Open Library (include author names, book titles, series names, genre keywords)
- explanation: Brief explanation of how you interpreted the query

Examples:
User: "fantasy books like game of thrones with dragons"
Output: {"searchQueries": ["fantasy dragons epic", "A Song of Ice and Fire", "dragon fantasy series", "George R.R. Martin"],"explanation": "Searching for fantasy with dragons, similar to GoT"}

User: "mystery novels set in victorian england by women authors"
Output: {"searchQueries": ["victorian mystery", "Agatha Christie", "historical mystery England", "women detective fiction"],"explanation": "Victorian era mysteries by female authors"}

User: "books about artificial intelligence and robots becoming conscious"
Output: {"searchQueries": ["artificial intelligence fiction", "robot consciousness", "AI science fiction", "Isaac Asimov robots"],"explanation": "AI/robot sci-fi with consciousness themes"}

Only return valid JSON, no other text.`
        },
        {
          role: 'user',
          content: naturalQuery
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    console.error('MiniMax API error:', await response.text())
    return {
      searchQueries: [naturalQuery],
      explanation: 'Fallback to direct search'
    }
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  try {
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        searchQueries: parsed.searchQueries || [naturalQuery],
        explanation: parsed.explanation || 'AI interpreted search'
      }
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e)
  }

  return {
    searchQueries: [naturalQuery],
    explanation: 'Fallback to direct search'
  }
}

interface AISearchInput {
  query: string
  offset?: number
}

export const aiSearchBooksServer = createServerFn({ method: 'GET' })
  .inputValidator((input: AISearchInput) => input)
  .handler(async ({ data }) => {
    const { query, offset = 0 } = data
    if (!query || query.length < 2) {
      return { results: [], explanation: '', total: 0, hasMore: false }
    }

    // Extract search terms using AI
    const { searchQueries, explanation } = await extractSearchTerms(query)
    console.log('[AI Search] Queries:', searchQueries, 'Explanation:', explanation)

    // Perform parallel searches with pagination
    const limit = 10
    const searchPromises = searchQueries.map(q => searchBooks(q, limit, offset))
    const searchResults = await Promise.all(searchPromises)

    // Combine and deduplicate results
    const seenKeys = new Set<string>()
    const combinedResults: BookDetails[] = []
    let maxTotal = 0

    for (const result of searchResults) {
      maxTotal = Math.max(maxTotal, result.total)
      for (const book of result.books) {
        if (!seenKeys.has(book.key)) {
          seenKeys.add(book.key)
          combinedResults.push(book)
        }
      }
    }

    // Limit to 20 results per page
    const paginatedResults = combinedResults.slice(0, 20)

    return {
      results: paginatedResults,
      explanation,
      total: maxTotal,
      hasMore: offset + paginatedResults.length < maxTotal
    }
  })

interface SearchInput {
  query: string
  offset?: number
}

export const searchBooksServer = createServerFn({ method: 'GET' })
  .inputValidator((input: SearchInput) => input)
  .handler(async ({ data }) => {
    const { query, offset = 0 } = data
    if (!query || query.length < 2) {
      return { books: [], total: 0, hasMore: false }
    }
    return searchBooks(query, 20, offset)
  })

export const searchSeriesServer = createServerFn({ method: 'GET' })
  .inputValidator((input: SearchInput) => input)
  .handler(async ({ data }) => {
    const { query, offset = 0 } = data
    if (!query || query.length < 2) {
      return { books: [], total: 0, hasMore: false }
    }
    return searchSeries(query)
  })

export const getBookDetailsServer = createServerFn({ method: 'GET' })
  .inputValidator((workKey: string) => workKey)
  .handler(async ({ data: workKey }) => {
    return getBookDetails(workKey)
  })
