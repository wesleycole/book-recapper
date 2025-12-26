import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { Send, BookOpen } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { searchBooksServer } from '~/server/books'
import type { BookDetails } from '~/lib/openlib'

const SUGGESTED_BOOKS = [
  'Pride and Prejudice',
  'Gone Girl',
  'The Hunger Games',
  'Harry Potter',
]

export const Route = createFileRoute('/')({
  component: HomePage,
})

function generateChatId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`
}

function HomePage() {
  const [input, setInput] = useState('')
  const [bookSuggestions, setBookSuggestions] = useState<BookDetails[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchBookCovers() {
      try {
        const results = await Promise.all(
          SUGGESTED_BOOKS.map(async (title) => {
            const books = await searchBooksServer({ data: title })
            return books[0] || null
          })
        )
        setBookSuggestions(results.filter((book): book is BookDetails => book !== null))
      } catch (error) {
        console.error('Failed to fetch book covers:', error)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }
    fetchBookCovers()
  }, [])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return

    const chatId = generateChatId()
    navigate({
      to: '/chat/$chatId',
      params: { chatId },
      search: { q: input.trim() },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSuggestionClick = (text: string) => {
    setInput(text)
    inputRef.current?.focus()
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            What book would you like to recap?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a book..."
              className="chat-input w-full rounded-full border border-border bg-card px-4 py-3 pr-12 text-[15px] placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            className="send-button h-11 w-11 shrink-0 rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {isLoadingSuggestions
            ? SUGGESTED_BOOKS.map((title) => (
                <div
                  key={title}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="aspect-[2/3] w-full max-w-[120px] animate-pulse rounded-lg bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))
            : bookSuggestions.map((book) => (
                <button
                  key={book.key}
                  onClick={() => handleSuggestionClick(book.title)}
                  className="group flex flex-col items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                >
                  <div className="aspect-[2/3] w-full max-w-[120px] overflow-hidden rounded-lg border border-border bg-card shadow-md transition-shadow group-hover:shadow-lg">
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
                  <span className="line-clamp-2 text-center text-sm font-medium text-foreground">
                    {book.title}
                  </span>
                </button>
              ))}
        </div>
      </div>
    </div>
  )
}
