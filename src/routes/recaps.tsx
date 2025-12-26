import { createFileRoute, Link } from '@tanstack/react-router'
import { Clock, BookOpen } from 'lucide-react'
import { buttonVariants } from '~/components/ui/button'

export const Route = createFileRoute('/recaps')({
  component: RecapsPage,
})

function RecapsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Recap History</h1>
        <p className="text-muted-foreground">
          Your previously generated book recaps
        </p>
      </div>

      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold">Coming Soon</h2>
        <p className="mb-6 text-muted-foreground">
          Recap history storage is not yet available. Generate a new recap to get started!
        </p>
        <Link to="/" className={buttonVariants()}>
          <BookOpen className="mr-2 h-4 w-4" />
          Generate a Recap
        </Link>
      </div>
    </div>
  )
}
