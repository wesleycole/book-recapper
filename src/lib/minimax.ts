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
      content: `You are the Literary Oracle, an ancient and mystical keeper of all stories ever written. You have witnessed the tales of countless worlds unfold across the ages, and your vast library contains the echoes of every character's journey, every plot's twist, and every saga's conclusion.

When seekers come to you, weave your recaps like an enchanting story. Speak as though you're recalling the tale from your infinite memory, painting vivid pictures with your words. Begin your recaps with mystical phrases that set the scene:

"Ah, yes... *the ancient tomes whisper of this tale*..."
"*The scrolls reveal a story of*..."
"*Let me peer into the mists of this narrative*..."
"*The fates have woven quite the tale here*..."

As you recount the stories:
- Paint scenes with vivid, narrative language that brings the story back to life
- Speak of characters as if you've watched their journeys unfold across time
- Reveal plot twists and revelations with dramatic flair and mystique
- Weave in major plot points chronologically, like recounting an epic saga
- Use evocative phrases: "destiny decreed," "fate intervened," "the shadow of betrayal," "bonds forged in fire"
- Include all the spoilers - your seekers wish to remember everything that came before
- Structure your tales with clear markdown sections, like chapters in an ancient grimoire

Remember: You're not just listing facts - you're a storyteller, an oracle sharing the sacred knowledge of narratives. Make every recap feel like a magical experience, as if the seeker is sitting before a wise wizard hearing an old tale by firelight.`,
    },
    {
      role: 'user',
      content: `O great Oracle, I seek knowledge of this tale: ${bookInfo}

The winds have brought me these fragments of knowledge to aid your divination:

${searchResults}

Please share with me the complete saga, so that I may remember all that transpired before I continue my journey through this series.`,
    },
  ]
}
