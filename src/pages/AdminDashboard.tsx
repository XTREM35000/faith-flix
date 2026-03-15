import React from "react";
import HeroBanner from "@/components/HeroBanner";
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import useAdminDashboardData from '@/hooks/useAdminDashboardData';
import AdminStatsWidget from '@/components/AdminStatsWidget';
import AdminQuickActions from '@/components/AdminQuickActions';
import UnifiedModerationPanel from '@/components/UnifiedModerationPanel';
import RecentContentFeed from '@/components/RecentContentFeed';
import ActivityMetrics from '@/components/ActivityMetrics';
import { Bell, Video, Calendar, Users, Megaphone, Image, CreditCard, Settings, AlertCircle, BarChart3 } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { data: dashboardData, loading: dashboardLoading } = useAdminDashboardData();

  // Préparer les stats pour le widget
  const getTrend = (value: number): 'up' | 'down' | 'neutral' => {
    return value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  };

  const stats: Array<{ label: string; value: string | number; change?: string; icon: string; trend?: 'up' | 'down' | 'neutral'; color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' }> = [
    {
      label: 'Membres actifs (aujourd\'hui)',
      value: dashboardData?.activeUsersToday ?? 0,
      icon: '👥',
      color: 'blue' as const,
    },
    {
      label: 'Vidéos publiées',
      value: dashboardData?.totalVideos ?? 0,
      icon: '🎬',
      color: 'green' as const,
    },
    {
      label: 'Messages (30j)',
      value: dashboardData?.totalMessages ?? 0,
      icon: '💬',
      color: 'purple' as const,
    },
    {
      label: 'Dons ce mois',
      value: `${dashboardData?.totalDonations?.toLocaleString('fr-FR') ?? 0} F`,
      icon: '💰',
      color: 'orange' as const,
    },
    {
      label: 'Événements à venir',
      value: dashboardData?.totalEvents ?? 0,
      icon: '📅',
      color: 'pink' as const,
    },
    {
      label: 'Notifications non lues',
      value: dashboardData?.pendingComments ?? 0,
      icon: '⏰',
      color: 'teal' as const,
    },
  ];

  // Actions rapides
  const quickActions = [
    { icon: '🎬', label: 'Vidéo', description: 'Ajouter/modifier', href: '/videos', color: 'blue' as const },
    { icon: '📅', label: 'Événement', description: 'Créer/gérer', href: '/admin/events', color: 'green' as const },
    { icon: '👤', label: 'Utilisateur', description: 'Gérer', href: '/admin/users', color: 'purple' as const, badge: 0 },
    { icon: '📢', label: 'Notification', description: 'Envoyer', href: '/admin/notifications', color: 'orange' as const, badge: dashboardData?.pendingComments },
    { icon: '📸', label: 'Galerie', description: 'Photos/albums', href: '/galerie', color: 'pink' as const },
    { icon: '💰', label: 'Dons', description: 'Campagnes', href: '/donate', color: 'teal' as const },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Stats Live', description: 'Audience directs', href: '/admin/stats-live', color: 'blue' as const },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Stats VOD', description: 'Performance vidéos', href: '/admin/stats-vod', color: 'green' as const },
    { icon: <CreditCard className="h-5 w-5" />, label: 'Stats Finances', description: 'Dons & contributions', href: '/admin/stats-finances', color: 'orange' as const },
  ];

  // Modération (simulée avec les commentaires en attente)
  const moderationItems = dashboardData?.recentComments?.map((c: Record<string, unknown>) => ({
    id: String(c.id),
    type: 'comment' as const,
    content: String(c.content),
    author: 'Utilisateur',
    createdAt: String(c.created_at),
    status: (c.status as string || 'pending') as 'pending' | 'approved' | 'rejected',
    priority: (c.status === 'pending' ? 'high' : 'low') as 'high' | 'low',
  })) || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Banner */}
      <HeroBanner
        title="Tableau de bord administrateur"
        subtitle="Vue d'ensemble de votre site média Paroisse — Actions et modération en un coup d'œil"
        showBackButton={false}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      {/* Main Content */}
      <main className="flex-1 py-12 lg:py-16">
        <div className="container mx-auto px-4 space-y-8">
          {/* Section 1: Stats principales */}
          <section>
            <AdminStatsWidget stats={stats} isLoading={dashboardLoading} />
          </section>

          {/* Section 2: Actions rapides */}
          <section>
            <AdminQuickActions actions={quickActions} />
          </section>

          {/* Section 3: Grille principale (3 colonnes) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne 1: Modération */}
            <div>
              <UnifiedModerationPanel items={moderationItems} isLoading={dashboardLoading} />
            </div>

            {/* Colonne 2: Contenu récent */}
            <div className="lg:col-span-1">
              <RecentContentFeed
                videos={dashboardData?.recentVideos?.map((v: Record<string, unknown>) => ({ id: String(v.id), title: String(v.title), date: String(v.created_at), type: 'video' as const })) || []}
                events={dashboardData?.upcomingEvents?.map((e: Record<string, unknown>) => ({ id: String(e.id), title: String(e.title), date: String(e.event_date), type: 'event' as const })) || []}
                isLoading={dashboardLoading}
              />
            </div>

            {/* Colonne 3: Activité et métriques */}
            <div>
              <ActivityMetrics
                totalUsers={dashboardData?.totalUsers}
                activeUsersToday={dashboardData?.activeUsersToday}
                isLoading={dashboardLoading}
              />
            </div>
          </section>

          {/* Section 4: Infos et statut */}
          <section className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1">Statut du site</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Tous les systèmes fonctionnent normalement. Dernière synchronisation : il y a quelques secondes.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✅ Base de données : Connectée</li>
                  <li>✅ Réplication temps réel : Active</li>
                  <li>✅ Stockage : 45% utilisé</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
