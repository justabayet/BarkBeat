# BarkBeat 🎤

**The smart karaoke companion that makes every session unforgettable**

Imagine walking into a karaoke bar with friends and instantly knowing the perfect songs to sing. BarkBeat makes karaoke smarter and more personal by helping you discover, organize, and rate songs based on your preferences and vibe.

## 🎯 What BarkBeat Does

BarkBeat transforms your karaoke experience by:

- **Smart Song Discovery**: Search songs by language, artist, or difficulty level
- **Spotify Integration**: Search and add songs to your karaoke list using Spotify's database
- **Performance Tracking**: Rate song difficulty (Easy/Intermediate/Hard) and add mood/language tags

## 🚀 Key Features

- **Multi-Language Search**: Find songs by language, artist, or difficulty with accurate info
- **Simple Difficulty System**: Easy, Intermediate, or Hard ratings
- **"New Songs to Try"**: Discover unrated songs you've added
- **Real-time Sync**: All ratings and preferences sync across devices

## 🛠️ Tech Stack

- **Frontend**: Next.js with React
- **Deployment**: Vercel
- **Database**: Supabase
- **Authentication**: Google Auth
- **External APIs**: Spotify API for music discovery
- **Language**: TypeScript
- **Package Manager**: npm

## Getting Started

First, run the development server:

```bash
npm run dev
```

## Supabase

Generate types from supabase database: 

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > src/lib/types.ts
```