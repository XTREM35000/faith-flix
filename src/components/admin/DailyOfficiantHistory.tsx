import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDailyOfficiantHistory } from '@/lib/supabase/culteApi';
import type { DailyOfficiantHistoryEntry } from '@/types/culte';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { History, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DailyOfficiantHistoryProps {
  paroisseId: string;
  /** Nombre de jours glissants à afficher (défaut 14). */
  days?: number;
  /** Incrémenter pour recharger après enregistrement du jour. */
  refreshKey?: number;
  selectedDate: string;
  onSelectEntry: (date: string, officiantId: string | null) => void;
}

function formatDayLabel(iso: string): string {
  try {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return iso;
    return format(new Date(y, m - 1, d), 'EEE d MMM', { locale: fr });
  } catch {
    return iso;
  }
}

export function DailyOfficiantHistory({
  paroisseId,
  days = 14,
  refreshKey = 0,
  selectedDate,
  onSelectEntry,
}: DailyOfficiantHistoryProps) {
  const [entries, setEntries] = useState<DailyOfficiantHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchDailyOfficiantHistory(paroisseId, days);
      setEntries(rows);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [paroisseId, days, refreshKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card className="h-full border-muted">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" aria-hidden />
          <CardTitle className="text-base font-semibold">Historique</CardTitle>
        </div>
        <CardDescription>{days} derniers jours — cliquez une ligne pour charger cette date.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          </div>
        ) : entries.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">Aucune désignation enregistrée sur cette période.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto pr-1">
            <ul className="space-y-1 text-sm">
              {entries.map((e) => {
                const label = formatDayLabel(e.date);
                const name = e.name?.trim() || '—';
                const titlePart = e.title?.trim() ? ` (${e.title})` : '';
                const isSelected = e.date === selectedDate;
                return (
                  <li key={e.date}>
                    <button
                      type="button"
                      onClick={() => onSelectEntry(e.date, e.officiant_id)}
                      className={cn(
                        'w-full rounded-md px-2 py-2 text-left transition-colors',
                        'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isSelected && 'bg-primary/10 font-medium',
                      )}
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-foreground"> : </span>
                      <span>
                        {name}
                        {titlePart}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
