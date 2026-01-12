import React, { useEffect, useState } from 'react';
import { LEXIQUE_TERMS } from '../data/terms';
import { validateWithFetch } from '../utils/imageValidator';

type Row = { id: string; url: string; exists: boolean; status?: number | string };

export default function LexiqueDiagnostic(): JSX.Element {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await validateWithFetch(LEXIQUE_TERMS);
      if (!mounted) return;
      setRows(res.map((r) => ({ id: r.id, url: r.url, exists: r.exists, status: r.status })));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div>Vérification des images en cours…</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Diagnostic des images Lexique</h2>
      <p className="text-sm text-slate-600">Vérifie l'existence des fichiers sous <code>/public/images/lexique</code>.</p>
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th>Term</th>
            <th>URL</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows?.map((r) => (
            <tr key={r.id} className={r.exists ? 'text-green-700' : 'text-rose-600'}>
              <td className="py-1">{r.id}</td>
              <td className="py-1 break-all">{r.url}</td>
              <td className="py-1">{r.exists ? `OK (${r.status})` : `MISSING (${r.status})`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
