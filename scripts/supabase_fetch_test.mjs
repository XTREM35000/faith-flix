import 'dotenv/config';
import https from 'https';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('VITE_SUPABASE_URL is not set in .env');
  process.exit(1);
}
if (!ANON) {
  console.error('VITE_SUPABASE_ANON_KEY is not set in .env');
  process.exit(1);
}

const id = process.argv[2] || 'f14cc909-3a49-4094-ac60-0a25c47b1e99';
const fields = process.argv[3] || '*';
const url = `${SUPABASE_URL}/rest/v1/profiles?select=${encodeURIComponent(fields)}&id=eq.${encodeURIComponent(id)}`;

console.log('Requesting:', url);

(async () => {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${ANON}`,
        'Accept': 'application/json',
      },
      // follow redirects
      redirect: 'follow',
      // node's global fetch needs agent for self-signed in some envs; use default
    });

    console.log('Status:', res.status, res.statusText);
    console.log('Headers:');
    for (const [k, v] of res.headers.entries()) {
      console.log(`  ${k}: ${v}`);
    }

    const text = await res.text();
    console.log('Body:', text.slice(0, 2000));
  } catch (err) {
    console.error('Fetch failed:', err);
  }
})();
