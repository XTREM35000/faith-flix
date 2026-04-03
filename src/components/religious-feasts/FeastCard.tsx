import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ReligiousFeast } from '@/types/religiousFeasts';

interface Props {
  feast: ReligiousFeast;
}

export default function FeastCard({ feast }: Props) {
  const dateLabel = new Date(feast.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Link to={`/spiritual/feasts/${feast.id}`} className="block">
      <Card className="hover:border-primary transition-colors">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">{feast.name}</CardTitle>
            {feast.feast_type === 'movable' ? <Badge>Mobile</Badge> : <Badge variant="outline">Fixe</Badge>}
          </div>
          <CardDescription>{dateLabel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {feast.description ? <p className="text-sm text-muted-foreground line-clamp-2">{feast.description}</p> : null}
          {feast.gospel_reference ? <p className="text-sm">Evangile: {feast.gospel_reference}</p> : null}
        </CardContent>
      </Card>
    </Link>
  );
}
