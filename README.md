# Expenser

A modern, offline-friendly expense tracking PWA built with Next.js 16 App Router, Prisma ORM, Neon Postgres, NextAuth credentials auth, and Service Worker + IndexedDB for offline support.

## Features

- ✅ **Offline-first architecture**: Add expenses offline; syncs automatically when back online
- ✅ **NextAuth Credentials**: Email/password authentication with bcrypt
- ✅ **Neon Postgres**: Serverless Postgres with Prisma ORM
- ✅ **Timezone-aware analytics**: Day and week boundaries respect Asia/Karachi timezone (Monday–Sunday weeks)
- ✅ **Multi-currency**: Select currency in profile (PKR, USD, EUR, GBP, INR, AED, AUD, CAD)
- ✅ **PWA installable**: Manifest and service worker for Android/iOS installation
- ✅ **Analytics dashboard**: Daily totals, weekly charts, category breakdowns, average daily spend, previous-period comparison
- ✅ **Simple UI**: Tailwind CSS, Recharts for visualizations

## Setup

### Prerequisites

- Node.js 20+ recommended
- Neon Postgres database (free tier at [neon.tech](https://neon.tech))

### 1. Install dependencies

```powershell
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` with your values:

```dotenv
DATABASE_URL="postgresql://user:password@host:5432/expenser?sslmode=require"
NEXTAUTH_SECRET="your-strong-secret-here"
NEXTAUTH_URL="http://localhost:3000"
APP_NAME="Expenser"
SW_VERSION="v1"
```

**Generate `NEXTAUTH_SECRET`:**

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Get `DATABASE_URL` from Neon:**
- Sign up at [neon.tech](https://neon.tech)
- Create a new project and database
- Copy the pooled connection string

### 3. Run Prisma migrations

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run the dev server

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create an account

- Navigate to [http://localhost:3000/signup](http://localhost:3000/signup)
- Fill in email, password, and select a currency
- Sign in at [http://localhost:3000/signin](http://localhost:3000/signin)

## Usage

### Add expenses

1. Go to **Dashboard**
2. Enter amount, select category (optional), add note
3. Click **Save** (or **Save offline** if offline)
4. Timestamps are captured automatically

### View analytics

- **Dashboard**: Recent transactions and quick-add form
- **Transactions**: Full list of all transactions
- **Analytics**: Summary cards (last 30 days expenses, income, avg daily spend), weekly chart, category pie chart

### Offline mode

- Add expenses while offline; they're stored locally in IndexedDB
- When you reconnect, the app syncs automatically
- **Sync status** badge shows online/offline state and pending items

### Settings

- Update preferred currency (display only)
- Change timezone (affects day/week boundaries)
- Sign out

## PWA Installation

### Android/Chrome

1. Open the app in Chrome
2. Tap **Install** prompt or menu → **Add to Home Screen**

### iOS Safari

1. Open in Safari
2. Tap **Share** → **Add to Home Screen**
3. Note: Limited SW support; sync happens when app is open

## Production Deployment

### Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `DATABASE_URL`: Neon pooled connection string
   - `NEXTAUTH_SECRET`: production secret (generate new)
   - `NEXTAUTH_URL`: `https://yourdomain.com`
4. Deploy

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Auth**: NextAuth 4.24.8 (Credentials + JWT)
- **Database**: Neon Postgres + Prisma ORM 6.2.1
- **Offline**: Service Worker + IndexedDB (idb)
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts 2.12.7
- **Validation**: Zod 3.24.1
- **Date handling**: date-fns 2.30.0 + date-fns-tz 2.0.1

## Scripts

- `npm run dev`: Start dev server
- `npm run build`: Production build
- `npm start`: Start production server
- `npm run lint`: Lint with ESLint
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Run migrations

## License

MIT

---

**Expenser** — Simple offline-friendly expense tracking for your daily needs.
