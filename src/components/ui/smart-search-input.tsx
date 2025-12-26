import * as React from 'react'
import { Search, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '~/lib/utils'

export type SearchMode = 'text' | 'ai'

export interface SmartSearchInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (mode: SearchMode) => void
  placeholder?: string
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

function detectSearchMode(query: string): SearchMode {
  const trimmed = query.trim()
  if (!trimmed) return 'text'

  // Count words (split by spaces)
  const words = trimmed.split(/\s+/).filter(Boolean)

  // If query has 3+ words or is a natural language question, use AI mode
  // Also trigger AI mode for queries that look like questions or descriptions
  const isQuestion = /^(what|where|who|when|why|how|which|can|could|would|should|is|are|do|does|find|show|give|tell|recommend|suggest|looking for|want to|need|help)/i.test(trimmed)
  const hasMultipleWords = words.length >= 3
  const isLongQuery = trimmed.length > 25

  if (isQuestion || hasMultipleWords || isLongQuery) {
    return 'ai'
  }

  return 'text'
}

const SmartSearchInput = React.forwardRef<HTMLInputElement, SmartSearchInputProps>(
  ({ value, onChange, onSubmit, placeholder = "Search for a book or describe what you're looking for...", isLoading = false, disabled = false, className }, ref) => {
    const searchMode = detectSearchMode(value)
    const isAiMode = searchMode === 'ai'

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (!value.trim() || isLoading) return
      onSubmit(searchMode)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit(e)
      }
    }

    return (
      <form onSubmit={handleSubmit} className={cn('w-full', className)}>
        <div className={cn('smart-search-wrapper', isAiMode && 'ai-mode')}>
          <div className={cn(
            'smart-search-inner flex items-center gap-3 px-4 py-3',
            !isAiMode && 'rounded-xl border border-input bg-card'
          )}>
            {/* Search Icon / AI Indicator */}
            <div className="flex-shrink-0">
              {isAiMode ? (
                <Sparkles className="ai-indicator h-5 w-5 text-purple-500" />
              ) : (
                <Search className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Input Field */}
            <input
              ref={ref}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className={cn(
                'flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
                'focus:outline-none'
              )}
            />

            {/* Mode Indicator / Loading */}
            <div className="flex-shrink-0 flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  {isAiMode && (
                    <span className="text-xs font-medium text-purple-500 bg-purple-50 dark:bg-purple-950 px-2 py-1 rounded-full">
                      AI Search
                    </span>
                  )}
                  {value.trim() && (
                    <button
                      type="submit"
                      disabled={disabled || isLoading}
                      className={cn(
                        'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        isAiMode
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                    >
                      Search
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-2 flex justify-center">
          <p className={cn(
            'text-xs transition-colors duration-300',
            isAiMode ? 'text-purple-500' : 'text-muted-foreground'
          )}>
            {isAiMode
              ? 'AI will help find the best matches for your query'
              : 'Type more to enable AI-powered search'}
          </p>
        </div>
      </form>
    )
  }
)

SmartSearchInput.displayName = 'SmartSearchInput'

export { SmartSearchInput, detectSearchMode }
