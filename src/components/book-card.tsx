import { BookOpen, User, Calendar } from 'lucide-react'
import { cn } from '~/lib/utils'
import { WavyLinesBackground } from '~/components/ui/wavy-lines'
import { Badge } from '~/components/ui/badge'
import type { BookDetails } from '~/lib/openlib'

interface BookCardProps {
  book: BookDetails
  onClick?: () => void
  variant?: 'default' | 'compact' | 'featured' | 'carousel' | 'grid'
  className?: string
}

export function BookCard({ book, onClick, variant = 'default', className }: BookCardProps) {
  const isFeatured = variant === 'featured'
  const isCompact = variant === 'compact'
  const isCarousel = variant === 'carousel'
  const isGrid = variant === 'grid'

  // Grid variant - optimized for multi-column grids
  if (isGrid) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-all duration-300',
          'hover:border-primary/30 hover:shadow-lg',
          className
        )}
      >
        {/* Wavy lines background */}
        <div className="absolute inset-0">
          <WavyLinesBackground className="opacity-30 transition-opacity group-hover:opacity-50" />
        </div>

        {/* Book cover */}
        <div className="relative z-10 flex items-center justify-center p-3 pb-2">
          <div className="aspect-[2/3] w-full max-w-[120px] overflow-hidden rounded-md border border-border/50 bg-card shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Book info */}
        <div className="relative z-10 flex flex-col px-3 pb-3">
          <h3 className="font-serif text-sm font-semibold leading-tight text-foreground line-clamp-2">
            {book.title}
          </h3>
          {book.authors.length > 0 && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="line-clamp-1">{book.authors[0]}</span>
            </p>
          )}
          {book.publishYear && (
            <p className="mt-0.5 text-xs text-muted-foreground/70">
              {book.publishYear}
            </p>
          )}
        </div>
      </button>
    )
  }

  // Carousel variant - large cards with meta at bottom
  if (isCarousel) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'group relative flex h-[480px] w-[320px] flex-shrink-0 flex-col overflow-hidden rounded-md border border-border bg-card text-left transition-all duration-300',
          'hover:border-primary/30 hover:shadow-lg',
          className
        )}
      >
        {/* Wavy lines background - positioned at top */}
        <div className="absolute inset-x-0 top-0 h-48">
          <WavyLinesBackground className="opacity-40 transition-opacity group-hover:opacity-60" />
        </div>

        {/* Content container */}
        <div className="relative z-10 flex flex-1 flex-col">
          {/* Book cover - centered at top */}
          <div className="flex flex-1 items-center justify-center px-6 pt-8 pb-4">
            <div className="aspect-[2/3] w-40 flex-shrink-0 overflow-hidden rounded-md border border-border/50 bg-card shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <BookOpen className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Title and author - middle section */}
          <div className="px-6 pb-3 text-center">
            <h3 className="font-serif text-xl font-semibold leading-tight text-foreground line-clamp-2">
              {book.title}
            </h3>
            {book.authors.length > 0 && (
              <p className="mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="line-clamp-1">{book.authors.join(', ')}</span>
              </p>
            )}
            {book.publishYear && (
              <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {book.publishYear}
              </p>
            )}
          </div>

          {/* Meta info at bottom - small tags */}
          {book.subjects && book.subjects.length > 0 && (
            <div className="mt-auto border-t border-border/50 px-4 py-3">
              <div className="flex flex-wrap justify-center gap-1.5">
                {book.subjects.slice(0, 2).map((subject) => (
                  <Badge key={subject} variant="secondary" className="text-[10px] px-2 py-0.5">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card text-left transition-all duration-300',
        'hover:border-primary/30 hover:shadow-lg',
        isFeatured && 'p-6',
        isCompact && 'p-3',
        !isFeatured && !isCompact && 'p-4',
        className
      )}
    >
      {/* Wavy lines background */}
      <WavyLinesBackground className="opacity-60 transition-opacity group-hover:opacity-80" />

      {/* Content */}
      <div className={cn('relative z-10', isFeatured ? 'flex flex-col items-center text-center' : 'flex gap-4')}>
        {/* Book cover */}
        <div
          className={cn(
            'flex-shrink-0 overflow-hidden rounded-lg border border-border/50 bg-card shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl',
            isFeatured && 'aspect-[2/3] w-32',
            isCompact && 'h-24 w-16',
            !isFeatured && !isCompact && 'h-36 w-24'
          )}
        >
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <BookOpen className={cn('text-muted-foreground', isFeatured ? 'h-12 w-12' : 'h-8 w-8')} />
            </div>
          )}
        </div>

        {/* Book info */}
        <div className={cn('flex flex-1 flex-col', isFeatured && 'mt-4')}>
          <h3
            className={cn(
              'font-serif font-semibold leading-tight text-foreground',
              isFeatured && 'text-lg',
              isCompact && 'line-clamp-2 text-sm',
              !isFeatured && !isCompact && 'line-clamp-2 text-base'
            )}
          >
            {book.title}
          </h3>

          {book.authors.length > 0 && (
            <p
              className={cn(
                'mt-1 flex items-center gap-1 text-muted-foreground',
                isFeatured ? 'justify-center text-sm' : 'text-xs',
                isCompact && 'text-xs'
              )}
            >
              <User className="h-3 w-3" />
              <span className="line-clamp-1">{book.authors.join(', ')}</span>
            </p>
          )}

          {book.publishYear && !isCompact && (
            <p
              className={cn(
                'mt-1 flex items-center gap-1 text-muted-foreground',
                isFeatured ? 'justify-center text-sm' : 'text-xs'
              )}
            >
              <Calendar className="h-3 w-3" />
              {book.publishYear}
            </p>
          )}

          {book.subjects && book.subjects.length > 0 && !isCompact && (
            <div className={cn('mt-2 flex flex-wrap gap-1', isFeatured && 'justify-center')}>
              {book.subjects.slice(0, 2).map((subject) => (
                <Badge key={subject} variant="secondary" className="text-xs">
                  {subject}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

interface BookCardSkeletonProps {
  variant?: 'default' | 'compact' | 'featured' | 'carousel' | 'grid'
  className?: string
}

export function BookCardSkeleton({ variant = 'default', className }: BookCardSkeletonProps) {
  const isFeatured = variant === 'featured'
  const isCompact = variant === 'compact'
  const isCarousel = variant === 'carousel'
  const isGrid = variant === 'grid'

  // Grid variant skeleton
  if (isGrid) {
    return (
      <div
        className={cn(
          'relative flex flex-col overflow-hidden rounded-lg border border-border bg-card',
          className
        )}
      >
        <div className="absolute inset-0">
          <WavyLinesBackground className="opacity-20" />
        </div>
        <div className="relative z-10 flex items-center justify-center p-3 pb-2">
          <div className="aspect-[2/3] w-full max-w-[120px] animate-pulse rounded-md bg-muted" />
        </div>
        <div className="relative z-10 flex flex-col px-3 pb-3 space-y-1.5">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    )
  }

  // Carousel variant skeleton
  if (isCarousel) {
    return (
      <div
        className={cn(
          'relative flex h-[480px] w-[320px] flex-shrink-0 flex-col overflow-hidden rounded-md border border-border bg-card',
          className
        )}
      >
        <div className="absolute inset-x-0 top-0 h-48">
          <WavyLinesBackground className="opacity-20" />
        </div>
        <div className="relative z-10 flex flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center px-6 pt-8 pb-4">
            <div className="aspect-[2/3] w-40 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="px-6 pb-3 text-center space-y-2">
            <div className="mx-auto h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mx-auto h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="mx-auto h-4 w-1/4 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-auto border-t border-border/50 px-4 py-3">
            <div className="flex justify-center gap-1.5">
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card',
        isFeatured && 'p-6',
        isCompact && 'p-3',
        !isFeatured && !isCompact && 'p-4',
        className
      )}
    >
      <WavyLinesBackground className="opacity-30" />
      <div className={cn('relative z-10', isFeatured ? 'flex flex-col items-center' : 'flex gap-4')}>
        <div
          className={cn(
            'animate-pulse rounded-lg bg-muted',
            isFeatured && 'aspect-[2/3] w-32',
            isCompact && 'h-24 w-16',
            !isFeatured && !isCompact && 'h-36 w-24'
          )}
        />
        <div className={cn('flex-1 space-y-2', isFeatured && 'mt-4 text-center')}>
          <div className={cn('h-4 animate-pulse rounded bg-muted', isFeatured ? 'mx-auto w-3/4' : 'w-3/4')} />
          <div className={cn('h-3 animate-pulse rounded bg-muted', isFeatured ? 'mx-auto w-1/2' : 'w-1/2')} />
          {!isCompact && (
            <div className={cn('h-3 animate-pulse rounded bg-muted', isFeatured ? 'mx-auto w-1/4' : 'w-1/4')} />
          )}
        </div>
      </div>
    </div>
  )
}
