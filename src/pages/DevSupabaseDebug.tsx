import React, { useState } from 'react';
import Layout from '@/components/Layout';

const DevSupabaseDebug: React.FC = () => {
  const [profileId, setProfileId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const testFetch = async () => {
    setLoading(true);
    setResult(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${encodeURIComponent(profileId)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const body = await res.text();

      setResult({ ok: res.ok, status: res.status, statusText: res.statusText, headers: Array.from(res.headers.entries()), body });
    } catch (err: unknown) {
      setResult({ error: String(err), message: (err as any)?.message || null });
    } finally {
      setLoading(false);
    }
  };

  const curlExample = `curl -i -H "apikey: ${import.meta.env.VITE_SUPABASE_ANON_KEY || '<ANON_KEY>'}" "${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.<ID>"`;

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Supabase CORS Debug 🐞</h2>
        <p className="mb-4 text-sm text-muted-foreground">Enter a profile id to perform the same REST request the app does and show response + headers. This helps identify CORS or 502 responses.</p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Profile id</label>
          <input type="text" value={profileId} onChange={e => setProfileId(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="e.g. f14cc909-3a49-4094-ac60-0a25c47b1e99" />
        </div>

        <div className="flex gap-2 mb-6">
          <button className="btn btn-primary" onClick={testFetch} disabled={loading || !profileId}>{loading ? 'Testing...' : 'Run test fetch'}</button>
          <button className="btn" onClick={() => { setProfileId(''); setResult(null); }}>Reset</button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Curl example</label>
          <pre className="bg-muted p-3 rounded text-xs overflow-auto">{curlExample}</pre>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Result</h3>
          <pre className="bg-black/5 p-3 rounded max-h-72 overflow-auto text-sm">{result ? JSON.stringify(result, null, 2) : 'No result yet'}</pre>
        </div>
      </div>
    </Layout>
  );
};

export default DevSupabaseDebug;
