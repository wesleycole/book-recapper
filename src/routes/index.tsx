import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Send, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { streamRecap, type RecapStreamResponse } from '~/server/recap'
import type { TavilySearchResult } from '~/lib/tavily'

export const Route = createFileRoute('/')({
  component: HomePage,
})

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: TavilySearchResult[]
  isStreaming?: boolean
  showSources?: boolean
}

function HomePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const toggleSources = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, showSources: !msg.showSources } : msg
      )
    )
  }

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!input.trim() || isLoading) return

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input.trim(),
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        isStreaming: true,
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setInput('')
      setIsLoading(true)

      try {
        const stream = await streamRecap({
          data: {
            bookTitle: input.trim(),
          },
        })

        let hasReceivedContent = false
        for await (const chunk of stream) {
          try {
            const parsed: RecapStreamResponse = JSON.parse(chunk)

            switch (parsed.type) {
              case 'sources':
                if (parsed.sources) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, sources: parsed.sources }
                        : msg
                    )
                  )
                }
                break
              case 'content':
                if (parsed.data) {
                  hasReceivedContent = true
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: msg.content + parsed.data }
                        : msg
                    )
                  )
                }
                break
              case 'done':
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, isStreaming: false }
                      : msg
                  )
                )
                break
              case 'error':
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? {
                          ...msg,
                          content:
                            'Sorry, I encountered an error: ' +
                            (parsed.data || 'An error occurred'),
                          isStreaming: false,
                        }
                      : msg
                  )
                )
                break
            }
          } catch (parseErr) {
            console.error('Failed to parse chunk:', chunk, parseErr)
          }
        }

        // If stream ended without 'done' message, mark as complete
        if (hasReceivedContent) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, isStreaming: false }
                : msg
            )
          )
        }
      } catch (err) {
        console.error('Stream error:', err)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content:
                    'Sorry, I encountered an error: ' +
                    (err instanceof Error ? err.message : 'An error occurred'),
                  isStreaming: false,
                }
              : msg
          )
        )
      } finally {
        // Always reset loading state when stream completes or fails
        setIsLoading(false)
      }
    },
    [input, isLoading]
  )

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
    <div className="chat-container flex h-[calc(100vh-4rem)] flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
              <p className="mb-8 text-center text-lg text-muted-foreground">
                What book would you like to recap?
              </p>
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
          ) : (
            <div className="space-y-4 pt-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message-row flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'user' ? (
                    <div className="user-bubble max-w-[80%] rounded-3xl rounded-br-lg bg-primary px-4 py-2.5 text-primary-foreground">
                      <p className="text-[15px] leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  ) : (
                    <div className="assistant-message max-w-[90%] space-y-3">
                      {/* Typing indicator or content */}
                      {!message.content && message.isStreaming ? (
                        <div className="typing-indicator flex items-center gap-1 px-1 py-2">
                          <span className="dot"></span>
                          <span className="dot"></span>
                          <span className="dot"></span>
                        </div>
                      ) : (
                        <>
                          {message.content && (
                            <div
                              className={`prose-chat text-[15px] leading-relaxed text-foreground ${
                                message.isStreaming ? 'streaming-cursor' : ''
                              }`}
                            >
                              {message.content}
                            </div>
                          )}

                          {/* Collapsible sources */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="sources-section">
                              <button
                                onClick={() => toggleSources(message.id)}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {message.showSources ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                                <span>{message.sources.length} sources</span>
                              </button>
                              {message.showSources && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {message.sources.map((source, index) => (
                                    <a
                                      key={index}
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="source-chip inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                    >
                                      <span className="max-w-[150px] truncate">
                                        {new URL(source.url).hostname.replace('www.', '')}
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="chat-input-area border-t bg-background/80 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about a book..."
                disabled={isLoading}
                className="chat-input w-full rounded-full border border-border bg-card px-4 py-3 pr-12 text-[15px] placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="send-button h-11 w-11 shrink-0 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
