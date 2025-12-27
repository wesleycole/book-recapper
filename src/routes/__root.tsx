/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import * as React from 'react'
import { BookOpen, Library, MessageSquare, FileText, Eye } from 'lucide-react'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Ask the Librarian - AI-Powered Book Recaps' },
      {
        name: 'description',
        content: 'Need a refresher before the next chapter? Ask the Librarian for AI-powered book recaps to help you remember the story.',
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
          <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center px-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <span className="font-serif text-lg font-medium tracking-tight text-gold">
                  Ask the Librarian
                </span>
              </Link>
              <nav className="ml-auto flex items-center gap-1">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white [&.active]:bg-white/10 [&.active]:text-white"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Recap</span>
                </Link>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white [&.active]:bg-white/10 [&.active]:text-white"
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
            <footer className="border-t border-gold-dark/20 bg-content-bg py-4">
              <div className="container mx-auto px-6">
                <div className="flex items-center gap-6 text-sm text-content-fg/60">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>29 prompts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>51 files</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span className="font-semibold">LIBRARIAN</span>
                  </div>
                  <div className="ml-auto flex items-center gap-4 font-mono text-xs">
                    <span className="text-emerald-700">+543</span>
                    <span className="text-red-700">-425</span>
                    <span className="text-amber-700">~170</span>
                  </div>
                </div>
              </div>
            </footer>
          )}
        </div>
        <Scripts />
      </body>
    </html>
  )
}
