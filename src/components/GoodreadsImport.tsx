import { useState, useRef } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import Papa from 'papaparse'

interface GoodreadsBook {
  'Book Id': string
  Title: string
  Author: string
  'Author l-f': string
  'Additional Authors': string
  ISBN: string
  ISBN13: string
  'My Rating': string
  'Average Rating': string
  Publisher: string
  Binding: string
  'Number of Pages': string
  'Year Published': string
  'Original Publication Year': string
  'Date Read': string
  'Date Added': string
  Bookshelves: string
  'Bookshelves with positions': string
  'Exclusive Shelf': string
  'My Review': string
  Spoiler: string
  'Private Notes': string
  'Read Count': string
  'Recommended For': string
  'Recommended By': string
  'Owned Copies': string
  'Original Purchase Date': string
  'Original Purchase Location': string
  Condition: string
  'Condition Description': string
  BCID: string
}

type BookStatus = 'want_to_read' | 'reading' | 'read'

interface ParsedBook {
  bookId: string
  title: string
  author?: string
  status: BookStatus
  rating?: number
  dateRead?: number
  dateAdded?: number
}

interface ImportResults {
  imported: number
  skipped: number
  errors: string[]
}

function mapGoodreadsShelfToStatus(shelf: string): BookStatus {
  const normalizedShelf = shelf.toLowerCase().trim()
  if (normalizedShelf === 'read') return 'read'
  if (normalizedShelf === 'currently-reading') return 'reading'
  return 'want_to_read'
}

function parseGoodreadsDate(dateStr: string): number | undefined {
  if (!dateStr || dateStr.trim() === '') return undefined
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return undefined
  return parsed.getTime()
}

function cleanIsbn(isbn: string): string {
  // Remove quotes and equals sign that Goodreads adds (e.g., ="0316015849")
  return isbn.replace(/[="]/g, '').trim()
}

function parseGoodreadsCSV(data: GoodreadsBook[]): ParsedBook[] {
  return data
    .filter((row) => row.Title && row.Title.trim() !== '')
    .map((row) => {
      const isbn = cleanIsbn(row.ISBN13) || cleanIsbn(row.ISBN)
      const bookId = isbn || `gr-${row['Book Id'] || Date.now()}-${row.Title.slice(0, 20).replace(/\s/g, '-')}`

      const rating = parseInt(row['My Rating'], 10)

      return {
        bookId,
        title: row.Title.trim(),
        author: row.Author?.trim() || undefined,
        status: mapGoodreadsShelfToStatus(row['Exclusive Shelf'] || 'to-read'),
        rating: rating > 0 ? rating : undefined,
        dateRead: parseGoodreadsDate(row['Date Read']),
        dateAdded: parseGoodreadsDate(row['Date Added']),
      }
    })
}

export function GoodreadsImport() {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedBooks, setParsedBooks] = useState<ParsedBook[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [results, setResults] = useState<ImportResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const importBooks = useMutation(api.library.importBooks)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setError(null)
    setResults(null)
    setIsParsing(true)

    Papa.parse<GoodreadsBook>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const books = parseGoodreadsCSV(results.data)
        setParsedBooks(books)
        setIsParsing(false)
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`)
        setIsParsing(false)
      },
    })
  }

  const handleImport = async () => {
    if (parsedBooks.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      // Import in batches to avoid timeout
      const BATCH_SIZE = 50
      const totalResults: ImportResults = { imported: 0, skipped: 0, errors: [] }

      for (let i = 0; i < parsedBooks.length; i += BATCH_SIZE) {
        const batch = parsedBooks.slice(i, i + BATCH_SIZE)
        const batchResults = await importBooks({ books: batch })
        totalResults.imported += batchResults.imported
        totalResults.skipped += batchResults.skipped
        totalResults.errors.push(...batchResults.errors)
      }

      setResults(totalResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import books')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setFile(null)
    setParsedBooks([])
    setResults(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const statusCounts = parsedBooks.reduce(
    (acc, book) => {
      acc[book.status]++
      return acc
    },
    { want_to_read: 0, reading: 0, read: 0 }
  )

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import from Goodreads
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-lg rounded-xl border border-gold-dark/20 bg-white p-6 shadow-xl mx-4">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-content-fg/40 hover:text-content-fg"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="mb-2 font-display text-2xl font-light text-gold-dark">
              Import from Goodreads
            </h2>
            <p className="mb-6 text-sm text-content-fg/70">
              Upload your Goodreads library export CSV file to import your books.
            </p>

            {/* Instructions */}
            <div className="mb-6 rounded-lg border border-gold-dark/10 bg-amber-50/50 p-4">
              <h3 className="mb-2 font-medium text-content-fg">How to export from Goodreads:</h3>
              <ol className="space-y-1 text-sm text-content-fg/70">
                <li>1. Go to <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer" className="text-gold-dark underline hover:no-underline">goodreads.com/review/import</a></li>
                <li>2. Click "Export Library"</li>
                <li>3. Wait for the export to complete</li>
                <li>4. Download the CSV file and upload it here</li>
              </ol>
            </div>

            {/* File Upload */}
            {!results && (
              <div className="mb-6">
                <label
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
                    file
                      ? 'border-green-400 bg-green-50'
                      : 'border-gold-dark/20 hover:border-gold-dark/40 hover:bg-gray-50'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {isParsing ? (
                    <>
                      <Loader2 className="mb-2 h-8 w-8 animate-spin text-gold-dark" />
                      <span className="text-sm text-content-fg/70">Parsing file...</span>
                    </>
                  ) : file ? (
                    <>
                      <FileText className="mb-2 h-8 w-8 text-green-600" />
                      <span className="font-medium text-content-fg">{file.name}</span>
                      <span className="mt-1 text-sm text-content-fg/70">
                        {parsedBooks.length} books found
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="mb-2 h-8 w-8 text-content-fg/40" />
                      <span className="font-medium text-content-fg">
                        Click to upload CSV
                      </span>
                      <span className="mt-1 text-sm text-content-fg/70">
                        or drag and drop
                      </span>
                    </>
                  )}
                </label>
              </div>
            )}

            {/* Preview */}
            {parsedBooks.length > 0 && !results && (
              <div className="mb-6">
                <h3 className="mb-3 font-medium text-content-fg">Preview</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-amber-50 p-3">
                    <div className="text-xl font-semibold text-amber-600">
                      {statusCounts.want_to_read}
                    </div>
                    <div className="text-xs text-content-fg/60">Want to Read</div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3">
                    <div className="text-xl font-semibold text-blue-600">
                      {statusCounts.reading}
                    </div>
                    <div className="text-xs text-content-fg/60">Reading</div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3">
                    <div className="text-xl font-semibold text-green-600">
                      {statusCounts.read}
                    </div>
                    <div className="text-xs text-content-fg/60">Read</div>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Import Complete</span>
                </div>
                <div className="space-y-1 text-sm text-content-fg/70">
                  <p>{results.imported} books imported successfully</p>
                  {results.skipped > 0 && (
                    <p>{results.skipped} books skipped (already in library)</p>
                  )}
                  {results.errors.length > 0 && (
                    <p className="text-red-600">
                      {results.errors.length} errors occurred
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                {results ? 'Close' : 'Cancel'}
              </Button>
              {!results && (
                <Button
                  onClick={handleImport}
                  disabled={parsedBooks.length === 0 || isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Import {parsedBooks.length} Books
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
