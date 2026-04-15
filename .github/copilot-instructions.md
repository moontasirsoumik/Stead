# Stead — Workspace Instructions

This is the **Stead** household management app — a production-quality, local-first SPA deployed on Cloudflare Pages with Supabase (Postgres + Auth + RLS) as the backend.

## Key Files

- `plan.md` — master plan with full architecture, design system, domain models, DB schema, milestones
- `progress.md` — implementation status tracker (always check before starting work)

## Architecture Summary

- **Frontend**: Vue 3 + TypeScript + Vite (static SPA on Cloudflare Pages)
- **State**: Pinia stores
- **Local DB**: Dexie.js (IndexedDB) for persistent local-first cache (stale-while-revalidate)
- **Remote**: Supabase Postgres via `@supabase/supabase-js` (PostgREST)
- **Auth**: Supabase Auth (email/password, JWT)
- **Security**: Row Level Security (RLS) — every table scoped to household
- **Design**: Fluent 2-inspired custom token system + Vue components — **refined, premium, non-generic aesthetic**

## Design Quality Standard (ALL AGENTS)

Every UI output must meet the **"Quiet Confidence"** standard:
- Layered depth (shadows, elevation, translucency) — never flat rectangles
- Typographic hierarchy (3+ visual weight levels per page)
- Staggered entry animations on page load and dynamic content
- Generous whitespace and intentional spatial rhythm
- Polished interaction states (hover: bg+shadow lift, focus: branded ring, press: subtle scale)
- Contextual empty states with personality and CTAs — never "No data found"
- Design tokens for ALL visual values — zero hardcoded colors, spacing, or radii
- The result must look like a premium product, not AI-generated scaffolding

## Layer Boundaries (ENFORCED)

1. UI components → Pinia stores (never call Supabase directly)
2. Pinia stores → Data Services (never access IndexedDB directly)
3. Data Services → Supabase client + Dexie.js (fetch remote, cache locally)
4. Repositories → Dexie.js (cache-only reads)
5. All remote data validated with Zod before entering local state
6. Auth guards protect all routes except /login and /signup

## Coding Standards

- TypeScript strict mode — no `any`
- All design values use CSS custom properties from `src/tokens/` — never hardcode
- All entity IDs are UUIDs generated server-side by Postgres (`gen_random_uuid()`)
- All dates are ISO 8601 strings
- All monetary values are integer cents (never floating-point)
- All TS interface fields use `snake_case` (match Postgres columns)
- Component names: PascalCase.vue, prefix `S` for shared primitives
- Store files: `kebab.store.ts`
- Model files: `kebab.model.ts`
- Data service files: `kebab.data.ts`
- Enum values: `snake_case` string unions (not TS enums)

## Folder Conventions

- `src/components/ui/` — shared primitive components (SButton, SInput, etc.)
- `src/components/layout/` — shell and layout components
- `src/components/feedback/` — status, loading, error components
- `src/components/data/` — filter bars, lists, stats
- `src/components/forms/` — form layout components
- `src/features/{module}/` — feature-specific pages and components
- `src/features/auth/` — login, signup, onboarding pages
- `src/stores/` — Pinia stores (one per entity + auth + household)
- `src/services/cache/` — Dexie database and cache utilities
- `src/services/data/` — per-entity data services (Supabase + cache)
- `src/lib/` — Supabase client singleton
- `src/repositories/` — data access layer (IDB cache reads)
- `src/models/` — TypeScript interfaces
- `src/schemas/` — Zod validation schemas
- `supabase/migrations/` — SQL migration files

## Git & Security Rules (ALL AGENTS)

- **NEVER** push to any remote branch without explicit user approval
- **NEVER** commit `.env`, `.env.local`, or any file containing API keys/secrets
- **NEVER** hardcode Supabase URLs or keys in source code — use `import.meta.env.VITE_*`
- **NEVER** force-push to `preview` or `deploy` branches
- Commit messages: `type(scope): description` (e.g., `feat(auth): add login page`)
- Branches: `main` (full project), `preview` (build files → CF preview), `deploy` (build files → CF production)
- Only build-essential files go on `preview`/`deploy` (src/, public/, supabase/, config files)
- Plan docs, agents, tests, and tooling stay on `main` only
