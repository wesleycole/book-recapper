import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Clock, BookOpen, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { getRecentRecaps } from '~/server/recap'
import type { Recap } from '~/db/schema'
import type { TavilySearchResult } from '~/lib/tavily'

export const Route = createFileRoute('/recaps')({
  component: RecapsPage,
  loader: async () => {
    const recaps = await getRecentRecaps()
    return { recaps }
  },
  pendingComponent: RecapsLoading,
})

function RecapsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

interface RecapWithSources extends Omit<Recap, 'sources'> {
  sources: TavilySearchResult[]
}

function RecapsPage() {
  const { recaps } = Route.useLoaderData() as { recaps: RecapWithSources[] }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Recap History</h1>
        <p className="text-muted-foreground">
          Your previously generated book recaps
        </p>
      </div>

      {recaps.length === 0 ? (
        <div className="mx-auto max-w-md text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-semibold">No recaps yet</h2>
          <p className="text-muted-foreground">
            Generate your first book recap to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recaps.map((recap) => (
            <RecapCard key={recap.id} recap={recap} />
          ))}
        </div>
      )}
    </div>
  )
}

function RecapCard({ recap }: { recap: RecapWithSources }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSources, setShowSources] = useState(false)

  const previewLength = 500
  const needsTruncation = recap.recap.length > previewLength
  const displayContent = isExpanded
    ? recap.recap
    : recap.recap.slice(0, previewLength) + (needsTruncation ? '...' : '')

  const formattedDate = new Date(recap.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {recap.bookTitle}
              {recap.seriesName && (
                <Badge variant="secondary">{recap.seriesName}</Badge>
              )}
            </CardTitle>
            {recap.author && (
              <CardDescription>by {recap.author}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formattedDate}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose-recap whitespace-pre-wrap">{displayContent}</div>

        <div className="flex flex-wrap gap-2">
          {needsTruncation && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Read More
                </>
              )}
            </Button>
          )}

          {recap.sources.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSources(!showSources)}
            >
              <ExternalLink className="mr-1 h-4 w-4" />
              {showSources ? 'Hide' : 'Show'} Sources ({recap.sources.length})
            </Button>
          )}
        </div>

        {showSources && recap.sources.length > 0 && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-3 text-sm font-medium">Sources</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {recap.sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded border bg-background p-2 text-sm transition-colors hover:bg-accent"
                >
                  <p className="line-clamp-1 font-medium">{source.title}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {new URL(source.url).hostname}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
