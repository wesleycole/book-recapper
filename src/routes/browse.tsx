import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { Search, Loader2, Library, BookMarked } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { BookCard, BookCardSkeleton } from '~/components/book-card'
import { WavyLinesBackground } from '~/components/ui/wavy-lines'
import { searchBooksServer, searchSeriesServer } from '~/server/books'
import type { BookDetails } from '~/lib/openlib'

export const Route = createFileRoute('/browse')({
  component: BrowsePage,
})

function BrowsePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'books' | 'series'>('series')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<BookDetails[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!searchQuery.trim()) return

      setIsLoading(true)
      setHasSearched(true)

      try {
        const searchFn = searchType === 'series' ? searchSeriesServer : searchBooksServer
        const data = await searchFn({ data: searchQuery.trim() })
        setResults(data)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [searchQuery, searchType]
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="font-serif text-4xl font-light tracking-tight text-foreground">
          Browse the <span className="italic">Library</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Search for books and series using the Open Library database
        </p>
      </div>

      {/* Search Form */}
      <div className="mx-auto mb-10 max-w-2xl">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for a book or series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl py-6 pl-12 text-base"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="h-auto rounded-xl px-6"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant={searchType === 'series' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('series')}
              className="gap-2 rounded-lg"
            >
              <Library className="h-4 w-4" />
              Series
            </Button>
            <Button
              type="button"
              variant={searchType === 'books' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('books')}
              className="gap-2 rounded-lg"
            >
              <BookMarked className="h-4 w-4" />
              Individual Books
            </Button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm font-medium text-muted-foreground">
              {results.length} results found
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((book) => (
              <BookCard
                key={book.key}
                book={book}
                onClick={() => handleSelectBook(book)}
              />
            ))}
          </div>
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
            Try adjusting your search terms or search for a different book/series.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!isLoading && !hasSearched && (
        <div className="mx-auto max-w-3xl">
          <Card className="relative overflow-hidden">
            <WavyLinesBackground className="opacity-40" />
            <CardHeader className="relative">
              <CardTitle className="font-serif text-2xl font-light">Discover Your Next Read</CardTitle>
              <CardDescription className="text-base">
                Search the Open Library database to find books and series, then get
                AI-powered recaps to refresh your memory.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Popular searches:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Harry Potter',
                    'The Hunger Games',
                    'Sherlock Holmes',
                    'Jack Reacher',
                    'Outlander',
                    'The Handmaid\'s Tale',
                    'The Girl with the Dragon Tattoo',
                    'Percy Jackson',
                  ].map((term) => (
                    <Button
                      key={term}
                      variant="secondary"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => {
                        setSearchQuery(term)
                        setSearchType('series')
                      }}
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
