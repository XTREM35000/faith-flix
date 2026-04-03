import FeastCard from './FeastCard';
import type { ReligiousFeast } from '@/types/religiousFeasts';

interface Props {
  feasts: ReligiousFeast[];
}

export default function FeastCalendarView({ feasts }: Props) {
  if (!feasts.length) {
    return <div className="text-muted-foreground">Aucune fete religieuse sur cette periode.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {feasts.map((feast) => (
        <FeastCard key={feast.id} feast={feast} />
      ))}
    </div>
  );
}
