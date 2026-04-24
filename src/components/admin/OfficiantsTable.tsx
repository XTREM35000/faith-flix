import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { OfficiantRow } from '@/types/culte';
import { Edit2, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const PAGE_OPTIONS = [10, 25, 50] as const;

export interface OfficiantsTableProps {
  paroisseNom: string;
  officiants: OfficiantRow[];
  titleOptions: string[];
  loading?: boolean;
  onEdit: (row: OfficiantRow) => void;
  onDelete: (row: OfficiantRow) => void;
}

export function OfficiantsTable({
  paroisseNom,
  officiants,
  titleOptions,
  loading,
  onEdit,
  onDelete,
}: OfficiantsTableProps) {
  const [search, setSearch] = useState('');
  const [titleFilter, setTitleFilter] = useState<string>('__all');
  const [pageSize, setPageSize] = useState<(typeof PAGE_OPTIONS)[number]>(10);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = officiants;
    if (titleFilter === '__none') rows = rows.filter((o) => !o.title?.trim());
    else if (titleFilter !== '__all') rows = rows.filter((o) => (o.title ?? '') === titleFilter);
    if (q) {
      rows = rows.filter((o) => o.name.toLowerCase().includes(q) || (o.title ?? '').toLowerCase().includes(q));
    }
    return rows;
  }, [officiants, search, titleFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount, filtered.length]);

  const safePage = Math.min(page, pageCount - 1);
  const pageRows = useMemo(() => {
    const start = safePage * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <Input
          placeholder="Rechercher par nom ou titre…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-md"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={titleFilter}
            onValueChange={(v) => {
              setTitleFilter(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Titre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Tous les titres</SelectItem>
              <SelectItem value="__none">Sans titre</SelectItem>
              {titleOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v) as (typeof PAGE_OPTIONS)[number]);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Nom</TableHead>
              <TableHead className="hidden sm:table-cell">Titre</TableHead>
              <TableHead className="hidden md:table-cell">Paroisse</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="hidden lg:table-cell">Création</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  <Loader2 className="inline h-5 w-5 animate-spin mr-2 align-middle" />
                  Chargement…
                </TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Aucun officiant ne correspond aux filtres.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{o.name}</span>
                      <span className="text-xs text-muted-foreground sm:hidden">{o.title || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{o.title || '—'}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{paroisseNom || '—'}</TableCell>
                  <TableCell>
                    {o.is_active ? (
                      <Badge variant="default" className="font-normal">
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-normal">
                        Inactif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {formatDate(o.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(o)} title="Modifier">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(o)}
                        title="Supprimer"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {filtered.length} officiant(s) — page {safePage + 1} / {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Précédent
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Suivant
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
