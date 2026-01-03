import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState } from "react";
// Header/Footer provided by Layout
import HomepageHero from "@/components/HomepageHero";
import SectionTitle from "@/components/SectionTitle";
import VideoCard from "@/components/VideoCard";
import GalleryCard from "@/components/GalleryCard";
import EventCard from "@/components/EventCard";
// AuthModal is now controlled globally in Header
import VideoPlayerModal from "@/components/VideoPlayerModal";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import type { Video } from "@/types/database";

// Pas de données mockées en dur pour la galerie — utiliser le contenu dynamique

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUser();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  // Déterminer le rôle de l'utilisateur
  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin';
  
  // Déterminer le lien des événements selon le rôle
  const eventsLink = isAdmin ? '/admin/events' : '/evenements';
  
  // Get all dynamic content from the hook
  const {
    hero,
    latestPhotos,
    latestVideos,
    upcomingEvents,
    isLoading
  } = useHomepageContent();

  // Auth modal controlled centrally in Header; Index no longer renders AuthModal

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header provided by Layout */}

      {/* AuthModal moved to Header to avoid duplicate modals */}

      <VideoPlayerModal
        video={selectedVideo}
        isOpen={!!selectedVideo}
        onClose={closeVideoModal}
      />

      <main>
        {/* Hero Section - Dynamic from Database */}
        <HomepageHero data={hero} isLoading={isLoading} />

        {/* Photo Gallery Section */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Galerie photos"
              subtitle="Les moments forts de notre communauté"
              viewAllLink="/galerie"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(latestPhotos && latestPhotos.length > 0 ? latestPhotos : []).map((image, i) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GalleryCard image={image} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Videos Section */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Vidéos populaires"
              subtitle="Retrouvez nos dernières célébrations et enseignements"
              viewAllLink="/videos"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading && (!latestVideos || latestVideos.length === 0) ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (latestVideos && latestVideos.length > 0) ? (
                latestVideos.map((video, i) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <VideoCard
                      video={video}
                      onOpen={() => handleVideoSelect(video)}
                      onDeleted={() => { /* Can refetch if needed */ }}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-muted-foreground mb-2 text-lg">Aucune vidéo disponible</div>
                  <p className="text-sm text-muted-foreground">Revenez plus tard pour découvrir nos dernières vidéos</p>
                </div>
              )}
            </div>
          </div>
        </section>

        

        {/* Upcoming Events Section */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <SectionTitle
              title="Prochains événements"
              viewAllLink={eventsLink}
            />
            <div className="grid md:grid-cols-2 gap-6">
              {upcomingEvents && upcomingEvents.length > 0 ? (
                upcomingEvents.map((event: any) => {
                  const startDate = new Date(event.start_date);
                  return (
                    <EventCard
                      key={event.id}
                      id={event.id}
                      title={event.title || ''}
                      description={event.description || ''}
                      date={event.start_date}
                      time={startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      location={event.location || 'À définir'}
                      attendees={0}
                      imageUrl={event.image_url}
                    />
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-muted-foreground mb-2 text-lg">Aucun événement à venir</div>
                  <p className="text-sm text-muted-foreground">Revenez bientôt pour voir nos prochains événements</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Video Modal */}
      <VideoPlayerModal
        video={selectedVideo}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />

      {/* AuthModal moved to Header */}
    </div>
  );
};

export default Index;
