import { useState, useEffect, useCallback } from 'react'

interface UseTypingPlaceholderOptions {
  examples: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  pauseBeforeDelete?: number
}

export function useTypingPlaceholder({
  examples,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 1500,
  pauseBeforeDelete = 2000,
}: UseTypingPlaceholderOptions) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  const currentExample = examples[currentIndex]

  const typeNextChar = useCallback(() => {
    if (displayText.length < currentExample.length) {
      setDisplayText(currentExample.slice(0, displayText.length + 1))
    }
  }, [displayText, currentExample])

  const deleteChar = useCallback(() => {
    if (displayText.length > 0) {
      setDisplayText(displayText.slice(0, -1))
    }
  }, [displayText])

  useEffect(() => {
    if (isPaused) return

    let timeout: ReturnType<typeof setTimeout>

    if (isTyping) {
      if (displayText.length < currentExample.length) {
        // Still typing
        timeout = setTimeout(typeNextChar, typingSpeed)
      } else {
        // Finished typing, pause before deleting
        setIsPaused(true)
        timeout = setTimeout(() => {
          setIsPaused(false)
          setIsTyping(false)
        }, pauseBeforeDelete)
      }
    } else {
      if (displayText.length > 0) {
        // Still deleting
        timeout = setTimeout(deleteChar, deletingSpeed)
      } else {
        // Finished deleting, pause before next example
        setIsPaused(true)
        timeout = setTimeout(() => {
          setIsPaused(false)
          setIsTyping(true)
          setCurrentIndex((prev) => (prev + 1) % examples.length)
        }, pauseDuration)
      }
    }

    return () => clearTimeout(timeout)
  }, [
    displayText,
    isTyping,
    isPaused,
    currentExample,
    examples.length,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    pauseBeforeDelete,
    typeNextChar,
    deleteChar,
  ])

  return {
    displayText,
    isTyping,
    currentIndex,
  }
}
