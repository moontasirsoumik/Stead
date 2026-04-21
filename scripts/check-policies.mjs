const TOKEN = process.argv[2]
const sql = `SELECT policyname, cmd FROM pg_policies WHERE tablename = '${process.argv[3]}' ORDER BY policyname;`
const resp = await fetch('https://api.supabase.com/v1/projects/ssznueavbhpkpepdxvrm/database/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
  body: JSON.stringify({ query: sql }),
})
console.log(JSON.stringify(await resp.json(), null, 2))
