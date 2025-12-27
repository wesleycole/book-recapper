import { useState } from 'react'
import { BookMarked, BookOpen, BookCheck, Check, Plus } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { SignInButton } from '@clerk/clerk-react'
import { api } from '../../convex/_generated/api'
import { cn } from '~/lib/utils'

type BookStatus = 'want_to_read' | 'reading' | 'read'

interface AddToLibraryButtonProps {
  bookId: string
  title: string
  author?: string
  coverUrl?: string
  variant?: 'default' | 'compact' | 'icon'
  className?: string
}

const statusConfig = {
  want_to_read: {
    label: 'Want to Read',
    shortLabel: 'Want to Read',
    icon: BookMarked,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 hover:bg-amber-200',
  },
  reading: {
    label: 'Currently Reading',
    shortLabel: 'Reading',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 hover:bg-blue-200',
  },
  read: {
    label: 'Read',
    shortLabel: 'Read',
    icon: BookCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-100 hover:bg-green-200',
  },
}

export function AddToLibraryButton({
  bookId,
  title,
  author,
  coverUrl,
  variant = 'default',
  className,
}: AddToLibraryButtonProps) {
  const { isAuthenticated } = useConvexAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const existingBook = useQuery(
    api.library.getBook,
    isAuthenticated ? { bookId } : 'skip'
  )
  const addBook = useMutation(api.library.addBook)
  const updateStatus = useMutation(api.library.updateStatus)

  const handleAddToLibrary = async (status: BookStatus) => {
    setIsAdding(true)
    try {
      if (existingBook) {
        await updateStatus({ id: existingBook._id, status })
      } else {
        await addBook({
          bookId,
          title,
          author,
          coverUrl,
          status,
        })
      }
    } finally {
      setIsAdding(false)
      setShowMenu(false)
    }
  }

  // Not authenticated - show sign in prompt
  if (!isAuthenticated) {
    if (variant === 'icon') {
      return (
        <SignInButton mode="modal">
          <button
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-content-fg/60 shadow-sm transition-all hover:bg-white hover:text-content-fg hover:shadow-md',
              className
            )}
            title="Sign in to add to library"
          >
            <Plus className="h-4 w-4" />
          </button>
        </SignInButton>
      )
    }

    return (
      <SignInButton mode="modal">
        <button
          className={cn(
            'flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-content-fg/70 shadow-sm transition-all hover:bg-white hover:text-content-fg hover:shadow-md',
            variant === 'compact' && 'px-2 py-1 text-xs',
            className
          )}
        >
          <Plus className={cn('h-4 w-4', variant === 'compact' && 'h-3 w-3')} />
          {variant !== 'compact' && 'Add to Library'}
        </button>
      </SignInButton>
    )
  }

  // Book already in library
  if (existingBook) {
    const status = statusConfig[existingBook.status]
    const StatusIcon = status.icon

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium shadow-sm transition-all hover:shadow-md',
            status.bgColor,
            status.color,
            variant === 'compact' && 'px-2 py-1 text-xs',
            variant === 'icon' && 'h-8 w-8 justify-center p-0',
            className
          )}
          title={status.label}
        >
          <StatusIcon className={cn('h-4 w-4', variant === 'compact' && 'h-3 w-3')} />
          {variant === 'default' && status.shortLabel}
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(false)
              }}
            />
            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-gold-dark/20 bg-white py-1 shadow-lg">
              {(Object.entries(statusConfig) as [BookStatus, typeof statusConfig.read][]).map(
                ([key, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={key}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToLibrary(key)
                      }}
                      disabled={isAdding}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50',
                        existingBook.status === key && 'bg-gray-50'
                      )}
                    >
                      <Icon className={cn('h-4 w-4', config.color)} />
                      {config.label}
                      {existingBook.status === key && (
                        <Check className="ml-auto h-4 w-4 text-green-600" />
                      )}
                    </button>
                  )
                }
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  // Not in library - show add button
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowMenu(!showMenu)
        }}
        disabled={isAdding}
        className={cn(
          'flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-content-fg/70 shadow-sm transition-all hover:bg-white hover:text-content-fg hover:shadow-md',
          variant === 'compact' && 'px-2 py-1 text-xs',
          variant === 'icon' && 'h-8 w-8 justify-center p-0',
          className
        )}
        title="Add to library"
      >
        <Plus className={cn('h-4 w-4', variant === 'compact' && 'h-3 w-3')} />
        {variant === 'default' && 'Add to Library'}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(false)
            }}
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-gold-dark/20 bg-white py-1 shadow-lg">
            {(Object.entries(statusConfig) as [BookStatus, typeof statusConfig.read][]).map(
              ([key, config]) => {
                const Icon = config.icon
                return (
                  <button
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddToLibrary(key)
                    }}
                    disabled={isAdding}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
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
  )
}
