// Apply migration 013 — Privacy & Sharing Features
// Usage: node scripts/apply-migration-013.mjs <supabase_access_token>
// Or via direct DB connection if no token provided.

import { readFileSync } from 'fs'

const PROJECT_REF = 'ssznueavbhpkpepdxvrm'
const ACCESS_TOKEN = process.argv[2]

const sqlContent = readFileSync(
  new URL('../supabase/migrations/013_privacy_sharing.sql', import.meta.url),
  'utf8',
)

console.log(`SQL length: ${sqlContent.length} chars`)

if (ACCESS_TOKEN) {
  console.log('Executing via Supabase Management API...')
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
    console.log('✅ Migration 013 applied successfully!')
    try {
      const json = JSON.parse(body)
      console.log(JSON.stringify(json, null, 2).slice(0, 500))
    } catch {
      console.log(body.slice(0, 500))
    }
  } else {
    console.error('❌ Failed:', body.slice(0, 1000))
    process.exit(1)
  }
} else {
  console.error('Usage: node scripts/apply-migration-013.mjs <access_token>')
  console.log('\nGet your access token from https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}
