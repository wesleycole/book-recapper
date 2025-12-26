/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import * as React from 'react'
import { BookOpen, Library, Clock } from 'lucide-react'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Book Recapper - AI-Powered Book Series Summaries' },
      {
        name: 'description',
        content: 'Get AI-generated recaps of your favorite book series before diving into the next installment.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        href: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📚</text></svg>',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument() {
  const [isHomePage, setIsHomePage] = React.useState(false)

  React.useEffect(() => {
    setIsHomePage(window.location.pathname === '/')
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center px-4">
              <Link to="/" className="flex items-center gap-2 font-semibold">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>Book Recapper</span>
              </Link>
              <nav className="ml-auto flex items-center gap-1">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Recap</span>
                </Link>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
                >
                  <Library className="h-4 w-4" />
                  <span className="hidden sm:inline">Browse</span>
                </Link>
                <Link
                  to="/recaps"
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
                >
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
          {!isHomePage && (
            <footer className="border-t py-6 text-center text-sm text-muted-foreground">
              <p>Book Recapper - Never forget what happened in your favorite series</p>
            </footer>
          )}
        </div>
        <Scripts />
      </body>
    </html>
  )
}
