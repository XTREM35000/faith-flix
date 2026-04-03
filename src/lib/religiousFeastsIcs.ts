import type { ReligiousFeast } from '@/types/religiousFeasts';

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '\\n');
}

function foldIcsLine(line: string): string {
  const max = 73;
  if (line.length <= max) return line;
  let out = '';
  let rest = line;
  while (rest.length > max) {
    out += `${rest.slice(0, max)}\r\n `;
    rest = rest.slice(max);
  }
  return out + rest;
}

function formatIcsDate(d: string): string {
  return d.replaceAll('-', '');
}

function dtStampUtc(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

export function buildSingleFeastIcs(feast: ReligiousFeast, origin?: string): string {
  const uid = `${feast.id}@paroisse-feasts`;
  const start = formatIcsDate(feast.date);
  const endDate = new Date(feast.date);
  endDate.setDate(endDate.getDate() + 1);
  const end = formatIcsDate(endDate.toISOString().slice(0, 10));
  const summary = escapeIcsText(feast.name);
  const descParts = [feast.description, feast.gospel_reference ? `Évangile: ${feast.gospel_reference}` : '', feast.prayer_text].filter(Boolean);
  const description = escapeIcsText(descParts.join('\n\n'));
  const url = origin ? `${origin.replace(/\/$/, '')}/spiritual/feasts/${feast.id}` : '';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Paroisse//Religious Feasts//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStampUtc()}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    foldIcsLine(`SUMMARY:${summary}`),
  ];
  if (description) lines.push(foldIcsLine(`DESCRIPTION:${description}`));
  if (url) lines.push(foldIcsLine(`URL:${url}`));
  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n') + '\r\n';
}

export function buildMonthFeastsIcs(feasts: ReligiousFeast[], origin?: string): string {
  const parts = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Paroisse//Religious Feasts//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const feast of feasts) {
    const uid = `${feast.id}@paroisse-feasts`;
    const start = formatIcsDate(feast.date);
    const endDate = new Date(feast.date);
    endDate.setDate(endDate.getDate() + 1);
    const end = formatIcsDate(endDate.toISOString().slice(0, 10));
    const summary = escapeIcsText(feast.name);
    const descParts = [feast.description, feast.gospel_reference ? `Évangile: ${feast.gospel_reference}` : ''].filter(Boolean);
    const description = escapeIcsText(descParts.join('\n\n'));
    const url = origin ? `${origin.replace(/\/$/, '')}/spiritual/feasts/${feast.id}` : '';

    parts.push('BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${dtStampUtc()}`, `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`);
    parts.push(foldIcsLine(`SUMMARY:${summary}`));
    if (description) parts.push(foldIcsLine(`DESCRIPTION:${description}`));
    if (url) parts.push(foldIcsLine(`URL:${url}`));
    parts.push('END:VEVENT');
  }

  parts.push('END:VCALENDAR');
  return parts.join('\r\n') + '\r\n';
}

export function downloadIcsFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
