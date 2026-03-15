import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, LogOut, HelpCircle, Menu, X, Home, Info, Users, MessageCircle, Bell, BookOpen, FileText, MoreVertical } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import AuthModal from "./AuthModal";
import ForgotPasswordModal from "./ForgotPasswordModal";
import MobileSidebar from "./MobileSidebar";
import { MENU_GROUPS } from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import HeaderSkeleton from "./HeaderSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/contexts/useAuthContext";
import { useUser } from "@/hooks/useUser";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import useRoleCheck from '@/hooks/useRoleCheck';
import useUnreadNotifications from '@/hooks/useUnreadNotifications';
import useUnreadMessages from '@/hooks/useUnreadMessages';
import { supabase } from '@/integrations/supabase/client';
import useLiveStatus from "@/hooks/useLiveStatus";
import LiveStatusBadge from "@/components/LiveStatusBadge";

interface HeaderProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

const useHeaderSpace = () => {
  const [availableSpace, setAvailableSpace] = useState<"full" | "medium" | "compact">("full");

  useEffect(() => {
    const checkSpace = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      if (width < 400) setAvailableSpace("compact");
      else if (width < 600) setAvailableSpace("medium");
      else setAvailableSpace("full");
    };

    checkSpace();
    window.addEventListener("resize", checkSpace);
    return () => window.removeEventListener("resize", checkSpace);
  }, []);

  return availableSpace;
};

