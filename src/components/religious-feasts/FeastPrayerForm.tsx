import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Props {
  onSubmit: (intention: string, isPublic: boolean) => Promise<void>;
}

export default function FeastPrayerForm({ onSubmit }: Props) {
  const [intention, setIntention] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!intention.trim()) return;
    setSaving(true);
    try {
      await onSubmit(intention.trim(), isPublic);
      setIntention('');
      setIsPublic(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={intention}
        onChange={(e) => setIntention(e.target.value)}
        placeholder="Deposez votre intention de priere pour cette fete..."
      />
      <div className="flex items-center gap-2">
        <Switch checked={isPublic} onCheckedChange={setIsPublic} id="public-intention" />
        <Label htmlFor="public-intention">Rendre cette intention publique</Label>
      </div>
      <Button onClick={submit} disabled={saving || !intention.trim()}>
        {saving ? 'Enregistrement...' : 'Publier mon intention'}
      </Button>
    </div>
  );
}
