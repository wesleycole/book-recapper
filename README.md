# Ask the Librarian

A friendly AI-powered book recap service to help you remember your favorite stories. Built with TanStack Start.

**Live at [askthelibrarian.app](https://askthelibrarian.app)**

## Features

- **Generate AI Recaps**: Get detailed summaries of books and series using AI
- **Browse Books**: Search the Open Library database to discover books
- **Recap History**: View previously generated recaps
- **Web Search Integration**: Uses Tavily API for accurate book information
- **Streaming Responses**: Real-time text streaming for better UX

## Tech Stack

- **Framework**: TanStack Start (React 19 + Vite)
- **Styling**: Tailwind CSS v4
- **Database**: Turso (LibSQL) with Drizzle ORM
- **AI**: MiniMax API for text generation
- **Search**: Tavily API for web search
- **Book Data**: Open Library API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# AI Generation API
MINIMAX_API_KEY=your_minimax_api_key_here

# Web Search API
TAVILY_API_KEY=your_tavily_api_key_here

# Database (Turso - LibSQL)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token_here
```

### Database Setup

```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

## Project Structure

```
src/
├── routes/           # Page components (file-based routing)
│   ├── index.tsx     # Home/recap generation page
│   ├── browse.tsx    # Book discovery page
│   ├── recaps.tsx    # Recap history page
│   └── __root.tsx    # Root layout
├── server/           # Server functions
│   ├── recap.ts      # Recap generation functions
│   └── books.ts      # Book search functions
├── lib/              # External API integrations
│   ├── minimax.ts    # MiniMax chat API
│   ├── tavily.ts     # Tavily search API
│   ├── openlib.ts    # Open Library API
│   └── utils.ts      # Utility functions
├── db/               # Database layer
│   ├── schema.ts     # Drizzle ORM schema
│   └── index.ts      # Database client
├── components/ui/    # Reusable UI components
└── styles/           # CSS styles
```

## License

MIT
