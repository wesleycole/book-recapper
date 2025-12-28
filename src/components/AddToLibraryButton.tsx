import { useState } from 'react'
import { BookMarked, BookOpen, BookCheck, Check, Plus, LogIn } from 'lucide-react'
import { useMutation, useQuery, useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
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
  const { signIn } = useAuthActions()
  const [showMenu, setShowMenu] = useState(false)
  const [showSignInMenu, setShowSignInMenu] = useState(false)
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
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowSignInMenu(!showSignInMenu)
            }}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-content-fg/60 shadow-sm transition-all hover:bg-white hover:text-content-fg hover:shadow-md',
              className
            )}
            title="Sign in to add to library"
          >
            <Plus className="h-4 w-4" />
          </button>
          {showSignInMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSignInMenu(false)
                }}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gold-dark/20 bg-white p-2 shadow-lg">
                <p className="mb-2 px-2 text-xs text-gray-500">Sign in to save books</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    void signIn('github')
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    void signIn('google')
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
              </div>
            </>
          )}
        </div>
      )
    }

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowSignInMenu(!showSignInMenu)
          }}
          className={cn(
            'flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-content-fg/70 shadow-sm transition-all hover:bg-white hover:text-content-fg hover:shadow-md',
            variant === 'compact' && 'px-2 py-1 text-xs',
            className
          )}
        >
          <Plus className={cn('h-4 w-4', variant === 'compact' && 'h-3 w-3')} />
          {variant !== 'compact' && 'Add to Library'}
        </button>
        {showSignInMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation()
                setShowSignInMenu(false)
              }}
            />
            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gold-dark/20 bg-white p-2 shadow-lg">
              <p className="mb-2 px-2 text-xs text-gray-500">Sign in to save books</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  void signIn('github')
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  void signIn('google')
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </div>
          </>
        )}
      </div>
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
