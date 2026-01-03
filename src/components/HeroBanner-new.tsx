import { motion } from "framer-motion";
import { Calendar, ChevronRight, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HeroBgEditor from "@/components/HeroBgEditor";
import { useState, useEffect } from "react";
import usePageHero from "@/hooks/usePageHero";

interface HeroBannerProps {
  title: string;
  subtitle: string;
  eventTitle?: string;
  eventDate?: string;
  backgroundImage?: string;
  showBackButton?: boolean;
  description?: string;
  bucket?: string;
  onBgSave?: (url: string) => Promise<void> | void;
}

const HeroBanner = ({
  title: propTitle,
  subtitle: propSubtitle,
  eventTitle,
  eventDate,
  backgroundImage: propBackgroundImage,
  showBackButton = true,
  description,
  bucket,
  onBgSave,
}: HeroBannerProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer les données depuis la base via usePageHero
  const { data: pageHero, save: saveHero } = usePageHero(location.pathname);

  // Priorité : props > base de données
  const backgroundImage = propBackgroundImage || pageHero?.image_url;
  const title = propTitle || "";
  const subtitle = propSubtitle || "";

  const [bg, setBg] = useState<string | undefined>(backgroundImage);

  // Synchroniser quand backgroundImage change (navigation)
  useEffect(() => {
    setBg(backgroundImage);
  }, [backgroundImage]);

  const handleBgSave = async (url: string) => {
    // Mettre à jour localement pour un rendu immédiat
    setBg(url);

    // Sauvegarder dans la base via le hook usePageHero
    try {
      await saveHero(url);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }

    // Émettre un événement global que l'app peut écouter pour persistance
    try {
      const ev = new CustomEvent("hero-bg-changed", {
        detail: { path: location.pathname, url },
      });
      window.dispatchEvent(ev);
    } catch (e) {
      // noop
    }

    // Appeler le callback si fourni pour persister la donnée
    if (onBgSave) {
      await onBgSave(url);
    }
  };

  return (
    <section className="relative min-h-[50vh] lg:min-h-[60vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {bg ? (
          <img
            src={bg}
            alt=""
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full gradient-hero" />
        )}
        {bg && (
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/30 via-foreground/20 to-transparent" />
        )}
      </div>

      {/* Editor button for non-index pages */}
      {location.pathname !== "/" && (
        <HeroBgEditor
          current={bg}
          onSave={handleBgSave}
          bucket={bucket}
          path={location.pathname}
        />
      )}

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          {/* Back Button */}
          {showBackButton && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => navigate(-1)}
              className="mb-6 inline-flex items-center gap-2 text-sm text-white hover:text-primary-foreground transition-colors backdrop-blur-sm bg-black/40 px-3 py-1.5 rounded-full border border-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </motion.button>
          )}

          {/* Event Badge */}
          {eventTitle && eventDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                <Calendar className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-white">
                  <strong>{eventTitle}</strong> • {eventDate}
                </span>
              </div>
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 drop-shadow-lg"
          >
            {title}
          </motion.h1>

          {/* Subtitle/Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed drop-shadow-md max-w-2xl"
          >
            {description || subtitle}
          </motion.p>

          {/* CTA Buttons - Only show on homepage */}
          {subtitle.includes("Découvrez") && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Button
                asChild
                size="lg"
                className="bg-gold hover:bg-gold-light text-secondary-foreground font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                <Link to="/videos">
                  Découvrir nos vidéos
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/20 backdrop-blur-sm hover:border-white/50"
              >
                <Link to="/evenements">Voir les événements</Link>
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent"
      />
    </section>
  );
};

export default HeroBanner;
