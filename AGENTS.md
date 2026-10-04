# AGENTS.md

Canonical project memory for AI coding agents. `CLAUDE.md` imports this file; edit here, not there.

## Commands

```powershell
npm run dev               # next dev (http://localhost:3000)
npm run build             # next build
npm run lint              # eslint (flat config, eslint-config-next)
npm run prisma:generate   # prisma generate
npm run prisma:migrate    # prisma migrate dev
npx tsc --noEmit          # type-check
```

There is no test framework configured.

Required env (put in `.env.local`; `.env*` is gitignored and `.env.example` does **not** exist despite the README): `DATABASE_URL` (Neon Postgres), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. `src/lib/prisma.ts` throws at import if `DATABASE_URL` is missing.

## Stack

Next.js 16 App Router + React 19, TypeScript, Tailwind v4, Prisma 6 (Postgres/Neon), NextAuth v4 (credentials, JWT sessions), zod, `idb`, Recharts. Path alias `@/*` → `src/*`.

## Architecture

**Offline-first sync is the core design.** Transactions are written locally first, then pushed to the server:

1. `src/lib/sync.ts` `enqueueTransaction` / `enqueueTransactionDelete` write to IndexedDB (`src/lib/idb.ts`, DB `expenser-offline` v1: `transactions`, `categories`, `queue`, `meta` stores) and append an op to the `queue` store. Records are keyed by a client-generated UUID `clientId`.
2. `flushQueue()` POSTs up to 200 queued ops to `/api/sync/batch` and, on an OK response, removes only the ops it sent (it does not inspect per-item results), marks those local records `synced`, and fires `SYNCED_EVENT`. `enqueueTransaction`/`enqueueTransactionDelete` fire `QUEUE_CHANGED_EVENT` and never await the service worker (`serviceWorker.ready` hangs when no worker is registered, e.g. in dev). UI never writes to the server directly: forms only enqueue, and `SyncStatus` (mounted once in the `(app)` layout) is the single sync engine (flushes on queue change / `online` / retry with backoff). Edits must enqueue the **full** record (amount, currency, occurredAt…), because `/api/sync/batch` validates the whole `transactionInputSchema` and silently drops partial payloads. Queued creates carry `source`; edits do not (`overlayPending` relies on this).
3. The service worker (`public/sw.js`, registered by `src/app/register-sw.tsx`) has a separate Background Sync (`sync-transactions` tag) path that re-implements the same flush by reading the `queue` store directly. It hardcodes the DB name/version — keep it in sync with `idb.ts`. It also imports `idb` dynamically, which only works if the worker can resolve it.
4. `/api/sync/batch` upserts by `(userId, clientId)` with last-write-wins on `clientUpdatedAt` (older incoming writes are `skipped`). Deletes are soft (`isDeleted: true`).

Because the DB `userId_clientId` unique key is the idempotency mechanism, any new client→server write path should go through `clientId` + `clientUpdatedAt` rather than server IDs.

Other pieces that span files:

