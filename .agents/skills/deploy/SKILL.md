---
name: deploy
description: >
  Stead deployment workflow skill. Handles committing and pushing code across the
  three-tier branch strategy (local → main → deploy). Invoked via `/deploy` with
  a sub-command: `deploy` (commit + push main + build + push deploy), `main`
  (commit + push main only), or `local` (commit only, no push).
---

# Stead Deploy Skill

## Invocation

This skill is activated when the user writes `/deploy` followed by one of three sub-commands:

| Sub-command | Meaning |
|---|---|
| `deploy` | Commit → push to `main` → build → sync source to `deploy` branch → push deploy |
| `main` | Commit → push to `main` only |
| `local` | Commit only — stays on local machine, no push |

If no sub-command is given, ask the user which of the three they want.

---

## Branch Rules (ALWAYS ENFORCE)

These rules are non-negotiable and must be applied on every run:

### What goes to `main`
Everything except files that have no place in version history:
- ✅ `src/` — all source code
- ✅ `public/` — static assets
- ✅ `supabase/` — migrations and config
- ✅ `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `package.json`, `bun.lock`
- ✅ `plan.md`, `progress.md`, `docs/`, `.agents/`, `scripts/`, `tests/`
- ❌ `.env`, `.env.local`, `.env.*` — NEVER commit secrets
- ❌ `node_modules/`, `dist/`, `tsconfig.tsbuildinfo` — build artifacts and deps

### What goes to `deploy`
Only the files Cloudflare Pages needs to build and serve the app:
- ✅ `src/` — source code (synced from `main` via `git checkout main -- src/`)
- ✅ `public/` — static assets
- ✅ `supabase/` — migrations (Cloudflare doesn't use these but they're useful for reference)
- ✅ `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `package.json`, `bun.lock`
- ✅ `dist/` — built production artifacts (committed directly to `deploy`)
- ❌ `plan.md`, `progress.md`, `docs/` — project docs stay on `main` only
- ❌ `.agents/`, `scripts/`, `tests/` — tooling stays on `main` only
- ❌ `.env`, `.env.local` — NEVER commit secrets

**Key insight:** The `deploy` branch does NOT get `git merge main`. Source files are synced
individually with `git checkout main -- <paths>` to avoid pulling in docs and tooling.

---

## Pre-flight Checks (Run Before Every Workflow)

Before committing anything:

1. **Check for secrets** — `git status` must not show `.env` or `.env.local` in staged files
2. **TypeScript build** — run `npx vue-tsc --noEmit` and confirm 0 errors
3. **Check for stale files** — if switching to `deploy`, check whether `src/` on deploy has old
   feature files that `main` has since removed (habits, meals, subscriptions, etc.)
4. **Confirm current branch** — always start on `main`, switch to `deploy` only for that phase

---

## Commit Message Format

All commits use conventional commit format: `type(scope): short description`

**Types:** `feat`, `fix`, `build`, `refactor`, `chore`, `docs`, `style`, `test`

**For feature work on `main`:**
```
feat(scope): short summary line

## Section Title

- Bullet detail of what changed and why
- Another detail

## Another Section

- More details as needed
```

**For deploy branch commits:**
```
build(deploy): production artifacts — <short description of what changed>

- Synced updated source from main (list key changes)
- Removed stale files: <list if any>
- Rebuilt dist/ from updated source (N modules, clean TypeScript build)
```

---

## Workflow: `local` — Commit only

Use when work is in progress or the user wants a local save point without sharing.

**Steps:**

1. Run `git status` to see what's changed
2. Run `npx vue-tsc --noEmit` — must be 0 errors before committing
3. Determine a meaningful commit message by examining what changed:
   - Group changes by type (feat, fix, refactor, etc.)
   - Write a detailed message reflecting all modified files
4. Stage all non-secret, non-artifact files: `git add -A` (git's `.gitignore` handles the rest)
5. Commit with the message
6. Confirm to the user: "Committed locally as `<hash>`. Not pushed anywhere."

---

## Workflow: `main` — Commit + push to main

Use when work is complete and ready to share / back up remotely, but not yet deploying.

**Steps:**

1. Run `git status` to see what's changed
2. Run `npx vue-tsc --noEmit` — must pass with 0 errors
3. Write a detailed commit message describing all changes
4. `git add -A` then `git commit -m "<message>"`
5. `git push origin main`
6. Confirm to the user: "Pushed to `main` as `<hash>`. Deploy branch untouched."

---

## Workflow: `deploy` — Full deploy to Cloudflare Pages

Use when the user wants live production to reflect the current work.

**Steps:**

### Phase 1 — Commit and push to `main`

1. Run `git status`
2. Run `npx vue-tsc --noEmit` — must pass with 0 errors
3. Write a detailed commit message
4. `git add -A` then commit
5. `git push origin main`

### Phase 2 — Sync source to `deploy` branch

6. `git checkout deploy`
7. Pull latest deploy: `git pull origin deploy` (ensure clean base)
8. Sync updated source from `main`:
   ```
   git checkout main -- src/ public/ index.html vite.config.ts tsconfig.json tsconfig.node.json eslint.config.js package.json bun.lock supabase/
   ```
9. **Stale file check:** Compare `src/` on deploy vs `main`. If `main` removed any feature
   folders, models, stores, or data services that still exist on `deploy`, remove them with
   `git rm -r <path>`. Common culprits: feature modules that got replaced between releases.
10. Run `npm run build` (or `bun run build`) — must succeed with 0 TypeScript errors
11. `git add dist/ src/ public/ supabase/ index.html vite.config.ts tsconfig*.json eslint.config.js package.json`
    - Never `git add -A` on deploy — this could accidentally stage `.env.local`, `node_modules/`, etc.
12. Commit: `build(deploy): production artifacts — <short description>`
13. `git push origin deploy`
14. `git checkout main` — always return to main at the end

### Phase 3 — Confirm

15. Tell the user:
    - "Pushed to `main` as `<main-hash>`"
    - "Deployed to `deploy` as `<deploy-hash>` — Cloudflare Pages will now pick up the update"
    - List any stale files that were removed during the deploy phase

---

## Safety Rules (NEVER bypass)

- **NEVER** push to any branch without an explicit sub-command from the user
- **NEVER** commit `.env`, `.env.local`, or any file containing secrets
- **NEVER** `git add -A` on the `deploy` branch — always add files explicitly
- **NEVER** force-push (`--force`) to `deploy` or `main`
- **ALWAYS** return to `main` branch after completing a deploy workflow
- **ALWAYS** run `npx vue-tsc --noEmit` before any commit — zero tolerance for TS errors
- **ALWAYS** check for stale feature files on `deploy` branch before building

---

## Quick Reference

```
/deploy local    → commit only (no push)
/deploy main     → commit + push to main
/deploy deploy   → commit + push main + build + push deploy
```
