import type { LexiqueTerm } from '../types';

type ValidationResult = {
  id: string;
  url: string;
  exists: boolean;
  status?: number | string;
};

export async function validateWithFetch(terms: LexiqueTerm[]): Promise<ValidationResult[]> {
  const checks = terms.map(async (t) => {
    const path = t.imagePath ? `/images/lexique/${t.imagePath}.png` : null;
    const url = path ?? '';
    if (!path) return { id: t.id, url, exists: false, status: 'no-imagePath' };
    try {
      const res = await fetch(path, { method: 'HEAD' });
      return { id: t.id, url, exists: res.ok, status: res.status };
    } catch (err: any) {
      return { id: t.id, url, exists: false, status: String(err?.message ?? err) };
    }
  });
  return Promise.all(checks);
}

// Node.js file-system validator (for CI / local script)
export async function validateWithFs(terms: LexiqueTerm[], publicDir = 'public') {
  const results: ValidationResult[] = [];
  let fs: typeof import('fs/promises');
  try {
    // dynamic import so file still compiles in browser
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    fs = require('fs').promises;
  } catch (e) {
    throw new Error('validateWithFs must run in Node.js environment');
  }

  for (const t of terms) {
    const rel = t.imagePath ? `images/lexique/${t.imagePath}.png` : null;
    if (!rel) {
      results.push({ id: t.id, url: '', exists: false, status: 'no-imagePath' });
      continue;
    }
    const full = `${publicDir}/${rel}`;
    try {
      await fs.stat(full);
      results.push({ id: t.id, url: full, exists: true, status: 'ok' });
    } catch (err: any) {
      results.push({ id: t.id, url: full, exists: false, status: err?.code ?? String(err) });
    }
  }

  return results;
}

export type { ValidationResult };
