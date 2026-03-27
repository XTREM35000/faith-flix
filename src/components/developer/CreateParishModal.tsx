import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface CreateParishModalProps {
  onCreate: (data: { nom: string; slug: string; description?: string }) => Promise<unknown>;
}

export function CreateParishModal({ onCreate }: CreateParishModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    slug: '',
    description: '',
  });
  const { toast } = useToast();

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom de la paroisse est requis',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const result = await onCreate({
      nom: formData.nom.trim(),
      slug: (formData.slug || generateSlug(formData.nom)).trim(),
      description: formData.description.trim() || undefined,
    });

    if (result) {
      setFormData({ nom: '', slug: '', description: '' });
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#ffb347] text-white hover:bg-[#ffa01e]">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle paroisse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Creer une nouvelle paroisse</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nom">Nom de la paroisse *</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => {
                const newName = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  nom: newName,
                  slug: prev.slug || generateSlug(newName),
                }));
              }}
              placeholder="Ex: Paroisse Saint-Pierre"
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug (URL unique)</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="saint-pierre"
            />
            <p className="mt-1 text-xs text-gray-500">Laissez vide pour generer automatiquement</p>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description de la paroisse..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#ffb347] hover:bg-[#ffa01e]">
              {loading ? 'Creation...' : 'Creer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
