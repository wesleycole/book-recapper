import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useRef, useEffect } from 'react'
import { BookOpen, Send, Loader2, ExternalLink, Sparkles } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { Card, CardContent } from '~/components/ui/card'
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
}

function HomePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
                setIsLoading(false)
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
                setIsLoading(false)
                break
            }
          } catch {
            // Skip invalid JSON chunks
          }
        }
      } catch (err) {
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
        setIsLoading(false)
      }
    },
    [input, isLoading]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSuggestionClick = (text: string) => {
    setInput(text)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center text-center">
              <div className="mb-6 rounded-full bg-primary/10 p-6">
                <BookOpen className="h-16 w-16 text-primary" />
              </div>
              <h1 className="mb-4 text-4xl font-bold tracking-tight">
                Book Recapper
              </h1>
              <p className="mb-12 max-w-2xl font-serif text-lg leading-relaxed text-muted-foreground">
                Ask me about any book or series you'd like to recap. I'll help you remember
                what happened before you dive into the next installment.
              </p>

              {/* Suggestions */}
              <div className="w-full max-w-2xl">
                <p className="mb-4 text-sm font-medium text-muted-foreground">
                  Try asking about:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    'The Way of Kings by Brandon Sanderson',
                    'A Game of Thrones',
                    'The Name of the Wind',
                    'Mistborn: The Final Empire',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent hover:border-primary"
                    >
                      <p className="font-serif text-sm">{suggestion}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.role === 'user'
                        ? 'rounded-2xl bg-primary px-4 py-3 text-primary-foreground'
                        : 'w-full'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="font-serif text-base leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && (
                          <Card className="bg-muted/50">
                            <CardContent className="p-4">
                              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                                <ExternalLink className="h-4 w-4" />
                                <span>Sources</span>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {message.sources.map((source, index) => (
                                  <a
                                    key={index}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group block rounded-lg border bg-background p-3 transition-colors hover:border-primary"
                                  >
                                    <p className="mb-1 line-clamp-1 text-sm font-medium group-hover:text-primary">
                                      {source.title}
                                    </p>
                                    <p className="line-clamp-1 text-xs text-muted-foreground">
                                      {new URL(source.url).hostname}
                                    </p>
                                  </a>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Content */}
                        <div
                          className={`font-serif text-base leading-relaxed prose-headings:font-sans prose-headings:font-semibold ${
                            message.isStreaming ? 'streaming-cursor' : ''
                          }`}
                        >
                          {message.content ? (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="font-sans text-sm">
                                Searching and generating recap...
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any book... (e.g., 'The Way of Kings' or 'Recap A Game of Thrones')"
              disabled={isLoading}
              rows={1}
              className="min-h-[52px] max-h-32 resize-none font-serif text-base"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-[52px] w-[52px] shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
