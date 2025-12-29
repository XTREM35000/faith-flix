import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/components/ui/notification-system';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: { full_name: string };
  priority: 'high' | 'medium' | 'low';
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', priority: 'medium' });
  const { user, /* hasRole (not available in current useAuth) */ } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          author:profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err: any) {
      notifyError('Erreur', 'Impossible de charger les annonces');
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .insert([{ ...newAnnouncement, author_id: user.id }]);

      if (error) throw error;

      notifySuccess('Succès', 'Annonce publiée avec succès');
      setNewAnnouncement({ title: '', content: '', priority: 'medium' });
      fetchAnnouncements();
    } catch (err: any) {
      notifyError('Erreur', "Échec de la publication de l'annonce");
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      notifySuccess('Succès', 'Annonce supprimée avec succès');
      fetchAnnouncements();
    } catch (err: any) {
      notifyError('Erreur', "Échec de la suppression de l'annonce");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Annonces</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Nouvelle annonce</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle annonce</DialogTitle>
            </DialogHeader>
            <form onSubmit={createAnnouncement} className="space-y-4">
              <Input placeholder="Titre" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))} required />
              <Textarea placeholder="Contenu" value={newAnnouncement.content} onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))} required />
              <select className="w-full p-2 border rounded" value={newAnnouncement.priority} onChange={(e) => setNewAnnouncement(prev => ({ ...prev, priority: e.target.value }))}>
                <option value="low">Faible priorité</option>
                <option value="medium">Priorité moyenne</option>
                <option value="high">Haute priorité</option>
              </select>
              <Button type="submit" className="w-full">Publier</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {announcement.title}
                    <Badge className={getPriorityColor(announcement.priority)}>{announcement.priority === 'high' ? 'Haute' : announcement.priority === 'medium' ? 'Moyenne' : 'Faible'}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Par {announcement.author.full_name} • {new Date(announcement.created_at).toLocaleDateString()}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => deleteAnnouncement(announcement.id)}>Supprimer</Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{announcement.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
