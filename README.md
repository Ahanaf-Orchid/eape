# Ethereum Apes

A Next.js referral and rewards platform with a 3-layer architecture:
- **Layer 1**: Hardcoded frontend UI (instant render)
- **Layer 2**: Editable public config (admin-controlled, fetched on load)
- **Layer 3**: Backend-validated data (rewards, verification, user data)

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Database**: SQLite via `better-sqlite3` (WAL mode)
- **API**: Next.js API Routes
- **Deployment**: Docker Compose (app + nginx) on Hostinger KVM 4

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Brand Configuration

Edit `src/lib/site-config.ts` to change project name, symbols, social links, and all brand constants. Rebuild and redeploy.

## Architecture

See `docs/ARCHITECTURE.md` for the full 3-layer architecture specification.

## Project Structure

```
src/
├── app/              # Next.js pages + API routes
├── components/       # Reusable React components
├── contexts/         # React contexts
└── lib/              # Shared libraries
docs/                 # Architecture and planning documentation
data/                 # SQLite database (gitignored)
private/              # Secure configs (gitignored)
```

## Deployment

See `docs/deploy-guide.md` for deployment instructions.
