export interface MinimaxMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface MinimaxStreamChunk {
  id: string
  choices: Array<{
    delta: {
      content?: string
    }
    finish_reason: string | null
  }>
}

export async function* streamMinimaxChat(
  messages: MinimaxMessage[],
  onComplete?: (fullContent: string) => void
): AsyncGenerator<string> {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY is not set')
  }

  const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'MiniMax-Text-01',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`MiniMax API error: ${error}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue

        const data = trimmedLine.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed: MinimaxStreamChunk = JSON.parse(data)
          const content = parsed.choices[0]?.delta?.content
          if (content) {
            fullContent += content
            yield content
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  } finally {
    reader.releaseLock()
    if (onComplete) {
      onComplete(fullContent)
    }
  }
}

export function createBookRecapPrompt(
  bookInfo: string,
  searchResults: string
): MinimaxMessage[] {
  return [
    {
      role: 'system',
      content: `You are a helpful book recap assistant. Your job is to provide detailed, spoiler-rich summaries of books and book series to help readers remember what happened before reading the next book.

Your recaps should:
- Include major plot points and character developments
- Mention key characters and their relationships
- Cover important twists and revelations
- Be organized chronologically or by importance
- Use clear headings and bullet points for readability
- Include spoilers (this is expected - users want to remember what happened)

Format your response with clear markdown headings and structure.`,
    },
    {
      role: 'user',
      content: `Please provide a detailed recap of: ${bookInfo}

Here is some context from web searches to help you provide accurate information:

${searchResults}

Please provide a comprehensive recap that will help someone remember all the important details before reading the next book in the series.`,
    },
  ]
}
