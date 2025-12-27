import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { BookCard, BookCardSkeleton } from '~/components/book-card'
import { searchBooksServer } from '~/server/books'
import type { BookDetails } from '~/lib/openlib'
import { useTypingPlaceholder } from '~/hooks/useTypingPlaceholder'

const PLACEHOLDER_PREFIX = "What happened "
const PLACEHOLDER_SUFFIXES = [
  "at the end of 1984?",
  "in books 1-3 of Harry Potter?",
  "to Gatsby?",
  "in the Hunger Games trilogy?",
  "between Elizabeth and Darcy?",
  "in the first Dune book?",
  "to Amy in Gone Girl?",
  "in Lord of the Rings?",
]

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
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { displayText: placeholderText } = useTypingPlaceholder({
    prefix: PLACEHOLDER_PREFIX,
    suffixes: PLACEHOLDER_SUFFIXES,
    typingSpeed: 50,
    deletingSpeed: 35,
    pauseBeforeDelete: 1500,
    pauseDuration: 400,
  })

  // Fetch initial books
  useEffect(() => {
    async function fetchBookCovers() {
      try {
        const results = await Promise.all(
          INITIAL_BOOKS.map(async (title) => {
            const result = await searchBooksServer({ data: title })
            return result[0] || null
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
          const result = await searchBooksServer({ data: title })
          return result[0] || null
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSuggestionClick = (book: BookDetails) => {
    setInput(book.title)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col">
      {/* Hero section - full viewport height with dark teal background */}
      <div
        className="relative flex h-[calc(100vh-4rem)] flex-col items-center px-4 justify-center"
        style={{
          background: 'linear-gradient(135deg, #2d4547 0%, #3d5557 50%, #4a6365 100%)',
        }}
      >
        {/* Orb image - positioned in bottom right */}
        <div
          className="pointer-events-none absolute bottom-0 z-0 -right-4 md:right-0"
          style={{
            width: 'min(70vw, 800px)',
            height: 'min(55vh, 900px)',
          }}
        >
          <img
            src="/orb_no_bg.png"
            alt=""
            className="h-full w-full object-contain object-right-bottom"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl space-y-6 md:space-y-12">
          {/* Hero text */}
          <div className="text-center">
            <h1 className="font-display text-3xl font-light tracking-tight text-gold sm:text-4xl md:text-6xl">
              Rediscover <span className="italic">Your</span> Books
            </h1>
            <p className="mt-3 text-base md:text-lg text-white/80 md:mt-4">
              Get AI-powered recaps to refresh your memory before the next chapter
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
            <div className="relative rounded-2xl border border-white/20 bg-white shadow-lg">
              {/* Animated placeholder overlay */}
              {!input && (
                <div
                  className="pointer-events-none absolute left-5 top-4 text-base text-gray-400"
                  aria-hidden="true"
                >
                  <span>{placeholderText}</span>
                  <span className="typing-cursor" />
                </div>
              )}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                className="w-full resize-none rounded-2xl bg-transparent px-5 py-4 pb-14 text-base text-gray-800 focus:outline-none"
              />
              <div className="absolute bottom-3 right-3">
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  className="h-10 w-10 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Popular Reads section - below the fold */}
      <div className="bg-content-bg px-4 py-16">
        <div className="mx-auto w-full max-w-4xl">
          {/* Section header with arrows */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="h-px w-8 bg-gold-dark/30" />
              <span className="text-sm font-medium text-gold-dark">Popular Reads</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollCarousel('left')}
                disabled={!canScrollLeft}
                className="h-10 w-10 rounded-full border-gold-dark/30 text-content-fg hover:bg-gold-dark/10 hover:text-gold-dark"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollCarousel('right')}
                disabled={!canScrollRight && !isLoadingMore}
                className="h-10 w-10 rounded-full border-gold-dark/30 text-content-fg hover:bg-gold-dark/10 hover:text-gold-dark"
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
    </div>
  )
}
