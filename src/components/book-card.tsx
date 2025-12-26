import { BookOpen, User, Calendar } from 'lucide-react'
import { cn } from '~/lib/utils'
import { WavyLinesBackground } from '~/components/ui/wavy-lines'
import { Badge } from '~/components/ui/badge'
import type { BookDetails } from '~/lib/openlib'

interface BookCardProps {
  book: BookDetails
  onClick?: () => void
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

export function BookCard({ book, onClick, variant = 'default', className }: BookCardProps) {
  const isFeatured = variant === 'featured'
  const isCompact = variant === 'compact'

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
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

export function BookCardSkeleton({ variant = 'default', className }: BookCardSkeletonProps) {
  const isFeatured = variant === 'featured'
  const isCompact = variant === 'compact'

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
