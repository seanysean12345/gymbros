# GymBros

Social fitness tracking app for you and your friends. Log workouts, compete, and celebrate milestones together.

## Features

- **Workout Logging** - Structured input with 70+ preset exercises
- **Progress Tracking** - Charts and personal records
- **Streak System** - Daily workout streaks with milestones
- **Trophies** - 30+ achievements to unlock
- **Social Groups** - Create or join friend groups with invite codes
- **Competitions** - Weekly volume challenges, streak battles, custom challenges
- **PWA** - Install on your phone, works offline

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### 1. Clone and Install

```bash
cd gymbros
npm install
```

### 2. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings > API** and copy your project URL and anon key

### 3. Environment Variables

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Database Migrations

Go to your Supabase dashboard > **SQL Editor** and run:

1. `supabase/migrations/001_initial_schema.sql` - Creates all tables
2. `supabase/seed.sql` - Adds preset exercises and trophies

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
gymbros/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/          # Login, signup pages
│   │   ├── (main)/          # Main app pages (with bottom nav)
│   │   └── api/             # API routes
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── workout/         # Workout-specific components
│   │   └── charts/          # Chart components
│   ├── lib/                 # Utilities and configs
│   │   └── supabase/        # Supabase client setup
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript types
├── supabase/
│   ├── migrations/          # Database migrations
│   └── seed.sql             # Seed data
└── public/                  # Static assets
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Environment Variables for Production

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## License

MIT
