import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { Search, Sparkles } from 'lucide-react'
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

function BrowsePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<BookDetails[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [lastSearchMode, setLastSearchMode] = useState<SearchMode>('text')
  const [aiExplanation, setAiExplanation] = useState('')

  const handleSearch = useCallback(
    async (mode: SearchMode) => {
      if (!searchQuery.trim()) return

      setIsLoading(true)
      setHasSearched(true)
      setLastSearchMode(mode)
      setAiExplanation('')

      try {
        if (mode === 'ai') {
          // Use AI-powered search for complex queries
          const response = await aiSearchBooksServer({ data: searchQuery.trim() })
          setResults(response.results)
          setAiExplanation(response.explanation)
        } else {
          // Use standard search for simple queries
          const data = await searchBooksServer({ data: searchQuery.trim() })
          setResults(data)
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [searchQuery]
  )

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
    <div className="min-h-[calc(100vh-4rem)] bg-content-bg">
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl font-light tracking-tight text-gold-dark sm:text-5xl">
          Browse the <span className="italic">Library</span>
        </h1>
        <p className="mt-3 text-content-fg/70">
          Search for books using the Open Library database
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
      {isLoading && (
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={i} variant="carousel" />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gold-dark/20" />
            <div className="flex items-center gap-2">
              {lastSearchMode === 'ai' && (
                <Sparkles className="h-4 w-4 text-purple-600" />
              )}
              <span className="text-sm font-medium text-content-fg/60">
                {results.length} results found
                {lastSearchMode === 'ai' && aiExplanation && (
                  <span className="ml-2 text-purple-600">• {aiExplanation}</span>
                )}
              </span>
            </div>
            <div className="h-px flex-1 bg-gold-dark/20" />
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
            {results.map((book) => (
              <BookCard
                key={book.key}
                book={book}
                onClick={() => handleSelectBook(book)}
                variant="carousel"
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && hasSearched && results.length === 0 && (
        <div className="mx-auto max-w-md text-center">
          <div className="relative mx-auto mb-6 h-24 w-24 overflow-hidden rounded-2xl border border-gold-dark/20 bg-white">
            <WavyLinesBackground className="opacity-50" />
            <div className="relative flex h-full w-full items-center justify-center">
              <Search className="h-10 w-10 text-content-fg/40" />
            </div>
          </div>
          <h2 className="mb-2 font-serif text-2xl font-light text-content-fg">No results found</h2>
          <p className="text-content-fg/60">
            {lastSearchMode === 'ai'
              ? "Try describing your book differently or use a simpler search term."
              : "Try adjusting your search terms or type more to enable AI-powered search."}
          </p>
        </div>
      )}

      {/* Initial State */}
      {!isLoading && !hasSearched && (
        <div className="mx-auto max-w-3xl">
          <Card className="relative overflow-hidden border-gold-dark/20 bg-white">
            <WavyLinesBackground className="opacity-20" />
            <CardHeader className="relative">
              <CardTitle className="font-serif text-2xl font-light text-content-fg">Discover Your Next Read</CardTitle>
              <CardDescription className="text-base text-content-fg/60">
                Type a book title for quick search, or describe what you're looking for
                to enable AI-powered search with the rainbow border effect.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-6">
                {/* Quick Searches */}
                <div>
                  <p className="text-sm font-medium text-content-fg/60 mb-3">
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
                        className="rounded-lg bg-content-bg text-content-fg hover:bg-gold-dark/10"
                        onClick={() => handleQuickSearch(term)}
                      >
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* AI Search Examples */}
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-3 flex items-center gap-2">
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
                        className="rounded-lg border-purple-300 text-purple-700 hover:bg-purple-50"
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
    </div>
  )
}
