// Apply migration 017 (Trackers) to remote Supabase DB
// Usage: node scripts/apply-migration-017.mjs <supabase_access_token>
//
// Get your access token from: https://supabase.com/dashboard/account/tokens

import { readFileSync } from 'fs'

const PROJECT_REF = 'ssznueavbhpkpepdxvrm'
const ACCESS_TOKEN = process.argv[2]

if (!ACCESS_TOKEN) {
  console.error('Usage: node scripts/apply-migration-017.mjs <access_token>')
  console.log('\nGet your access token from https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const sqlContent = readFileSync(
  new URL('../supabase/migrations/017_trackers.sql', import.meta.url),
  'utf8',
)

console.log(`\n📦 Applying 017_trackers (${sqlContent.length} chars)...`)

const resp = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: sqlContent }),
  },
)

console.log(`Status: ${resp.status} ${resp.statusText}`)
const body = await resp.text()

if (resp.ok) {
  console.log('✅ Migration 017_trackers applied successfully!')
  try {
    const json = JSON.parse(body)
    console.log(JSON.stringify(json, null, 2).slice(0, 500))
  } catch {
    console.log(body.slice(0, 500))
  }
} else {
  console.error('❌ Migration 017_trackers failed:', body.slice(0, 1000))
  process.exit(1)
}
