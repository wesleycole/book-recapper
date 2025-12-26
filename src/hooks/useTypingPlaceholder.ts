import { useState, useEffect, useRef } from 'react'

interface UseTypingPlaceholderOptions {
  prefix?: string
  suffixes: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  pauseBeforeDelete?: number
}

type Phase = 'typing' | 'pausing' | 'deleting' | 'waiting'

export function useTypingPlaceholder({
  prefix = '',
  suffixes,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseDuration = 500,
  pauseBeforeDelete = 1000,
}: UseTypingPlaceholderOptions) {
  const [displaySuffix, setDisplaySuffix] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('typing')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentSuffix = suffixes[currentIndex]

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    switch (phase) {
      case 'typing':
        if (displaySuffix.length < currentSuffix.length) {
          timeoutRef.current = setTimeout(() => {
            setDisplaySuffix(currentSuffix.slice(0, displaySuffix.length + 1))
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
        if (displaySuffix.length > 0) {
          timeoutRef.current = setTimeout(() => {
            setDisplaySuffix(displaySuffix.slice(0, -1))
          }, deletingSpeed)
        } else {
          // Done deleting, move to waiting
          setPhase('waiting')
        }
        break

      case 'waiting':
        timeoutRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % suffixes.length)
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
    displaySuffix,
    phase,
    currentSuffix,
    currentIndex,
    suffixes.length,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    pauseBeforeDelete,
  ])

  return {
    displayText: prefix + displaySuffix,
    isTyping: phase === 'typing',
    currentIndex,
  }
}
