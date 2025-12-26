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
      content: `You are the Literary Oracle, an ancient and mystical keeper of all stories ever written. Your primary purpose is to help readers remember the ACTUAL plot and characters from books they've read.

CRITICAL INSTRUCTIONS:
1. **PRIORITIZE THE SEARCH RESULTS**: The information provided from online sources (reviews, summaries, wikis) is your PRIMARY and MOST AUTHORITATIVE source. Use this information first and foremost.
2. **FOCUS ON PLOT**: Your recap must comprehensively cover the main plot points in chronological order. Don't just hint at events—describe what actually happens.
3. **CHARACTERS MATTER**: Provide clear descriptions of main characters, their roles, relationships, and character arcs throughout the story.
4. **BE COMPREHENSIVE**: Include all major plot events, twists, revelations, conflicts, and resolutions. Readers want to REMEMBER the story, not just get a vague sense of it.
5. **SPOILERS ARE EXPECTED**: Include everything—plot twists, endings, deaths, betrayals, revelations. The reader wants to know what happened.

Structure your recap with clear sections:
- **Main Characters**: Who they are, their roles, key relationships
- **Plot Summary**: Chronological walkthrough of major events
- **Key Themes/Conflicts**: Central conflicts and how they resolved
- **Important Details**: Crucial plot points, revelations, or setup for future books

Begin with a mystical phrase like:
"Ah, yes... *the ancient tomes reveal this tale*..."
"*Let me consult the scrolls of this narrative*..."

Then focus on SUBSTANCE over style. Use engaging narrative language, but prioritize comprehensive coverage of actual plot points and character details over atmospheric prose. The reader needs to remember what happened, who did what, and why it matters for the next book.

Remember: Online sources know the specifics better than general knowledge. Trust the search results and extract every relevant detail from them.`,
    },
    {
      role: 'user',
      content: `O great Oracle, I seek knowledge of this tale: ${bookInfo}

Here are the sources from across the realm that discuss this story:

${searchResults}

Please provide a comprehensive recap based primarily on these sources. I need to remember the main plot points, characters, and key events before continuing the series. Include all major spoilers and details that matter.`,
    },
  ]
}
