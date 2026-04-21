// Create Supabase Auth accounts for the 4 dummy members
// Usage: node scripts/create-dummy-auth.mjs <supabase_access_token>

const PROJECT_REF = 'ssznueavbhpkpepdxvrm'
const ACCESS_TOKEN = process.argv[2]

if (!ACCESS_TOKEN) {
  console.error('Usage: node scripts/create-dummy-auth.mjs <access_token>')
  process.exit(1)
}

const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`

const dummyUsers = [
  { name: 'Alice Chen', email: 'alice@stead.test', password: 'alice12345' },
  { name: 'Bob Rivera', email: 'bob@stead.test', password: 'bob1234567' },
  { name: 'Chloe Kim', email: 'chloe@stead.test', password: 'chloe12345' },
  { name: 'Derek Patel', email: 'derek@stead.test', password: 'derek12345' },
]

// Step 1: Get service_role key via Management API
console.log('Fetching API keys...')
const keysResp = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`,
  { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } },
)
if (!keysResp.ok) {
  console.error('Failed to fetch API keys:', await keysResp.text())
  process.exit(1)
}
const keys = await keysResp.json()
const serviceRoleKey = keys.find((k) => k.name === 'service_role')?.api_key
if (!serviceRoleKey) {
  console.error('service_role key not found')
  process.exit(1)
}
console.log('Got service_role key')

// Step 2: Create auth users via Admin API
const results = []
for (const user of dummyUsers) {
  console.log(`Creating auth user: ${user.email}...`)
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.name },
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    console.error(`  Failed: ${err}`)
    results.push({ ...user, auth_user_id: null, error: err })
    continue
  }

  const authUser = await resp.json()
  console.log(`  Created: ${authUser.id}`)
  results.push({ ...user, auth_user_id: authUser.id, error: null })
}

// Step 3: Link auth users to existing members via SQL
console.log('\nLinking auth users to members...')
for (const r of results) {
  if (!r.auth_user_id) continue

  const sql = `UPDATE members SET user_id = '${r.auth_user_id}' WHERE name = '${r.name}' AND user_id IS NULL;`
  const resp = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query: sql }),
    },
  )

  if (resp.ok) {
    console.log(`  Linked ${r.name} → ${r.auth_user_id}`)
  } else {
    console.error(`  Failed to link ${r.name}:`, await resp.text())
  }
}

// Step 4: Write credentials file
import { writeFileSync } from 'fs'
const lines = [
  'Stead — Dummy Test Accounts',
  '============================',
  '',
  ...results.map(
    (r) =>
      `${r.name}\n  Email:    ${r.email}\n  Password: ${r.password}\n  Auth ID:  ${r.auth_user_id || 'FAILED'}\n`,
  ),
  'Login at: http://localhost:5173/login',
  `Supabase Dashboard: https://supabase.com/dashboard/project/${PROJECT_REF}`,
]
writeFileSync('dummy-accounts.txt', lines.join('\n'))
console.log('\n✅ Credentials saved to dummy-accounts.txt')
