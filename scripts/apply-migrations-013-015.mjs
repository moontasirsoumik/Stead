// Apply migrations 013 (Privacy & Sharing) + 015 (Boards)
// Usage: node scripts/apply-migrations-013-015.mjs <supabase_access_token>

import { readFileSync } from 'fs'

const PROJECT_REF = 'ssznueavbhpkpepdxvrm'
const ACCESS_TOKEN = process.argv[2]

if (!ACCESS_TOKEN) {
  console.error('Usage: node scripts/apply-migrations-013-015.mjs <access_token>')
  console.log('\nGet your access token from https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const migrations = [
  { name: '013_privacy_sharing', file: '013_privacy_sharing.sql' },
  { name: '015_boards', file: '015_boards_replace_meals_habits_subs.sql' },
]

for (const migration of migrations) {
  const sqlContent = readFileSync(
    new URL(`../supabase/migrations/${migration.file}`, import.meta.url),
    'utf8',
  )

  console.log(`\n📦 Applying ${migration.name} (${sqlContent.length} chars)...`)

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
    console.log(`✅ ${migration.name} applied successfully!`)
    try {
      const json = JSON.parse(body)
      console.log(JSON.stringify(json, null, 2).slice(0, 300))
    } catch {
      console.log(body.slice(0, 300))
    }
  } else {
    console.error(`❌ ${migration.name} failed:`, body.slice(0, 1000))
    process.exit(1)
  }
}

console.log('\n🎉 All migrations applied successfully!')
