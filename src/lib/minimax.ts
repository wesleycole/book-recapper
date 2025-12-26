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

  const response = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
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
  let chunkCount = 0
  let lineCount = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        console.log('[MiniMax] Stream done. Total read chunks:', chunkCount)
        break
      }

      chunkCount++
      const decoded = decoder.decode(value, { stream: true })
      console.log('[MiniMax] Raw chunk #' + chunkCount + ':', decoded.substring(0, 200))
      buffer += decoded
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        lineCount++
        const trimmedLine = line.trim()
        console.log('[MiniMax] Processing line #' + lineCount + ':', trimmedLine.substring(0, 100))

        if (!trimmedLine) {
          console.log('[MiniMax] Skipping empty line')
          continue
        }

        if (!trimmedLine.startsWith('data: ')) {
          console.log('[MiniMax] Line does not start with "data: ", starts with:', trimmedLine.substring(0, 20))
          continue
        }

        const data = trimmedLine.slice(6)
        if (data === '[DONE]') {
          console.log('[MiniMax] Received [DONE] marker')
          continue
        }

        try {
          const parsed: MinimaxStreamChunk = JSON.parse(data)
          console.log('[MiniMax] Parsed chunk:', JSON.stringify(parsed))
          const content = parsed.choices[0]?.delta?.content
          if (content) {
            console.log('[MiniMax] Yielding content:', content.substring(0, 50))
            fullContent += content
            yield content
          } else {
            console.log('[MiniMax] No content in delta')
          }
        } catch (e) {
          console.log('[MiniMax] Failed to parse JSON:', data.substring(0, 100), 'Error:', e)
        }
      }
    }
  } finally {
    console.log('[MiniMax] Releasing reader. Full content length:', fullContent.length)
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
