import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useAuth } from '@/hooks/useAuth';

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Header darkMode={false} toggleDarkMode={() => {}} />
      <div className="flex flex-1">
        {/* Sidebar fixed à gauche - visible sur desktop uniquement (affiché seulement si connecté) */}
        {user && (
          <div className="hidden lg:block">
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
          </div>
        )}

        {/* Main content with margin pour la sidebar */}
        <main className={`flex-1 overflow-auto transition-all duration-300 ${
          user ? (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''
        }`}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
