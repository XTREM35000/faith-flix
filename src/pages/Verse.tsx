/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Upload, Calendar, BookOpen, Printer } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeroBanner from "@/components/HeroBanner";
import usePageHero from "@/hooks/usePageHero";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end?: number;
  text: string;
  commentary?: string;
  image_url?: string | null;
  featured_date: string;
  created_at: string;
  updated_at: string;
}

interface HeaderConfig {
  id: string;
  logo_url: string | null;
  logo_alt_text: string | null;
  main_title: string | null;
  subtitle: string | null;
}

const VersePage = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { profile } = useUser();
  const { toast } = useToast();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [todayVerse, setTodayVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });

  const [formData, setFormData] = useState({
    book: "",
    chapter: "",
    verse_start: "",
    verse_end: "",
    text: "",
    commentary: "",
    image_url: "",
    featured_date: new Date().toISOString().split("T")[0],
  });

  const isAdmin = !!(
    profile?.role &&
    ["admin", "super_admin", "administrateur"].includes(String(profile.role).toLowerCase())
  );

  // Fetch verses
  const fetchVerses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("daily_verses")
        .select("*")
        .order("featured_date", { ascending: false });

      if (error) throw error;
      setVerses(data || []);

      // Find today's verse
      const today = new Date().toISOString().split("T")[0];
      const today_verse = data?.find((v: Verse) => v.featured_date === today);
      setTodayVerse(today_verse || null);
    } catch (err) {
      console.error("Erreur lors du chargement des versets:", err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les versets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchVerses();
  }, [fetchVerses]);

  // Fetch latest header config for printing (if needed)
  useEffect(() => {
    const fetchHeaderConfig = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("header_config")
          .select("id, logo_url, logo_alt_text, main_title, subtitle")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching header config:", error);
        }

        if (data) setHeaderConfig(data);
      } catch (err) {
        console.error("Erreur lors du chargement de la config header:", err);
      }
    };

    fetchHeaderConfig();
  }, []);

  

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.book || !formData.chapter || !formData.verse_start || !formData.text) {
      toast({
        title: "Erreur",
        description: "Livre, chapitre, verset et texte sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = formData.image_url;

      // Upload image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `verses/${fileName}`;
        const bucket = import.meta.env.VITE_BUCKET_GALLERY || "gallery";

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        imageUrl = data?.publicUrl || formData.image_url;
      }

      const verseData = {
        book: formData.book,
        chapter: parseInt(formData.chapter),
        verse_start: parseInt(formData.verse_start),
        verse_end: formData.verse_end ? parseInt(formData.verse_end) : null,
        text: formData.text,
        commentary: formData.commentary || null,
        image_url: imageUrl || null,
        featured_date: formData.featured_date,
      };

      if (editingId) {
        const { error } = await (supabase as any)
          .from("daily_verses")
          .update(verseData)
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Succès", description: "Verset mis à jour." });
      } else {
        const { error } = await (supabase as any)
          .from("daily_verses")
          .insert([verseData]);

        if (error) throw error;
        toast({ title: "Succès", description: "Verset créé." });
      }

      fetchVerses();
      resetForm();
    } catch (err) {
      console.error("Erreur:", err);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le verset.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr ?")) return;

    try {
      const { error } = await (supabase as any)
        .from("daily_verses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Succès", description: "Verset supprimé." });
      fetchVerses();
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le verset.",
        variant: "destructive",
      });
    }
  };

  // Impression des versets selon une période
  const handlePrintVerses = async () => {
    const versesToPrint = dateRange.from && dateRange.to
      ? verses.filter((v) => {
          const d = new Date(v.featured_date);
          return d >= dateRange.from! && d <= dateRange.to!;
        })
      : verses;

    if (!versesToPrint || versesToPrint.length === 0) {
      toast({ title: "Aucune donnée", description: "Aucun verset à imprimer pour cette période.", variant: "destructive" });
      return;
    }

    let currentHeaderConfig = headerConfig;
    if (!currentHeaderConfig) {
      const { data } = await (supabase as any)
        .from("header_config")
        .select("id, logo_url, logo_alt_text, main_title, subtitle")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      currentHeaderConfig = data || {
        id: 'default',
        logo_url: null,
        logo_alt_text: 'Logo Paroisse',
        main_title: 'Paroisse Notre Dame',
        subtitle: 'de la Compassion'
      };
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Erreur", description: "Veuillez autoriser les fenêtres popup pour l'impression.", variant: "destructive" });
      return;
    }

    const today = format(new Date(), "d MMMM yyyy", { locale: fr });
    const fromDate = dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: fr }) : format(new Date(versesToPrint[versesToPrint.length - 1].featured_date), "dd/MM/yyyy", { locale: fr });
    const toDate = dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: fr }) : format(new Date(versesToPrint[0].featured_date), "dd/MM/yyyy", { locale: fr });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Versets - ${today}</title>
        <style>
          @page { margin: 15mm 20mm; size: A4; }
          body { font-family: 'Arial', 'Helvetica', sans-serif; margin:0; padding:0; color:#222; font-size:12pt }
          .print-header { display:flex; align-items:flex-start; margin-bottom:20px; border-bottom:2px solid #9333ea; padding-bottom:12px }
          .logo-container { margin-right:16px }
          .print-logo { max-height:80px; max-width:120px; object-fit:contain }
          .title-container { flex:1; text-align:left }
          .title { font-size:18pt; font-weight:700; color:#111 }
          .subtitle { font-size:11pt; color:#555 }
          .meta { font-size:10pt; color:#444; margin-top:6px }
          .verse { margin:14px 0; page-break-inside: avoid }
          .ref { font-weight:700; color:#111 }
          .text { margin-top:6px; color:#333 }
          .commentary { margin-top:8px; color:#555; font-style:italic }
        </style>
      </head>
      <body>
        <div class="print-header">
          ${currentHeaderConfig.logo_url ? `<div class="logo-container"><img src="${currentHeaderConfig.logo_url}" class="print-logo" alt="${currentHeaderConfig.logo_alt_text||''}"/></div>` : ''}
          <div class="title-container">
            <div class="title">${currentHeaderConfig.main_title || 'Paroisse'}</div>
            <div class="subtitle">${currentHeaderConfig.subtitle || ''}</div>
            <div class="meta">Période: ${fromDate} — ${toDate} • Imprimé le ${today}</div>
          </div>
        </div>

        <div class="content">
          ${versesToPrint.map(v => `
            <div class="verse">
              <div class="ref">${v.book} ${v.chapter}:${v.verse_start}${v.verse_end?`-${v.verse_end}`:''} — ${format(new Date(v.featured_date), 'd MMM yyyy', { locale: fr })}</div>
              <div class="text">${v.text}</div>
              ${v.commentary ? `<div class="commentary">${v.commentary}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      // Do not auto-close to let user inspect if desired
    }, 500);
  };

  const resetForm = () => {
    setFormData({
      book: "",
      chapter: "",
      verse_start: "",
      verse_end: "",
      text: "",
      commentary: "",
      image_url: "",
      featured_date: new Date().toISOString().split("T")[0],
    });
    setImageFile(null);
    setImagePreview(null);
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Verset du jour"
        subtitle="Un verset pour aujourd'hui"
        showBackButton={true}
        backgroundImage={hero?.image_url || "/images/bible.png"}
        onBgSave={saveHero}
      />

      <main className="flex-1 py-12 lg:py-16">
        <div className="container mx-auto px-4 space-y-12">
          {/* Today's Verse */}
          {todayVerse && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-xl"
            >
              {todayVerse.image_url && (
                <div className="absolute inset-0 z-0">
                  <img
                    src={todayVerse.image_url}
                    alt="Fond"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60" />
                </div>
              )}

              <div className="relative z-10 p-8 md:p-12 text-white">
                <p className="text-sm font-medium text-blue-200 mb-2">🙏 Verset du jour</p>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 italic">
                  "{todayVerse.text}"
                </h2>
                <p className="text-lg text-blue-100 font-semibold mb-6">
                  {todayVerse.book} {todayVerse.chapter}:{todayVerse.verse_start}
                  {todayVerse.verse_end && `-${todayVerse.verse_end}`}
                </p>

                {todayVerse.commentary && (
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <p className="text-blue-50 leading-relaxed">{todayVerse.commentary}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Admin Section */}
          {isAdmin && (
            <div className="space-y-4">
              <Button
                onClick={() => (showForm ? resetForm() : setShowForm(true))}
                className="gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                {showForm ? "Annuler" : "Ajouter un verset"}
              </Button>

              {/* Form */}
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg p-6 bg-card space-y-4"
                >
                  <h3 className="text-lg font-semibold">
                    {editingId ? "Modifier le verset" : "Créer un verset"}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Livre biblique"
                      value={formData.book}
                      onChange={(e) => setFormData({ ...formData, book: e.target.value })}
                    />
                    <Input
                      placeholder="Chapitre"
                      type="number"
                      value={formData.chapter}
                      onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Verset début"
                      type="number"
                      value={formData.verse_start}
                      onChange={(e) =>
                        setFormData({ ...formData, verse_start: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Verset fin (optionnel)"
                      type="number"
                      value={formData.verse_end}
                      onChange={(e) => setFormData({ ...formData, verse_end: e.target.value })}
                    />
                  </div>

                  <textarea
                    placeholder="Texte du verset"
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    rows={3}
                    className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  <textarea
                    placeholder="Commentaire (optionnel)"
                    value={formData.commentary}
                    onChange={(e) => setFormData({ ...formData, commentary: e.target.value })}
                    rows={2}
                    className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  <Input
                    placeholder="Date à afficher"
                    type="date"
                    value={formData.featured_date}
                    onChange={(e) =>
                      setFormData({ ...formData, featured_date: e.target.value })
                    }
                  />

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Image de fond</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                      <label className="block cursor-pointer">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm">Cliquez pour uploader une image</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Aperçu"
                          className="mt-3 max-h-32 mx-auto rounded"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleSave} className="flex-1">
                      Sauvegarder
                    </Button>
                    <Button onClick={resetForm} variant="outline" className="flex-1">
                      Annuler
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Filtres et Impression */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 space-y-4"
          >
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <div className="flex gap-4 md:items-end md:flex-row flex-col">
                <div className="flex-1 md:flex md:gap-3">
                  <div className="flex-1">
                    <label className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Calendar className="h-4 w-4" />
                      Du
                    </label>
                    <Input
                      type="date"
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value ? new Date(e.target.value) : null })}
                      className="w-full bg-white/90 border-2 border-gray-300 text-gray-900 focus:border-purple-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Calendar className="h-4 w-4" />
                      Au
                    </label>
                    <Input
                      type="date"
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value ? new Date(e.target.value) : null })}
                      className="w-full bg-white/90 border-2 border-gray-300 text-gray-900 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center md:pt-0 pt-2">
                  <Button
                    onClick={handlePrintVerses}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-10 w-full md:w-auto"
                    disabled={!headerConfig}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimer la sélection
                    {dateRange.from && dateRange.to && (
                      <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">
                        {format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM")}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            {headerConfig && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                {headerConfig.logo_url ? (
                  <img src={headerConfig.logo_url} alt={headerConfig.logo_alt_text || 'Logo'} className="h-8 w-8 object-contain" />
                ) : (
                  <BookOpen className="h-5 w-5 text-blue-500" />
                )}
                <div>
                  <span className="font-medium text-blue-700">{headerConfig.main_title}</span>
                  {headerConfig.subtitle && <div className="text-sm text-blue-600">{headerConfig.subtitle}</div>}
                </div>
              </div>
            )}
          </motion.div>

          {/* All Verses */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Tous les versets</h3>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chargement des versets...</p>
              </div>
            ) : verses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucun verset pour le moment.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {verses.map((verse, idx) => (
                  <motion.div
                    key={verse.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-lg">
                          {verse.book} {verse.chapter}:{verse.verse_start}
                          {verse.verse_end && `-${verse.verse_end}`}
                        </p>
                        <p className="text-sm text-muted-foreground italic">
                          "{verse.text.substring(0, 100)}..."
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {format(new Date(verse.featured_date), "d MMM", { locale: fr })}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 pt-2 border-t border-border/50">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setFormData({
                              book: verse.book,
                              chapter: verse.chapter.toString(),
                              verse_start: verse.verse_start.toString(),
                              verse_end: verse.verse_end?.toString() || "",
                              text: verse.text,
                              commentary: verse.commentary || "",
                              image_url: verse.image_url || "",
                              featured_date: verse.featured_date,
                            });
                            setEditingId(verse.id);
                            setShowForm(true);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleDelete(verse.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VersePage;