import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { BookOpen, Sparkles, Search, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { streamRecap, type RecapStreamResponse } from '~/server/recap'
import type { TavilySearchResult } from '~/lib/tavily'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()
  const [bookTitle, setBookTitle] = useState('')
  const [seriesName, setSeriesName] = useState('')
  const [author, setAuthor] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [sources, setSources] = useState<TavilySearchResult[]>([])
  const [recapContent, setRecapContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recapId, setRecapId] = useState<number | null>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!bookTitle.trim()) return

      setIsLoading(true)
      setError(null)
      setSources([])
      setRecapContent('')
      setRecapId(null)

      try {
        const stream = await streamRecap({
          data: {
            bookTitle: bookTitle.trim(),
            seriesName: seriesName.trim() || undefined,
            author: author.trim() || undefined,
            additionalContext: additionalContext.trim() || undefined,
          },
        })

        for await (const chunk of stream) {
          try {
            const parsed: RecapStreamResponse = JSON.parse(chunk)

            switch (parsed.type) {
              case 'sources':
                if (parsed.sources) {
                  setSources(parsed.sources)
                }
                break
              case 'content':
                if (parsed.data) {
                  setRecapContent((prev) => prev + parsed.data)
                }
                break
              case 'done':
                if (parsed.recapId) {
                  setRecapId(parsed.recapId)
                }
                setIsLoading(false)
                break
              case 'error':
                setError(parsed.data || 'An error occurred')
                setIsLoading(false)
                break
            }
          } catch {
            // Skip invalid JSON chunks
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setIsLoading(false)
      }
    },
    [bookTitle, seriesName, author, additionalContext]
  )

  const handleReset = () => {
    setBookTitle('')
    setSeriesName('')
    setAuthor('')
    setAdditionalContext('')
    setSources([])
    setRecapContent('')
    setError(null)
    setRecapId(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      {!recapContent && !isLoading && (
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Never Forget What Happened
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Get AI-powered recaps of your favorite book series. Perfect for when a new
            book comes out and you need to remember what happened in the previous ones.
          </p>
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Request a Recap
            </CardTitle>
            <CardDescription>
              Enter the book or series you want to recap. The more details you provide,
              the better the summary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="bookTitle" className="text-sm font-medium">
                    Book Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="bookTitle"
                    placeholder="e.g., The Way of Kings"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="seriesName" className="text-sm font-medium">
                    Series Name
                  </label>
                  <Input
                    id="seriesName"
                    placeholder="e.g., The Stormlight Archive"
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="author" className="text-sm font-medium">
                  Author
                </label>
                <Input
                  id="author"
                  placeholder="e.g., Brandon Sanderson"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="context" className="text-sm font-medium">
                  Additional Context
                </label>
                <Textarea
                  id="context"
                  placeholder="Any specific details you want to focus on, characters to highlight, or questions you have..."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading || !bookTitle.trim()}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Recap
                    </>
                  )}
                </Button>
                {(recapContent || error) && (
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Start Over
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Sources Section */}
        {sources.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ExternalLink className="h-4 w-4" />
                Sources
              </CardTitle>
              <CardDescription>
                Web sources used to ground the recap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {sources.map((source, index) => (
                  <a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <p className="mb-1 line-clamp-1 font-medium group-hover:text-primary">
                      {source.title}
                    </p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {source.content}
                    </p>
                    <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                      {new URL(source.url).hostname}
                    </p>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recap Content */}
        {(recapContent || isLoading) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {bookTitle}
                  {seriesName && (
                    <Badge variant="secondary" className="ml-2">
                      {seriesName}
                    </Badge>
                  )}
                </CardTitle>
                {recapId && (
                  <Badge variant="outline">Saved</Badge>
                )}
              </div>
              {author && (
                <CardDescription>by {author}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`prose-recap whitespace-pre-wrap ${isLoading ? 'streaming-cursor' : ''}`}
              >
                {recapContent || (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching for information and generating recap...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Start Suggestions */}
        {!recapContent && !isLoading && (
          <div className="mt-12">
            <h2 className="mb-4 text-center text-lg font-semibold text-muted-foreground">
              Popular Series to Recap
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'A Game of Thrones', series: 'A Song of Ice and Fire', author: 'George R.R. Martin' },
                { title: 'The Way of Kings', series: 'The Stormlight Archive', author: 'Brandon Sanderson' },
                { title: 'The Name of the Wind', series: 'The Kingkiller Chronicle', author: 'Patrick Rothfuss' },
                { title: 'The Eye of the World', series: 'The Wheel of Time', author: 'Robert Jordan' },
                { title: 'Mistborn: The Final Empire', series: 'Mistborn', author: 'Brandon Sanderson' },
                { title: 'The Lies of Locke Lamora', series: 'Gentleman Bastard', author: 'Scott Lynch' },
              ].map((book) => (
                <button
                  key={book.title}
                  onClick={() => {
                    setBookTitle(book.title)
                    setSeriesName(book.series)
                    setAuthor(book.author)
                  }}
                  className="rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent"
                >
                  <p className="font-medium">{book.title}</p>
                  <p className="text-sm text-muted-foreground">{book.series}</p>
                  <p className="text-xs text-muted-foreground">by {book.author}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
