import { useState, useEffect, useRef } from 'react'

interface UseTypingPlaceholderOptions {
  examples: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  pauseBeforeDelete?: number
}

type Phase = 'typing' | 'pausing' | 'deleting' | 'waiting'

export function useTypingPlaceholder({
  examples,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 500,
  pauseBeforeDelete = 1000,
}: UseTypingPlaceholderOptions) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('typing')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentExample = examples[currentIndex]

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    switch (phase) {
      case 'typing':
        if (displayText.length < currentExample.length) {
          timeoutRef.current = setTimeout(() => {
            setDisplayText(currentExample.slice(0, displayText.length + 1))
          }, typingSpeed)
        } else {
          // Done typing, move to pausing
          setPhase('pausing')
        }
        break

      case 'pausing':
        timeoutRef.current = setTimeout(() => {
          setPhase('deleting')
        }, pauseBeforeDelete)
        break

      case 'deleting':
        if (displayText.length > 0) {
          timeoutRef.current = setTimeout(() => {
            setDisplayText(displayText.slice(0, -1))
          }, deletingSpeed)
        } else {
          // Done deleting, move to waiting
          setPhase('waiting')
        }
        break

      case 'waiting':
        timeoutRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % examples.length)
          setPhase('typing')
        }, pauseDuration)
        break
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [
    displayText,
    phase,
    currentExample,
    currentIndex,
    examples.length,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    pauseBeforeDelete,
  ])

  return {
    displayText,
    isTyping: phase === 'typing',
    currentIndex,
  }
}
