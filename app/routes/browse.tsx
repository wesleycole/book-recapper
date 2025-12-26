import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { Search, BookOpen, User, Calendar, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
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
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Browse Books</h1>
        <p className="text-muted-foreground">
          Search for books and series using the Open Library database
        </p>
      </div>

      {/* Search Form */}
      <div className="mx-auto mb-8 max-w-2xl">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for a book or series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading || !searchQuery.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
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
            >
              Series
            </Button>
            <Button
              type="button"
              variant={searchType === 'books' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('books')}
            >
              Individual Books
            </Button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-32 w-24 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-sm text-muted-foreground">
            Found {results.length} results
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((book) => (
              <Card
                key={book.key}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => handleSelectBook(book)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="h-32 w-24 flex-shrink-0 rounded object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-32 w-24 flex-shrink-0 items-center justify-center rounded bg-muted">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col">
                      <h3 className="line-clamp-2 font-medium leading-tight">
                        {book.title}
                      </h3>
                      {book.authors.length > 0 && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="line-clamp-1">{book.authors.join(', ')}</span>
                        </p>
                      )}
                      {book.publishYear && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {book.publishYear}
                        </p>
                      )}
                      {book.subjects && book.subjects.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {book.subjects.slice(0, 2).map((subject) => (
                            <Badge
                              key={subject}
                              variant="secondary"
                              className="text-xs"
                            >
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && hasSearched && results.length === 0 && (
        <div className="mx-auto max-w-md text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-semibold">No results found</h2>
          <p className="text-muted-foreground">
            Try adjusting your search terms or search for a different book/series.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!isLoading && !hasSearched && (
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Discover Books</CardTitle>
              <CardDescription>
                Search the Open Library database to find books and series, then get
                AI-powered recaps to refresh your memory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Try searching for:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Stormlight Archive',
                    'Wheel of Time',
                    'Mistborn',
                    'A Song of Ice and Fire',
                    'The Expanse',
                    'Dune',
                    'Harry Potter',
                    'Lord of the Rings',
                  ].map((term) => (
                    <Button
                      key={term}
                      variant="outline"
                      size="sm"
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
