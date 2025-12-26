export interface OpenLibraryBook {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
  edition_count?: number
  subject?: string[]
  language?: string[]
}

export interface OpenLibrarySearchResponse {
  numFound: number
  start: number
  docs: OpenLibraryBook[]
}

export interface BookDetails {
  key: string
  title: string
  authors: string[]
  publishYear?: number
  coverUrl?: string
  subjects?: string[]
  description?: string
}

export interface PaginatedSearchResult {
  books: BookDetails[]
  total: number
  hasMore: boolean
}

export async function searchBooks(query: string, limit = 20, offset = 0): Promise<PaginatedSearchResult> {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    offset: offset.toString(),
    fields: 'key,title,author_name,first_publish_year,cover_i,edition_count,subject',
  })

  const response = await fetch(`https://openlibrary.org/search.json?${params}`)
  if (!response.ok) {
    throw new Error('Failed to search Open Library')
  }

  const data: OpenLibrarySearchResponse = await response.json()

  const books = data.docs.map((doc) => ({
    key: doc.key,
    title: doc.title,
    authors: doc.author_name || ['Unknown Author'],
    publishYear: doc.first_publish_year,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : undefined,
    subjects: doc.subject?.slice(0, 5),
  }))

  return {
    books,
    total: data.numFound,
    hasMore: offset + books.length < data.numFound,
  }
}

export async function getBookDetails(workKey: string): Promise<BookDetails | null> {
  try {
    const response = await fetch(`https://openlibrary.org${workKey}.json`)
    if (!response.ok) return null

    const data = await response.json()

    let description: string | undefined
    if (typeof data.description === 'string') {
      description = data.description
    } else if (data.description?.value) {
      description = data.description.value
    }

    return {
      key: workKey,
      title: data.title,
      authors: [], // Would need additional API call to resolve author keys
      description,
      subjects: data.subjects?.slice(0, 10),
      coverUrl: data.covers?.[0]
        ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg`
        : undefined,
    }
  } catch {
    return null
  }
}

export async function searchSeries(query: string): Promise<PaginatedSearchResult> {
  // Search with series keywords to find book series
  return searchBooks(`${query} series`, 20, 0)
}
