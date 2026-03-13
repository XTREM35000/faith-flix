import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { fetchActiveLiveStream, type LiveStream } from "@/lib/supabase/mediaQueries";
import type { Video } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface LiveHeroSectionProps {
  latestVideos: Video[] | null | undefined;
  onOpenVideo?: (video: Video) => void;
}

const LiveHeroSection = ({ latestVideos, onOpenVideo }: LiveHeroSectionProps) => {
  const [status, setStatus] = useState<"loading" | "live" | "vod" | "empty">(
    "loading"
  );
  const [liveStream, setLiveStream] = useState<LiveStream | null>(null);
  const [heroVideo, setHeroVideo] = useState<Video | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const stream = await fetchActiveLiveStream();
        if (cancelled) return;
        if (stream) {
          setLiveStream(stream);
          setStatus("live");
        } else if (latestVideos && latestVideos.length > 0) {
          setHeroVideo(latestVideos[0] as Video);
          setStatus("vod");
        } else {
          setStatus("empty");
        }
      } catch (e) {
        console.error("[LiveHeroSection] error", e);
        if (!cancelled) setStatus("empty");
      }
    };

    void load();

    const channel = supabase
      .channel("public:live_streams_hero")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_streams" },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [latestVideos]);

  if (status === "loading") {
    return (
      <section className="py-10 lg:py-14">
        <div className="container mx-auto px-4">
          <div className="h-64 md:h-80 rounded-2xl bg-muted animate-pulse" />
        </div>
      </section>
    );
  }

  if (status === "live" && liveStream) {
    return (
      <section className="py-10 lg:py-14">
        <div className="container mx-auto px-4">
          <div className="relative max-w-3xl mx-auto bg-gradient-to-br from-red-900/20 to-red-600/20 rounded-2xl overflow-hidden shadow-2xl">
            {/* Badge DIRECT */}
            <div className="absolute top-4 left-4 z-20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 rounded-full blur-md animate-pulse" />
                <div className="relative px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-full shadow-2xl flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  DIRECT
                </div>
              </div>
            </div>

            {/* Player simple basé sur l'URL fallback */}
            <div className="aspect-video w-full bg-black">
              <iframe
                src={liveStream.stream_url}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={liveStream.title}
              />
            </div>

            {/* Infos live */}
            <div className="p-6 bg-background/95 backdrop-blur-sm">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {liveStream.title}
              </h2>
              {liveStream.description && (
                <p className="text-sm md:text-base text-muted-foreground mb-3 line-clamp-3">
                  {liveStream.description}
                </p>
              )}
              <p className="text-xs md:text-sm text-muted-foreground">
                📺 Direct {liveStream.stream_type === "radio" ? "Radio" : "TV"} —{" "}
                {new Date(liveStream.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (status === "vod" && heroVideo) {
    return (
      <section className="py-10 lg:py-14">
        <div className="container mx-auto px-4">
          <div className="relative max-w-3xl mx-auto bg-gradient-to-br from-blue-900/20 to-purple-600/20 rounded-2xl overflow-hidden shadow-2xl group">
            {/* Badge dernière vidéo */}
            <div className="absolute top-4 left-4 z-20">
              <div className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs md:text-sm font-bold rounded-full shadow-lg flex items-center gap-2">
                <span>📺</span>
                DERNIÈRE VIDÉO
              </div>
            </div>

            {/* Thumbnail */}
            <div className="aspect-video w-full relative">
              <img
                src={
                  (heroVideo as any).thumbnail_url || "/images/default-thumbnail.jpg"
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

            {/* Infos vidéo */}
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
                <span>👁️ {(heroVideo as any).views || 0} vues</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
};

export default LiveHeroSection;