- **Auth**: `src/lib/auth.ts` (`authOptions`, `getAuthSession`) with JWT carrying `userId` and `timezone` (typed in `src/types/next-auth.d.ts`). Every API route manually checks `getServerSession(authOptions)` for `session.user.id` and scopes queries by `userId`. `src/proxy.ts` (Next 16's replacement for `middleware.ts`) redirects unauthenticated page requests to `/signin` using an allow-list (`PUBLIC_PATHS`); add new public routes there. It returns 401 JSON for unauthenticated `/api/*` (other than `/api/auth`) and redirects signed-in users away from `/signin`/`/signup` to `/dashboard`. There is no public landing page: `/` (`src/app/page.tsx`) is a server redirect to `/dashboard` (signed in) or `/signin`.
- **Money** is stored as integer `amountCents`; only `expense` transactions/categories exist (single-value enums in `schema.prisma`; migration `20260105000000_remove_income_enum` recreates the Postgres enum types without `income` and fails if any row still uses it). Validation lives in `src/lib/validators.ts` (zod schemas transform ISO strings to `Date`).
- **Time zones**: default `Asia/Karachi`; weeks start Monday. Day/week boundary helpers are in `src/lib/time.ts` (date-fns v2 + date-fns-tz v2 — `utcToZonedTime`/`zonedTimeToUtc` API, not the v3 names). Analytics routes (`/api/analytics/summary`, `/weekly`) take a `tz` query param.
- **API**: `/api/transactions` (paginated GET via `take`/`skip`, POST/PATCH/DELETE; the UI now writes through the sync queue instead of POST/PATCH/DELETE), `/api/sync/batch`, `/api/analytics/{summary,weekly,overview}` (`overview` = today/week/month totals in the session's time zone), `/api/me` (profile/settings), `/api/auth/*`. The former `/api/debug/env` endpoint has been removed.
- **UI** (mobile-first phone PWA; design and check at ~390px first — desktop is optional and just renders the same centered `max-w-xl` column):
  - Signed-in pages live in the `src/app/(app)/` route group (`dashboard`, `transactions`, `analytics`, `settings`); its `layout.tsx` renders `AppShell` (slim title bar + `SyncStatus` pill + fixed bottom tab bar `Nav`). Page titles come from `NAV_LINKS` in `Nav.tsx`; pages don't render their own `<h1>`/header. Auth pages use `AuthShell`.
  - Home = `DashboardShell`: `SpendOverview` (today/week/month, server + unsynced local, cached in localStorage) → `QuickRepeat` (one-tap re-add of frequent note+amount pairs from IndexedDB, with Undo) → `TransactionForm` (amount-first, note chips via `useRecentNotes`, Today/Yesterday/date, Enter saves, refocuses amount) → compact `TransactionList`.
  - `TransactionList` groups by day, paints from IndexedDB first, reconciles with the server, and overlays unsynced queue ops (`overlayPending` in `src/lib/transactions.ts`) so changes show instantly. `useDataVersions` ticks on queue-change (re-merge locally) and synced (refetch). Rows open `TransactionSheet` (native `<dialog>` bottom sheet; edit/delete, delete needs a second tap). Server transactions are cached into IndexedDB (`cacheServerTransactions`) for offline history.
  - **Design tokens** are full colors in `src/app/globals.css` (`:root` light, `.dark` dark; mapped with `@theme inline`; AA contrast checked — keep it that way). Theme = system/light/dark via `src/lib/theme.ts` (inline init script in `layout.tsx`, picker in Settings); don't hardcode palette colors, use tokens (`bg-card`, `text-muted-foreground`, `text-warning`, …). Shared primitives: `components/ui/{button,chip,field,skeleton}.tsx`. Inputs must stay ≥16px (iOS zoom), touch targets ≥40px, no hover-only affordances, no decorative/looping animation. No splash screen.
  - Settings has a two-tap "Reset local data" (`clearLocalData` in `src/lib/idb.ts`): wipes the IndexedDB stores, cached overview and note chips on this device only (keeps `lastUserId` + theme), warns about unsynced queue ops, never touches the server.
  - Money formatting goes through `src/lib/format.ts` (`formatMoney`); currency is still effectively PKR in the UI (`DEFAULT_CURRENCY`), the Settings currency is stored but not yet applied to display/new entries.
  - Infinite scrolling uses `src/hooks/useInfiniteScroll.ts`. `framer-motion` is no longer imported anywhere (dependency left in `package.json`).
- **Service worker caching** (`public/sw.js`): `SW_VERSION`/`CACHE_NAME` must be bumped to invalidate caches; non-GET requests bypass the worker; GETs are network-first with cache fallback to `/offline`.
- **PWA metadata**: `public/manifest.json` plus icons in `public/icons` (including maskable 192/512). In `src/app/layout.tsx`, viewport and `themeColor` live in the separate `viewport` export (Next 16 requirement), not in `metadata`.

## Maintaining this file

The user requires this file to stay current at all times for future agent sessions. When a change alters commands, env, architecture, schema, API routes, or conventions described here, update this file in the same task.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
