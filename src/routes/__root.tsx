/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import * as React from 'react'
import { BookOpen, Library } from 'lucide-react'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'The Book Oracle - AI-Powered Book Recaps' },
      {
        name: 'description',
        content: 'Get AI-powered recaps of your favorite books and series. Refresh your memory before diving into the next chapter.',
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
  const [isChatPage, setIsChatPage] = React.useState(false)

  React.useEffect(() => {
    const pathname = window.location.pathname
    setIsChatPage(pathname === '/' || pathname.startsWith('/chat/'))
  }, [])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="container mx-auto flex h-16 items-center px-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <span className="font-serif text-lg font-medium tracking-tight">
                  The Book Oracle
                </span>
              </Link>
              <nav className="ml-auto flex items-center gap-1">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-secondary-foreground [&.active]:bg-secondary [&.active]:text-secondary-foreground"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Recap</span>
                </Link>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-secondary-foreground [&.active]:bg-secondary [&.active]:text-secondary-foreground"
                >
                  <Library className="h-4 w-4" />
                  <span className="hidden sm:inline">Browse</span>
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
          {!isChatPage && (
            <footer className="border-t border-border/60 py-8">
              <div className="container mx-auto px-4 text-center">
                <p className="font-serif text-sm text-muted-foreground">
                  The Book Oracle
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  AI-powered book recaps to refresh your memory
                </p>
              </div>
            </footer>
          )}
        </div>
        <Scripts />
      </body>
    </html>
  )
}
