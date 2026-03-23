import { motion } from "framer-motion";
import type { Video } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useFeaturedVideo } from "@/hooks/useFeaturedVideo";
import { Skeleton } from "@/components/ui/skeleton";

interface LiveHeroSectionProps {
  onOpenVideo?: (video: Video) => void;
}

const LiveHeroSection = ({ onOpenVideo }: LiveHeroSectionProps) => {
  const { live, video: heroVideo, isLive, loading, state } = useFeaturedVideo();

  if (loading) {
    return (
      <section className="py-10 lg:py-14">
        <div className="container mx-auto px-4">
          <Skeleton className="aspect-video max-w-3xl mx-auto w-full rounded-2xl" />
        </div>
      </section>
    );
  }

  if (isLive && live) {
    return (
      <section className="py-10 lg:py-14">
        <div className="container mx-auto px-4">
          <div className="relative max-w-3xl mx-auto bg-gradient-to-br from-red-900/20 to-red-600/20 rounded-2xl overflow-hidden shadow-2xl">
            <div className="absolute top-4 left-4 z-20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 rounded-full blur-md animate-pulse" />
                <div className="relative px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-full shadow-2xl flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  EN DIRECT
                </div>
              </div>
            </div>

            <div className="aspect-video w-full bg-black">
              <iframe
                src={live.stream_url}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={live.title}
              />
            </div>

            <div className="p-6 bg-background/95 backdrop-blur-sm">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {live.title}
              </h2>
              {live.description && (
                <p className="text-sm md:text-base text-muted-foreground mb-3 line-clamp-3">
                  {live.description}
                </p>
              )}
              <p className="text-xs md:text-sm text-muted-foreground">
                Direct {live.stream_type === "radio" ? "Radio" : "TV"} —{" "}
                {new Date(live.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (state?.kind === "vod" && heroVideo) {
    return (
      <section className="py-10 lg:py-14">
        <div className="container mx-auto px-4">
          <div className="relative max-w-3xl mx-auto bg-gradient-to-br from-blue-900/20 to-purple-600/20 rounded-2xl overflow-hidden shadow-2xl group">
            <div className="absolute top-4 left-4 z-20">
              <div className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs md:text-sm font-bold rounded-full shadow-lg flex items-center gap-2">
                <span>📹</span>
                DERNIÈRE VIDÉO
              </div>
            </div>

            <div className="aspect-video w-full relative">
              <img
                src={
                  (heroVideo as { thumbnail_url?: string | null }).thumbnail_url ||
                  "/images/default-thumbnail.jpg"
                }
                alt={heroVideo.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 flex items-center gap-2"
                  onClick={() => onOpenVideo?.(heroVideo)}
                >
                  <Play className="h-5 w-5" />
                  Regarder
                </Button>
              </div>
            </div>

            <div className="p-6 bg-background/95 backdrop-blur-sm">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {heroVideo.title}
              </h2>
              {heroVideo.description && (
                <p className="text-sm md:text-base text-muted-foreground mb-3 line-clamp-3">
                  {heroVideo.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground">
                <span>
                  📅{" "}
                  {new Date(heroVideo.created_at || "").toLocaleDateString(
                    "fr-FR"
                  )}
                </span>
                <span>👁️ {(heroVideo as { views?: number }).views ?? 0} vues</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 lg:py-14">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto aspect-video w-full rounded-2xl border border-border bg-muted/50 flex flex-col items-center justify-center gap-2 px-6 text-center"
        >
          <p className="text-muted-foreground text-lg">
            Pas de vidéo pour le moment
          </p>
          <p className="text-sm text-muted-foreground/80">
            Revenez plus tard pour un direct ou une nouvelle vidéo.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default LiveHeroSection;
