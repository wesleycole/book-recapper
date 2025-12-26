export interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
}

export interface TavilyResponse {
  results: TavilySearchResult[]
  query: string
}

export async function searchTavily(query: string): Promise<TavilyResponse> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not set')
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: `${query} book summary recap plot`,
      search_depth: 'advanced',
      include_answer: false,
      include_raw_content: false,
      max_results: 5,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Tavily search failed: ${error}`)
  }

  const data = await response.json()
  return {
    results: data.results || [],
    query: data.query || query,
  }
}
