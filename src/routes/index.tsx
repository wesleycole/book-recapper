import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { Send } from 'lucide-react'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function generateChatId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`
}

function HomePage() {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

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

        <div className="flex flex-wrap justify-center gap-2">
          {[
            'The Way of Kings',
            'A Game of Thrones',
            'The Name of the Wind',
            'Mistborn',
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="suggestion-chip rounded-full border border-border bg-card px-4 py-2 text-sm transition-all hover:border-primary hover:bg-accent active:scale-95"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
