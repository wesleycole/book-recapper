import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { BookCard, BookCardSkeleton } from '~/components/book-card'
import { searchBooksServer } from '~/server/books'
import type { BookDetails } from '~/lib/openlib'

const INITIAL_BOOKS = [
  'Pride and Prejudice',
  'Gone Girl',
  'The Hunger Games',
  'Harry Potter and the Order of the Phoenix',
  '1984',
  'The Great Gatsby',
]

const MORE_BOOKS = [
  'To Kill a Mockingbird',
  'The Catcher in the Rye',
  'Lord of the Rings',
  'Dune',
  'Brave New World',
  'The Hobbit',
  'Crime and Punishment',
  'Wuthering Heights',
  'Jane Eyre',
  'Moby Dick',
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
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadedBooksIndex, setLoadedBooksIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Fetch initial books
  useEffect(() => {
    async function fetchBookCovers() {
      try {
        const results = await Promise.all(
          INITIAL_BOOKS.map(async (title) => {
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

  // Load more books when needed
  const loadMoreBooks = useCallback(async () => {
    if (isLoadingMore || loadedBooksIndex >= MORE_BOOKS.length) return

    setIsLoadingMore(true)
    const booksToLoad = MORE_BOOKS.slice(loadedBooksIndex, loadedBooksIndex + 3)

    try {
      const results = await Promise.all(
        booksToLoad.map(async (title) => {
          const books = await searchBooksServer({ data: title })
          return books[0] || null
        })
      )
      const newBooks = results.filter((book): book is BookDetails => book !== null)
      setBookSuggestions(prev => [...prev, ...newBooks])
      setLoadedBooksIndex(prev => prev + 3)
    } catch (error) {
      console.error('Failed to load more books:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, loadedBooksIndex])

  // Update scroll button states
  const updateScrollButtons = useCallback(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    setCanScrollLeft(carousel.scrollLeft > 0)
    setCanScrollRight(
      carousel.scrollLeft < carousel.scrollWidth - carousel.clientWidth - 10
    )
  }, [])

  // Monitor scroll position
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    const handleScroll = () => {
      updateScrollButtons()

      // Load more when near the end
      const scrollEnd = carousel.scrollWidth - carousel.clientWidth
      if (carousel.scrollLeft > scrollEnd - 400) {
        loadMoreBooks()
      }
    }

    carousel.addEventListener('scroll', handleScroll)
    updateScrollButtons()

    return () => carousel.removeEventListener('scroll', handleScroll)
  }, [updateScrollButtons, loadMoreBooks])

  // Scroll carousel
  const scrollCarousel = (direction: 'left' | 'right') => {
    const carousel = carouselRef.current
    if (!carousel) return

    const scrollAmount = 340 // Card width + gap
    carousel.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

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

  const handleSuggestionClick = (book: BookDetails) => {
    setInput(book.title)
    inputRef.current?.focus()
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl space-y-12">
        {/* Hero section */}
        <div className="text-center">
          <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            Rediscover <span className="italic">Your</span> Books
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Get AI-powered recaps to refresh your memory before the next chapter
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-xl items-center gap-3">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a book..."
              className="chat-input w-full rounded-xl border border-border bg-card px-5 py-4 text-base placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            className="h-12 w-12 shrink-0 rounded-xl"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>

        {/* Section header with arrows */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-border" />
            <span className="text-sm font-medium text-muted-foreground">Popular Reads</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollCarousel('left')}
              disabled={!canScrollLeft}
              className="h-10 w-10 rounded-full border-border"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollCarousel('right')}
              disabled={!canScrollRight && !isLoadingMore}
              className="h-10 w-10 rounded-full border-border"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Book carousel - extends beyond container */}
      <div className="w-full overflow-hidden">
        <div
          ref={carouselRef}
          className="flex gap-5 overflow-x-auto px-[calc(50vw-512px)] py-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoadingSuggestions
            ? INITIAL_BOOKS.map((title) => (
                <BookCardSkeleton key={title} variant="carousel" />
              ))
            : bookSuggestions.map((book) => (
                <BookCard
                  key={book.key}
                  book={book}
                  variant="carousel"
                  onClick={() => handleSuggestionClick(book)}
                />
              ))}
          {isLoadingMore && (
            <>
              <BookCardSkeleton variant="carousel" />
              <BookCardSkeleton variant="carousel" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
