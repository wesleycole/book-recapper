import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { BookCard, BookCardSkeleton } from '~/components/book-card'
import { WavyLinesBackground } from '~/components/ui/wavy-lines'
import { SmartSearchInput, type SearchMode } from '~/components/ui/smart-search-input'
import { searchBooksServer, searchSeriesServer, aiSearchBooksServer } from '~/server/books'
import type { BookDetails } from '~/lib/openlib'

export const Route = createFileRoute('/browse')({
  component: BrowsePage,
})

// Random genres to select from for initial page load
const RANDOM_GENRES = [
  'fantasy',
  'science fiction',
  'mystery',
  'thriller',
  'romance',
  'historical fiction',
  'horror',
  'adventure',
  'detective',
  'dystopian',
  'crime',
  'magic',
  'space opera',
  'urban fantasy',
  'epic fantasy',
  'psychological thriller',
  'cozy mystery',
  'contemporary romance',
  'paranormal',
  'steampunk',
]

function BrowsePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true) // Start with loading true for initial load
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [results, setResults] = useState<BookDetails[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [lastSearchMode, setLastSearchMode] = useState<SearchMode>('text')
  const [aiExplanation, setAiExplanation] = useState('')
  const [currentOffset, setCurrentOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [currentGenre, setCurrentGenre] = useState('')
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const currentSearchQuery = useRef('')

  // Load random books on initial page load
  useEffect(() => {
    const loadRandomBooks = async () => {
      const randomGenre = RANDOM_GENRES[Math.floor(Math.random() * RANDOM_GENRES.length)]
      setCurrentGenre(randomGenre)
      currentSearchQuery.current = randomGenre

      try {
        const data = await searchBooksServer({ data: { query: randomGenre, offset: 0 } })
        setResults(data.books)
        setHasMore(data.hasMore)
        setTotalResults(data.total)
      } catch (error) {
        console.error('Error loading random books:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    loadRandomBooks()
  }, []) // Empty dependency array means this runs once on mount

  const handleSearch = useCallback(
    async (mode: SearchMode) => {
      if (!searchQuery.trim()) return

      setIsLoading(true)
      setHasSearched(true)
      setLastSearchMode(mode)
      setAiExplanation('')
      setCurrentOffset(0)
      setCurrentGenre('') // Clear genre when user searches
      currentSearchQuery.current = searchQuery.trim()

      try {
        if (mode === 'ai') {
          // Use AI-powered search for complex queries
          const response = await aiSearchBooksServer({ data: { query: searchQuery.trim(), offset: 0 } })
          setResults(response.results)
          setAiExplanation(response.explanation)
          setHasMore(response.hasMore)
          setTotalResults(response.total)
        } else {
          // Use standard search for simple queries
          const data = await searchBooksServer({ data: { query: searchQuery.trim(), offset: 0 } })
          setResults(data.books)
          setHasMore(data.hasMore)
          setTotalResults(data.total)
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
        setHasMore(false)
        setTotalResults(0)
      } finally {
        setIsLoading(false)
      }
    },
    [searchQuery]
  )

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !currentSearchQuery.current) return

    setIsLoadingMore(true)
    const nextOffset = currentOffset + 20

    try {
      if (lastSearchMode === 'ai') {
        const response = await aiSearchBooksServer({
          data: { query: currentSearchQuery.current, offset: nextOffset }
        })
        setResults(prev => [...prev, ...response.results])
        setHasMore(response.hasMore)
      } else {
        const data = await searchBooksServer({
          data: { query: currentSearchQuery.current, offset: nextOffset }
        })
        setResults(prev => [...prev, ...data.books])
        setHasMore(data.hasMore)
      }
      setCurrentOffset(nextOffset)
    } catch (error) {
      console.error('Load more error:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, currentOffset, lastSearchMode])

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

  const handleSelectBook = (book: BookDetails) => {
    navigate({
      to: '/',
      search: {
        title: book.title,
        author: book.authors[0],
      },
    })
  }

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-serif text-4xl font-light tracking-tight text-foreground">
          Browse the <span className="italic">Library</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          {currentGenre && !hasSearched ? (
            <>Discover books from random genres, or search for something specific</>
          ) : (
            <>Search for books using the Open Library database</>
          )}
        </p>
      </div>

      {/* Smart Search Input */}
      <div className="mx-auto mb-8 max-w-2xl">
        <SmartSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearch}
          isLoading={isLoading}
          placeholder="Search for a book or describe what you're looking for..."
        />
      </div>

      {/* Loading State */}
      {isLoading && results.length === 0 && (
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <BookCardSkeleton key={i} variant="grid" />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-2">
              {lastSearchMode === 'ai' && (
                <Sparkles className="h-4 w-4 text-purple-500" />
              )}
              <span className="text-sm font-medium text-muted-foreground">
                {currentGenre && !hasSearched ? (
                  <>
                    Explore <span className="italic capitalize">{currentGenre}</span> • {results.length} of {totalResults} books
                  </>
                ) : (
                  <>
                    {results.length} of {totalResults} results
                    {lastSearchMode === 'ai' && aiExplanation && (
                      <span className="ml-2 text-purple-500">• {aiExplanation}</span>
                    )}
                  </>
                )}
              </span>
            </div>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {results.map((book) => (
              <BookCard
                key={book.key}
                book={book}
                onClick={() => handleSelectBook(book)}
                variant="grid"
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={loadMoreRef} className="mt-8 flex justify-center py-4">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading more books...</span>
                </div>
              )}
            </div>
          )}

          {/* End of results message */}
          {!hasMore && results.length > 0 && (
            <div className="mt-8 flex justify-center py-4">
              <div className="text-sm text-muted-foreground">
                You've reached the end of the results
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {!isLoading && hasSearched && results.length === 0 && (
        <div className="mx-auto max-w-md text-center">
          <div className="relative mx-auto mb-6 h-24 w-24 overflow-hidden rounded-2xl border border-border bg-card">
            <WavyLinesBackground className="opacity-50" />
            <div className="relative flex h-full w-full items-center justify-center">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <h2 className="mb-2 font-serif text-2xl font-light">No results found</h2>
          <p className="text-muted-foreground">
            {lastSearchMode === 'ai'
              ? "Try describing your book differently or use a simpler search term."
              : "Try adjusting your search terms or type more to enable AI-powered search."}
          </p>
        </div>
      )}

      {/* Initial State - Only show if no results */}
      {!isLoading && !hasSearched && results.length === 0 && (
        <div className="mx-auto max-w-3xl">
          <Card className="relative overflow-hidden">
            <WavyLinesBackground className="opacity-40" />
            <CardHeader className="relative">
              <CardTitle className="font-serif text-2xl font-light">Discover Your Next Read</CardTitle>
              <CardDescription className="text-base">
                Type a book title for quick search, or describe what you're looking for
                to enable AI-powered search with the rainbow border effect.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-6">
                {/* Quick Searches */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Quick searches:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Harry Potter',
                      'The Hunger Games',
                      'Sherlock Holmes',
                      'Jack Reacher',
                      'Outlander',
                      'Percy Jackson',
                    ].map((term) => (
                      <Button
                        key={term}
                        variant="secondary"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => handleQuickSearch(term)}
                      >
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* AI Search Examples */}
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Try AI-powered searches:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Fantasy books with dragons like Game of Thrones',
                      'Mystery novels set in Victorian England',
                      'Science fiction about artificial intelligence',
                      'Romance books with enemies to lovers trope',
                    ].map((term) => (
                      <Button
                        key={term}
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
                        onClick={() => handleQuickSearch(term)}
                      >
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
