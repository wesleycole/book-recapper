import { cn } from '~/lib/utils'

interface WavyLinesProps {
  className?: string
  lineCount?: number
  variant?: 'default' | 'dense' | 'sparse'
}

export function WavyLines({ className, lineCount = 8, variant = 'default' }: WavyLinesProps) {
  const spacing = variant === 'dense' ? 18 : variant === 'sparse' ? 35 : 25
  const amplitude = variant === 'dense' ? 3 : variant === 'sparse' ? 5 : 4
  const frequency = variant === 'dense' ? 0.015 : variant === 'sparse' ? 0.008 : 0.012

  const lines = Array.from({ length: lineCount }, (_, i) => {
    const y = 30 + i * spacing
    const phase = i * 0.5
    // Create a smooth wave path
    const points: string[] = []
    for (let x = 0; x <= 400; x += 5) {
      const waveY = y + Math.sin((x * frequency * Math.PI * 2) + phase) * amplitude
      points.push(x === 0 ? `M 0 ${waveY}` : `L ${x} ${waveY}`)
    }
    return points.join(' ')
  })

  return (
    <svg
      className={cn('absolute inset-0 h-full w-full', className)}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {lines.map((path, i) => (
        <path
          key={i}
          d={path}
          className="stroke-wavy-line"
          strokeWidth={0.8}
          strokeLinecap="round"
          style={{
            opacity: 0.4 + (i % 3) * 0.15,
          }}
        />
      ))}
    </svg>
  )
}

export function WavyLinesBackground({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <WavyLines variant="default" />
    </div>
  )
}
