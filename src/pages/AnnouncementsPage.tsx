import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, Trash2, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import HeroBanner from "@/components/HeroBanner";
import { useLocation } from "react-router-dom";
import usePageHero from "@/hooks/usePageHero";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: string;
  image_url?: string;
  author_name?: string;
}

const AnnouncementsPage = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { profile } = useUser();
  const { toast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "" });

  const isAdmin = !!(
    profile &&
    profile.role &&
    ["admin", "super_admin", "administrateur"].includes(
      String(profile.role).toLowerCase()
    )
  );

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("announcements")
          .select("id, title, content, created_at, created_by, image_url")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Query error:", error);
          throw error;
        }
        setAnnouncements(data || []);
      } catch (error) {
        console.error("Erreur lors du chargement des annonces:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les annonces.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [toast]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(
      (ann) =>
        ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [announcements, searchTerm]);

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from("announcements")
          .update({
            title: formData.title,
            content: formData.content,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast({
          title: "Succès",
          description: "Annonce mise à jour.",
        });
        setEditingId(null);
      } else {
        // Insert
        const { error } = await supabase.from("announcements").insert([
          {
            title: formData.title,
            content: formData.content,
            created_by: profile?.id,
          },
        ]);

        if (error) throw error;
        toast({
          title: "Succès",
          description: "Annonce créée.",
        });
      }

      setFormData({ title: "", content: "" });
      setShowForm(false);

      // Refresh list
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'annonce.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Succès",
        description: "Annonce supprimée.",
      });

      setAnnouncements(announcements.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'annonce.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({ title: announcement.title, content: announcement.content });
    setEditingId(announcement.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ title: "", content: "" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Annonces Paroissiales"
        subtitle="Retrouvez toutes les annonces et actualités de notre paroisse"
        showBackButton={true}
        backgroundImage={hero?.image_url || "/images/announcements.png"}
        onBgSave={saveHero}
      />

      <div className="container mx-auto px-4 py-12">
        {/* Admin Panel */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
          >
            {!showForm ? (
              <Button
                onClick={() => setShowForm(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                + Nouvelle Annonce
              </Button>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Titre de l'annonce"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Contenu de l'annonce"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Sauvegarder
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une annonce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </motion.div>

        {/* Announcements List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement des annonces...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground text-lg">
              {searchTerm
                ? "Aucune annonce ne correspond à votre recherche."
                : "Aucune annonce pour le moment."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredAnnouncements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-6">
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(
                            new Date(announcement.created_at),
                            "d MMMM yyyy",
                            { locale: fr }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {announcement.content}
                  </p>

                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="flex gap-2 pt-4 border-t border-border/50">
                      <Button
                        onClick={() => handleEdit(announcement)}
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-blue-600 hover:bg-blue-500/10"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Éditer
                      </Button>
                      <Button
                        onClick={() => handleDelete(announcement.id)}
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
