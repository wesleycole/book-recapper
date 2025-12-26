import { createServerFn } from '@tanstack/react-start'
import { searchBooks, searchSeries, getBookDetails, type BookDetails } from '~/lib/openlib'

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

export const aiSearchBooksServer = createServerFn({ method: 'GET' })
  .inputValidator((query: string) => query)
  .handler(async ({ data: query }) => {
    if (!query || query.length < 2) {
      return { results: [], explanation: '' }
    }

    // Extract search terms using AI
    const { searchQueries, explanation } = await extractSearchTerms(query)
    console.log('[AI Search] Queries:', searchQueries, 'Explanation:', explanation)

    // Perform parallel searches
    const searchPromises = searchQueries.map(q => searchBooks(q, 10))
    const searchResults = await Promise.all(searchPromises)

    // Combine and deduplicate results
    const seenKeys = new Set<string>()
    const combinedResults: BookDetails[] = []

    for (const results of searchResults) {
      for (const book of results) {
        if (!seenKeys.has(book.key)) {
          seenKeys.add(book.key)
          combinedResults.push(book)
        }
      }
    }

    // Limit to 20 results
    return {
      results: combinedResults.slice(0, 20),
      explanation
    }
  })

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
