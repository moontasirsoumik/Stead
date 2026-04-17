// Run SQL migrations via the Supabase Management API
// Uses the dashboard access token to authenticate

import { readFileSync } from 'fs';

const PROJECT_REF = 'ssznueavbhpkpepdxvrm';
const ACCESS_TOKEN = process.argv[2]; // Pass as CLI arg

if (!ACCESS_TOKEN) {
  console.error('Usage: node run-migrations-api.mjs <access_token>');
  process.exit(1);
}

const sqlContent = readFileSync(
  new URL('./apply-migrations-ddl-only.sql', import.meta.url),
  'utf8'
);

console.log(`SQL length: ${sqlContent.length} chars`);
console.log('Executing via Management API...');

const resp = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: sqlContent }),
  }
);

console.log(`Status: ${resp.status} ${resp.statusText}`);
const body = await resp.text();

if (resp.ok) {
  console.log('✅ Migrations applied successfully!');
  try {
    const json = JSON.parse(body);
    console.log('Result:', JSON.stringify(json, null, 2).substring(0, 500));
  } catch {
    console.log('Response:', body.substring(0, 500));
  }
} else {
  console.error('❌ Failed to apply migrations');
  console.error('Response:', body.substring(0, 1000));
}
