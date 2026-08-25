import { createServerSupabaseClient } from '../server-client.ts';

async function main() {
  const client = createServerSupabaseClient();
  const { error } = await client.from('analysis_snapshots').select('id', { count: 'exact', head: true }).limit(1);
  if (error) throw new Error(`Server client privileged SELECT failed: ${error.message}`);
  console.log('Supabase server client smoke QA PASS');
}
main();
