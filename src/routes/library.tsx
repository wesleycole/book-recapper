import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { BookOpen, BookMarked, BookCheck, Star, Trash2, ChevronDown } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInButton } from '@clerk/clerk-react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { WavyLinesBackground } from '~/components/ui/wavy-lines'

export const Route = createFileRoute('/library')({
  component: LibraryPage,
})

type BookStatus = 'want_to_read' | 'reading' | 'read'

const statusConfig = {
  want_to_read: {
    label: 'Want to Read',
    icon: BookMarked,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  reading: {
    label: 'Currently Reading',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  read: {
    label: 'Read',
    icon: BookCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
}

function LibraryPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-content-bg">
      <Unauthenticated>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mx-auto max-w-md">
            <div className="relative mx-auto mb-6 h-24 w-24 overflow-hidden rounded-2xl border border-gold-dark/20 bg-white">
              <WavyLinesBackground className="opacity-50" />
              <div className="relative flex h-full w-full items-center justify-center">
                <BookMarked className="h-10 w-10 text-content-fg/40" />
              </div>
            </div>
            <h1 className="mb-4 font-display text-3xl font-light tracking-tight text-gold-dark">
              Your Personal Library
            </h1>
            <p className="mb-6 text-content-fg/70">
              Sign in to track books you've read, want to read, and are currently reading.
            </p>
            <SignInButton mode="modal">
              <Button className="bg-primary/90 text-white hover:bg-primary">
                Sign In to Get Started
              </Button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>
      <Authenticated>
        <LibraryContent />
      </Authenticated>
    </div>
  )
}

function LibraryContent() {
  const [activeFilter, setActiveFilter] = useState<BookStatus | 'all'>('all')
  const stats = useQuery(api.library.getStats)
  const books = useQuery(api.library.listBooks,
    activeFilter === 'all' ? {} : { status: activeFilter }
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl font-light tracking-tight text-gold-dark sm:text-5xl">
          My <span className="italic">Library</span>
        </h1>
        <p className="mt-3 text-content-fg/70">
          Track your reading journey
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mx-auto mb-8 grid max-w-2xl grid-cols-4 gap-4">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              'rounded-lg border p-4 text-center transition-all',
              activeFilter === 'all'
                ? 'border-gold-dark/40 bg-gold-dark/10'
                : 'border-gold-dark/20 bg-white hover:border-gold-dark/40'
            )}
          >
            <div className="text-2xl font-semibold text-content-fg">{stats.total}</div>
            <div className="text-sm text-content-fg/60">Total</div>
          </button>
          <button
            onClick={() => setActiveFilter('reading')}
            className={cn(
              'rounded-lg border p-4 text-center transition-all',
              activeFilter === 'reading'
                ? 'border-blue-400 bg-blue-50'
                : 'border-gold-dark/20 bg-white hover:border-blue-400'
            )}
          >
            <div className="text-2xl font-semibold text-blue-600">{stats.reading}</div>
            <div className="text-sm text-content-fg/60">Reading</div>
          </button>
          <button
            onClick={() => setActiveFilter('want_to_read')}
            className={cn(
              'rounded-lg border p-4 text-center transition-all',
              activeFilter === 'want_to_read'
                ? 'border-amber-400 bg-amber-50'
                : 'border-gold-dark/20 bg-white hover:border-amber-400'
            )}
          >
            <div className="text-2xl font-semibold text-amber-600">{stats.wantToRead}</div>
            <div className="text-sm text-content-fg/60">Want to Read</div>
          </button>
          <button
            onClick={() => setActiveFilter('read')}
            className={cn(
              'rounded-lg border p-4 text-center transition-all',
              activeFilter === 'read'
                ? 'border-green-400 bg-green-50'
                : 'border-gold-dark/20 bg-white hover:border-green-400'
            )}
          >
            <div className="text-2xl font-semibold text-green-600">{stats.read}</div>
            <div className="text-sm text-content-fg/60">Read</div>
          </button>
        </div>
      )}

      {/* Books List */}
      {books && books.length > 0 ? (
        <div className="mx-auto max-w-4xl space-y-4">
          {books.map((book) => (
            <LibraryBookCard key={book._id} book={book} />
          ))}
        </div>
      ) : books && books.length === 0 ? (
        <EmptyLibrary filter={activeFilter} />
      ) : (
        <div className="mx-auto max-w-4xl space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <LibraryBookCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  )
}

interface LibraryBook {
  _id: Id<'library'>
  bookId: string
  title: string
  author?: string
  coverUrl?: string
  status: BookStatus
  rating?: number
  notes?: string
  startedAt?: number
  finishedAt?: number
  createdAt: number
  updatedAt: number
}

function LibraryBookCard({ book }: { book: LibraryBook }) {
  const navigate = useNavigate()
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const updateStatus = useMutation(api.library.updateStatus)
  const updateRating = useMutation(api.library.updateRating)
  const removeBook = useMutation(api.library.removeBook)

  const status = statusConfig[book.status]
  const StatusIcon = status.icon

  const handleStatusChange = async (newStatus: BookStatus) => {
    await updateStatus({ id: book._id, status: newStatus })
    setShowStatusMenu(false)
  }

  const handleRatingChange = async (rating: number) => {
    await updateRating({ id: book._id, rating })
  }

  const handleRemove = async () => {
    if (confirm('Remove this book from your library?')) {
      await removeBook({ id: book._id })
    }
  }

  const handleGetRecap = () => {
    navigate({
      to: '/',
      search: { title: book.title, author: book.author },
    })
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gold-dark/20 bg-white p-4 transition-all hover:border-gold-dark/40 hover:shadow-md">
      <WavyLinesBackground className="opacity-20" />
      <div className="relative z-10 flex gap-4">
        {/* Cover */}
        <div className="h-32 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-gold-dark/10 bg-gray-100">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-8 w-8 text-content-fg/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col">
          <h3 className="font-serif text-lg font-semibold text-content-fg line-clamp-1">
            {book.title}
          </h3>
          {book.author && (
            <p className="mt-0.5 text-sm text-content-fg/60">{book.author}</p>
          )}

          {/* Rating */}
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingChange(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'h-4 w-4',
                    book.rating && star <= book.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  )}
                />
              </button>
            ))}
            {book.rating && (
              <span className="ml-1 text-sm text-content-fg/60">
                {book.rating}/5
              </span>
            )}
          </div>

          {/* Status and Actions */}
          <div className="mt-auto flex items-center gap-2 pt-2">
            {/* Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors',
                  status.bgColor,
                  status.color
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showStatusMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowStatusMenu(false)}
                  />
                  <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-gold-dark/20 bg-white py-1 shadow-lg">
                    {(Object.entries(statusConfig) as [BookStatus, typeof statusConfig.read][]).map(
                      ([key, config]) => {
                        const Icon = config.icon
                        return (
                          <button
                            key={key}
                            onClick={() => handleStatusChange(key)}
                            className={cn(
                              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50',
                              book.status === key && 'bg-gray-50'
                            )}
                          >
                            <Icon className={cn('h-4 w-4', config.color)} />
                            {config.label}
                          </button>
                        )
                      }
                    )}
                  </div>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleGetRecap}
              className="text-content-fg/60 hover:text-content-fg"
            >
              Get Recap
            </Button>

            <button
              onClick={handleRemove}
              className="ml-auto p-1.5 text-content-fg/40 transition-colors hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LibraryBookCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gold-dark/20 bg-white p-4">
      <WavyLinesBackground className="opacity-20" />
      <div className="relative z-10 flex gap-4">
        <div className="h-32 w-20 animate-pulse rounded-lg bg-gray-200" />
        <div className="flex flex-1 flex-col space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="mt-auto h-8 w-32 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  )
}

function EmptyLibrary({ filter }: { filter: BookStatus | 'all' }) {
  const navigate = useNavigate()

  const getMessage = () => {
    switch (filter) {
      case 'reading':
        return "You're not currently reading any books."
      case 'want_to_read':
        return "You don't have any books on your want-to-read list."
      case 'read':
        return "You haven't marked any books as read yet."
      default:
        return "Your library is empty. Start by adding some books!"
    }
  }

  return (
    <div className="mx-auto max-w-md text-center py-12">
      <div className="relative mx-auto mb-6 h-24 w-24 overflow-hidden rounded-2xl border border-gold-dark/20 bg-white">
        <WavyLinesBackground className="opacity-50" />
        <div className="relative flex h-full w-full items-center justify-center">
          <BookOpen className="h-10 w-10 text-content-fg/40" />
        </div>
      </div>
      <h2 className="mb-2 font-serif text-2xl font-light text-content-fg">
        No books here
      </h2>
      <p className="mb-6 text-content-fg/60">{getMessage()}</p>
      <Button
        onClick={() => navigate({ to: '/browse' })}
        className="bg-primary/90 text-white hover:bg-primary"
      >
        Browse Books
      </Button>
    </div>
  )
}
