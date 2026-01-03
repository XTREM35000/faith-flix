import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAboutPage } from '@/hooks/useAboutPage';
import { uploadFile } from '@/lib/supabase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const AdminAboutEditor: React.FC = () => {
  const { data, isLoading } = useAboutPage();
  const [editing, setEditing] = useState<any | null>(null);
  const queryClient = useQueryClient();

  if (isLoading) return <div>Chargement...</div>;

  const startEdit = (section: any) => setEditing(section);
  const clearEdit = () => setEditing(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadFile(file, 'gallery');
      const url = res.publicUrl;
      setEditing((prev: any) => ({ ...prev, background_image: url }));
    } catch (err) {
      toast({ title: 'Upload échoué', description: 'Impossible d\'uploader le fichier.' });
    }
  };

  const saveSection = async () => {
    // Minimal stub: optimistic UI + invalidate. Real implementation should call an API/mutation.
    try {
      // TODO: implement mutation to save `editing` to Supabase `about_page_sections`
      toast({ title: 'Sauvegardé', description: 'Changements locaux uniquement (implémenter mutation).' });
      queryClient.invalidateQueries(['aboutPage']);
      clearEdit();
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder.' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Administration — Page À propos</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h2 className="text-lg font-medium mb-3">Sections existantes</h2>
          <div className="space-y-2">
            {(data || []).map((s: any) => (
              <div key={s.id} className="p-3 bg-card rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.title || s.section_key}</div>
                  <div className="text-sm text-muted-foreground">{s.section_key}</div>
                </div>
                <div className="space-x-2">
                  <Button size="sm" onClick={() => startEdit(s)}>Éditer</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-lg font-medium mb-3">Éditeur</h2>
          {editing ? (
            <div className="space-y-4">
              <label className="block">
                <div className="text-sm mb-1">Titre</div>
                <Input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </label>

              <label className="block">
                <div className="text-sm mb-1">Sous-titre</div>
                <Textarea value={editing.subtitle || ''} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
              </label>

              <label className="block">
                <div className="text-sm mb-1">Image de fond</div>
                <input type="file" accept="image/*" onChange={handleFile} />
                {editing.background_image && (
                  <img src={editing.background_image} className="mt-2 w-full max-h-48 object-cover rounded" alt="preview" />
                )}
              </label>

              <div className="flex gap-2">
                <Button onClick={saveSection}>Sauvegarder</Button>
                <Button variant="ghost" onClick={clearEdit}>Annuler</Button>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Sélectionnez une section à éditer.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAboutEditor;