const Header = ({ darkMode = false, toggleDarkMode = () => {}, onOpenAuthModal }: HeaderProps) => {
  // All hooks FIRST, in strict order
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const headerSpace = useHeaderSpace();
  const isCompactHeader = headerSpace === "compact";
  const isFullHeader = headerSpace === "full";
  
  const location = useLocation();
  const authMode = new URLSearchParams(location.search).get("mode") === "register" ? "register" : "login";
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const { profile } = useUser();
  const { isAdmin } = useRoleCheck();
  const { data: headerConfig, isLoading: headerLoading } = useHeaderConfig();
  const { unreadCount: unreadNotificationsCount, markAllAsRead: markAllAsReadNotifications } = useUnreadNotifications();
  const { unreadCount: unreadMessagesCount, markAllAsRead } = useUnreadMessages();
  const { isLiveActive } = useLiveStatus();
  const isConnected = !!user;

  // Favicon effect
  useEffect(() => {
    if (!headerConfig?.logo_url) return;
    try {
      const url = headerConfig.logo_url;
      const cacheBusted = url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = cacheBusted;
      let apple: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
      if (!apple) {
        apple = document.createElement('link');
        apple.rel = 'apple-touch-icon';
        document.head.appendChild(apple);
      }
      apple.href = cacheBusted;
    } catch (e) {
      // noop
    }
  }, [headerConfig?.logo_url]);

  // Close mobile menu when auth state changes
  useEffect(() => {
    if (!user) {
      setIsMobileMenuOpen(false);
    }
  }, [user]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle auth modal (tolerant to additional params after #auth)
  useEffect(() => {
    setIsAuthModalOpen(location.hash.includes('#auth'));
  }, [location.hash]);

  // User menu outside click / Escape handler
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!isUserMenuOpen) return;
      const target = e.target as Node | null;
      if (userMenuRef.current && target && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isUserMenuOpen]);

  // Also listen to raw hashchange events to ensure clicks that only update window.location.hash
  // are handled immediately (some environments do not always propagate through react-router's location)
  useEffect(() => {
    const onHash = () => setIsAuthModalOpen(window.location.hash.includes('#auth'));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);


  // Loading skeleton
  if (headerLoading) {
    return <HeaderSkeleton />;
  }


  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Title + Navigation Menu */}
          <div className="flex items-center gap-6">
            <Link to={isAdmin ? "/admin" : "/"} className="flex items-center gap-2 flex-shrink-0 group">
              {/* Logo dynamique avec animation 3D + étoiles dorées */}
              <div className="relative animate-star-rotate-3d" style={{ perspective: '1000px' }}>
                {headerConfig?.logo_url ? (
                    <>
                      <img
                        src={headerConfig.logo_url}
                        alt={headerConfig.logo_alt_text ?? 'Logo'}
                        className={
                          (headerConfig.logo_size ?? 'sm') === 'sm'
                            ? 'h-10 md:h-12 w-auto object-contain animate-sparkle'
                            : (headerConfig.logo_size ?? 'sm') === 'md'
                            ? 'h-12 md:h-14 w-auto object-contain animate-sparkle'
                            : 'h-16 md:h-20 w-auto object-contain animate-sparkle'
                        }
                      />
                      {/* Étoiles décoratives animées autour du logo (plus visibles) */}
                      <div className="absolute -top-2 -right-2 text-sm md:text-base animate-pulse-slow opacity-90">⭐</div>
                      <div className="absolute -bottom-2 -left-2 text-sm md:text-base animate-pulse-slow opacity-80" style={{ animationDelay: '0.9s' }}>✨</div>
                    </>
                  ) : (
                    <div className="animate-sparkle">
                      <AnimatedLogo size={(headerConfig?.logo_size ?? 'sm') as any} />
                    </div>
                  )}
              </div>
              
              {/* Titres dynamiques - avec badge d'état de connexion */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={`relative ${isCompactHeader ? "sr-only" : "hidden sm:block"}`}
              >
                {headerConfig?.main_title && (
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm lg:text-base font-semibold text-foreground leading-tight animate-glow-text">
                      {headerConfig.main_title}
                    </h1>
                  </div>
                )}
                {headerConfig?.subtitle && (
                  <p className="text-xs text-muted-foreground -mt-0.5 animate-float-soft">
                    {headerConfig.subtitle}
                  </p>
                )}
              </motion.div>
            </Link>

            {/* Navigation Menu - Desktop */}
            <nav className="hidden md:flex items-center gap-2">
              {(headerConfig?.navigation_items || []).map((item, index) => (
                <Link 
                  key={index}
                  to={item.href}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title={item.label}
                >
                  {item.icon === 'home' && <Home className="h-4 w-4" />}
                  {item.icon === 'info' && <Info className="h-4 w-4" />}
                  {item.icon === 'play-circle' && <User className="h-4 w-4" />}
                  {item.icon === 'calendar' && <User className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              ))}
              {/* Lexique Link - Accessible à tous */}
              <Link 
                to="/lexique"
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Lexique du site"
              >
                <BookOpen className="h-4 w-4" />
                <span>Lexique</span>
              </Link>
              {/* Prospect Link - Accessible à tous */}
              <Link 
                to="/prospect"
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Prospect"
              >
                <FileText className="h-4 w-4" />
                <span>Prospect</span>
              </Link>
            </nav>
          </div>

          {/* Zone centrale : badge connexion + badge live (masquée en mode compact) */}
          <div className="flex-1 flex items-center justify-center">
            {!isCompactHeader && (
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white animate-badge-color-shift shadow-md">
                    Actif
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-slate-500 to-slate-700 text-slate-100 shadow-md">
                    Inactif
                  </span>
                )}
                <LiveStatusBadge isLive={isLiveActive} />
              </div>
            )}
          </div>

          {/* Zone droite : actions avec priorité + menu de débordement */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 160, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="overflow-hidden mr-2"
                >
                  <Input
                    type="search"
                    placeholder="Rechercher..."
                    className="h-9 bg-muted/50 text-sm"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
            {isFullHeader && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-muted-foreground hover:text-foreground"
                title="Rechercher"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Lexique quick link (icon only, accessible to all) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                try {
                  navigate('/lexique?mobile=1');
                } catch (e) {
                  // fallback: set location
                  window.location.href = '/lexique?mobile=1';
                }
              }}
              className="text-muted-foreground hover:text-foreground"
              title="Lexique"
            >
              <BookOpen className="h-5 w-5" />
            </Button>

            {/* Chat icon with badge - Only if logged in */}
            {user && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await markAllAsRead();
                    navigate('/live');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  title="Chat en direct"
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-gradient-to-r from-rose-500 to-rose-600 rounded-full animate-badge-pulse shadow-lg">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </div>
            )}

            {/* Notifications icon with badge - Only if logged in */}
            {user && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await markAllAsReadNotifications();
                    navigate('/notifications');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </Button>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-full animate-badge-pulse shadow-lg">
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </span>
                )}
              </div>
            )}

            {/* Help */}
            {isFullHeader && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/help")}
                className="text-muted-foreground hover:text-foreground"
                title="Aide"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            )}

            {/* Dark Mode Toggle */}
              <ThemeToggle />

            {/* User Menu / Auth Button */}
            <div className="relative" ref={userMenuRef}>
              {user ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  className="text-muted-foreground hover:text-foreground overflow-hidden rounded-full"
                  title={user.email || "Mon compte"}
                >
                  {(() => {
                    let avatarSrc: string | null = null;
                    if (user && profile?.avatar_url) {
                      const val = String(profile.avatar_url);
                      if (val.startsWith('http') || val.startsWith('data:')) {
                        avatarSrc = val;
                      } else {
                        const bucket = import.meta.env.VITE_BUCKET_AVATAR || 'avatars';
                        try {
                          const { data } = supabase.storage.from(bucket).getPublicUrl(val);
                          avatarSrc = data?.publicUrl || null;
                        } catch (e) {
                          avatarSrc = null;
                        }
                      }
                    }
                    return avatarSrc ? (
                      <img src={avatarSrc} alt={profile?.full_name || user.email} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <User className="h-5 w-5" />
                    );
                  })()}
                </Button>
              ) : (
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                    color: ['#3b82f6', '#8b5cf6', '#ec4899', '#3b82f6'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    filter: "drop-shadow(0 0 10px currentColor)",
                  }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      window.location.hash = '#auth';
                    }}
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                    title="Se connecter"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}

              {/* Dropdown menu seulement si connecté */}
              <AnimatePresence>
                {isUserMenuOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg p-2 z-50"
                  >
                    <div className="px-3 py-2 border-b border-border/50">
                      <p className="text-xs font-medium text-foreground truncate">
                        {profile?.full_name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Connecté
                      </p>
                    </div>

                    {isAdmin && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-xs mt-1"
                        onClick={() => {
                          navigate('/membres');
                          setIsUserMenuOpen(false);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Membre
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-xs mt-1"
                      onClick={() => {
                        navigate('/profile');
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Mon profil
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={async () => {
                        await signOut();
                        setIsUserMenuOpen(false);
                        setIsMobileMenuOpen(false);
                        navigate('/');
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Déconnexion
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle - pour ouvrir la sidebar (masqué si non connecté) */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-muted-foreground"
                onClick={() => {
                  console.log('Mobile menu toggle - current state:', isMobileMenuOpen);
                  setIsMobileMenuOpen(prev => !prev);
                }}
                title="Menu mobile"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}

            {/* Menu de débordement pour les écrans avec peu d'espace */}
            {!isFullHeader && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    title="Plus d'actions"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isFullHeader && (
                    <DropdownMenuItem
                      onClick={() => {
                        setIsSearchOpen(true);
                      }}
                    >
                      <Search className="mr-2 h-4 w-4" /> Recherche
                    </DropdownMenuItem>
                  )}
                  {!isFullHeader && (
                    <DropdownMenuItem
                      onClick={() => navigate("/help")}
                    >
                      <HelpCircle className="mr-2 h-4 w-4" /> Aide
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            </div>
          </div>

        {/* Mobile Sidebar */}
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          // @ts-expect-error - MENU_GROUPS icons are valid React.ReactNode
          navigationGroups={MENU_GROUPS}
          user={user}
        />
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => {
          setIsAuthModalOpen(false);
          // Si l'URL a '#auth', on l'enlève et on force le retour à la page d'accueil
          if (typeof window !== 'undefined' && window.location.hash.includes('#auth')) {
            try {
              navigate('/', { replace: true });
            } catch (e) {
              try { window.history.replaceState(null, '', '/'); } catch { /* ignore */ }
            }
          } else {
            // Même sans hash, on force le retour à la home après fermeture manuelle du modal
            try {
              navigate('/', { replace: true });
            } catch (e) {
              try { window.history.replaceState(null, '', '/'); } catch { /* ignore */ }
            }
          }
        }}
        defaultMode={authMode}
        onForgotPassword={() => {
          setIsAuthModalOpen(false);
          setIsForgotPasswordOpen(true);
        }}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onBackToLogin={() => {
          setIsForgotPasswordOpen(false);
          setIsAuthModalOpen(true);
        }}
      />
    </header>
  );
};

export default Header;
