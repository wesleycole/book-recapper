# Book Recapper

AI-powered book series recaps to help you remember what happened before diving into the next book.

## Features

- **AI-Powered Recaps**: Get detailed summaries of books and series using MiniMax M2.1
- **Web Search Grounding**: Tavily search provides accurate, up-to-date information
- **Book Browser**: Search Open Library's database to discover books and series
- **Recap History**: All generated recaps are saved for future reference
- **Streaming Responses**: Real-time AI responses for a smooth experience

## Tech Stack

- **Framework**: TanStack Start (React)
- **AI**: MiniMax M2.1 + TanStack AI
- **Search**: Tavily API
- **Book Data**: Open Library API
- **Database**: Turso (SQLite)
- **UI**: shadcn/ui + Tailwind CSS
- **Deployment**: Vercel

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example env file and fill in your API keys:

```bash
cp .env.example .env
```

Required environment variables:

- `MINIMAX_API_KEY` - Get from [MiniMax](https://www.minimaxi.com/)
- `TAVILY_API_KEY` - Get from [Tavily](https://tavily.com/)
- `TURSO_DATABASE_URL` - Get from [Turso](https://turso.tech/)
- `TURSO_AUTH_TOKEN` - Get from Turso

### 3. Set Up Database

Push the schema to your Turso database:

```bash
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Database Commands

- `npm run db:generate` - Generate migrations
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema (dev)
- `npm run db:studio` - Open Drizzle Studio

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

The app is configured for Vercel deployment out of the box.

## Project Structure

```
app/
├── components/ui/     # shadcn/ui components
├── db/                # Database schema and connection
├── lib/               # Utilities (Tavily, MiniMax, Open Library)
├── routes/            # TanStack Router pages
│   ├── __root.tsx     # Root layout
│   ├── index.tsx      # Home - Recap request
│   ├── browse.tsx     # Book browser
│   └── recaps.tsx     # Recap history
└── server/            # Server functions
    ├── recap.ts       # Recap generation
    └── books.ts       # Book search
```

## License

MIT
