import postgres from 'postgres'
import { readFileSync } from 'fs'

const ref = 'ssznueavbhpkpepdxvrm'
const password = '*YC73rhvq98'

const configs = [
  { host: `db.${ref}.supabase.co`, port: 5432, username: 'postgres', label: 'direct' },
  { host: `db.${ref}.supabase.co`, port: 5432, username: `postgres.${ref}`, label: 'direct-dotuser' },
  { host: `aws-0-eu-west-1.pooler.supabase.com`, port: 5432, username: `postgres.${ref}`, label: 'pooler-session' },
  { host: `aws-0-eu-west-1.pooler.supabase.com`, port: 6543, username: `postgres.${ref}`, label: 'pooler-transaction' },
]

for (const cfg of configs) {
  try {
    console.log(`Trying ${cfg.label}...`)
    const sql = postgres({
      host: cfg.host,
      port: cfg.port,
      database: 'postgres',
      username: cfg.username,
      password,
      ssl: 'require',
      connect_timeout: 10,
    })
    const result = await sql`SELECT current_database() as db, current_user as usr`
    console.log(`✓ Connected via ${cfg.label}:`, result[0])

    console.log('\n📦 Applying calendar_events migration...')
    const migrationSQL = readFileSync('supabase/migrations/011_calendar_events.sql', 'utf8')
    await sql.unsafe(migrationSQL)
    console.log('✓ calendar_events table created with RLS policies!')

    await sql.end()
    process.exit(0)
  } catch (e) {
    console.log(`  ✗ ${e.message?.slice(0, 150)}`)
  }
}
console.log('Could not connect')
process.exit(1)
