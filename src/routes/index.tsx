import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
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
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const inputRef = useRef<HTMLInputElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Handle mouse movement for perspective effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMousePosition({ x, y })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setMousePosition({ x: 0.5, y: 0.5 })
  }, [])

  // Calculate perspective transform based on mouse position
  const getTransformStyle = () => {
    const rotateX = (mousePosition.y - 0.5) * -15 // -7.5 to 7.5 degrees
    const rotateY = (mousePosition.x - 0.5) * 15 // -7.5 to 7.5 degrees
    return {
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: 'transform 0.1s ease-out',
    }
  }

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

  const scrollToCarousel = () => {
    const carouselSection = document.getElementById('popular-reads')
    if (carouselSection) {
      carouselSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section - Full viewport height */}
      <div
        ref={heroRef}
        className="hero-section relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background image with perspective effect */}
        <div
          className="hero-image-container absolute inset-0"
          style={getTransformStyle()}
        >
          {/* Fallback gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-teal-900" />
          {/* Hero image */}
          <div
            className="hero-image absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/hero-librarian.jpg)',
            }}
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />
        </div>

        {/* Hero Content */}
        <div className="hero-content relative z-10 w-full max-w-5xl px-6 text-center">
          {/* Main title - Very large */}
          <h1 className="hero-title font-display text-6xl font-light tracking-tight text-white drop-shadow-2xl sm:text-7xl md:text-8xl lg:text-9xl">
            Rediscover <span className="italic">Your</span> Books
          </h1>
          <p className="hero-subtitle mt-6 text-xl text-white/90 drop-shadow-lg sm:text-2xl md:text-3xl">
            Get AI-powered recaps to refresh your memory before the next chapter
          </p>

          {/* Large search form */}
          <form onSubmit={handleSubmit} className="mx-auto mt-12 flex max-w-3xl items-center gap-4">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for a book..."
                className="hero-input w-full rounded-2xl border-2 border-white/30 bg-white/10 px-8 py-6 text-xl text-white backdrop-blur-md placeholder:text-white/60 focus:border-white/60 focus:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20 sm:text-2xl"
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="hero-button h-16 w-16 shrink-0 rounded-2xl bg-white/20 text-white backdrop-blur-md hover:bg-white/30 sm:h-18 sm:w-18"
            >
              <Send className="h-7 w-7" />
            </Button>
          </form>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToCarousel}
          className="scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2 transform text-white/70 transition-all hover:text-white"
          aria-label="Scroll to popular reads"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium tracking-wide uppercase">Popular Reads</span>
            <ChevronDown className="h-6 w-6 animate-bounce" />
          </div>
        </button>
      </div>

      {/* Popular Reads Section - Below the fold */}
      <div id="popular-reads" className="bg-background py-16">
        <div className="mx-auto max-w-4xl px-4">
          {/* Section header with arrows */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="h-px w-8 bg-border" />
              <span className="text-lg font-medium text-foreground">Popular Reads</span>
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
    </div>
  )
}
