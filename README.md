# Ask the Librarian

A friendly AI-powered book recap service to help you remember your favorite stories. Built with TanStack Start.

**Live at [askthelibrarian.app](https://askthelibrarian.app)**

## Features

- **Generate AI Recaps**: Get detailed summaries of books and series using AI
- **Browse Books**: Search the Open Library database to discover books
- **Recap History**: View previously generated recaps
- **Personal Library**: Track books you want to read, are reading, or have read (like Goodreads)
- **User Accounts**: Sign up with email/password to save your library and recaps
- **Web Search Integration**: Uses Tavily API for accurate book information
- **Streaming Responses**: Real-time text streaming for better UX

## Tech Stack

- **Framework**: TanStack Start (React 19 + Vite)
- **Styling**: Tailwind CSS v4
- **Database**: Convex (serverless database)
- **Authentication**: Convex Auth (email/password)
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

# Convex (auto-populated after running `npx convex dev`)
VITE_CONVEX_URL=https://your-project.convex.cloud
```

### Convex Setup

This project uses [Convex](https://convex.dev) for the database and authentication.

#### 1. Create a Convex account

Sign up at [dashboard.convex.dev](https://dashboard.convex.dev) if you don't have an account.

#### 2. Initialize Convex

Run the Convex development server (this will prompt you to create a new project or link to an existing one):

```bash
npx convex dev
```

This will:
- Create a new Convex project (or link to an existing one)
- Automatically set `VITE_CONVEX_URL` in your `.env.local` file
- Start watching for schema/function changes

#### 3. Set up authentication

Convex Auth requires a JWT private key. Generate and set it:

```bash
# Generate a secure random key and set it in Convex
npx convex env set JWT_PRIVATE_KEY "$(openssl rand -base64 32)"
```

If you don't have `openssl`, you can generate a key at https://generate-secret.vercel.app/32 and set it manually:

```bash
npx convex env set JWT_PRIVATE_KEY "your-generated-key-here"
```

#### 4. Verify setup

Your Convex dashboard should show:
- **Tables**: `users`, `authAccounts`, `authSessions`, `authRefreshTokens`, `authVerificationCodes`, `authRateLimits`, `authVerifiers`, `recaps`, `library`
- **Environment Variables**: `JWT_PRIVATE_KEY`

### Development

Run the app and Convex together:

```bash
# Terminal 1: Start Convex (watches for changes)
npx convex dev

# Terminal 2: Start the app
npm run dev
```

Or run both with a single command (requires [concurrently](https://www.npmjs.com/package/concurrently)):

```bash
npx concurrently "npx convex dev" "npm run dev"
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
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema (users, library, recaps)
│   ├── auth.ts           # Authentication configuration
│   ├── http.ts           # HTTP routes for auth
│   ├── library.ts        # Library CRUD functions
│   └── recaps.ts         # Recap functions
├── src/
│   ├── routes/           # Page components (file-based routing)
│   │   ├── index.tsx     # Home/recap generation page
│   │   ├── browse.tsx    # Book discovery page
│   │   ├── recaps.tsx    # Recap history page
│   │   ├── library.tsx   # Personal library page
│   │   └── __root.tsx    # Root layout
│   ├── server/           # Server functions
│   │   ├── recap.ts      # Recap generation functions
│   │   └── books.ts      # Book search functions
│   ├── lib/              # External API integrations
│   │   ├── minimax.ts    # MiniMax chat API
│   │   ├── tavily.ts     # Tavily search API
│   │   ├── openlib.ts    # Open Library API
│   │   └── utils.ts      # Utility functions
│   ├── components/       # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── SignInForm.tsx
│   │   ├── SignUpForm.tsx
│   │   ├── AuthButton.tsx
│   │   └── ...
│   └── styles/           # CSS styles
```

## License

MIT
