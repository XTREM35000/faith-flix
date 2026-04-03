import { Bell } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ReligiousFeast } from '@/types/religiousFeasts';

interface Props {
  nextFeast?: ReligiousFeast;
}

export default function FeastNotificationBanner({ nextFeast }: Props) {
  if (!nextFeast) return null;
  const dateLabel = new Date(nextFeast.date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
  });

  return (
    <Alert>
      <Bell className="h-4 w-4" />
      <AlertTitle>Rappel spirituel</AlertTitle>
      <AlertDescription>
        {`📆 ${nextFeast.name} arrive le ${dateLabel}. Rappels automatiques prevus en J-7, J-3 et J-1.`}
      </AlertDescription>
    </Alert>
  );
}
