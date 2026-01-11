import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import HeroBanner from '@/components/HeroBanner';
import { TermCard } from './components/TermCard';
import { LexiqueSearch } from './components/LexiqueSearch';
import { CategoryNav } from './components/CategoryNav';
import { useLexiqueSearch } from './hooks/useLexiqueSearch';
import { LEXIQUE_TERMS, LEXIQUE_CATEGORIES } from './data/terms';
import { supabase } from '@/integrations/supabase/client';

export default function LexiquePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const termRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const filteredTerms = useLexiqueSearch(LEXIQUE_TERMS, searchQuery, activeCategory);

  // Handler pour sauvegarder l'image de fond du hero banner
  const handleHeroImageSave = async (url: string) => {
    try {
      await supabase
        .from('page_hero_banners')
        .upsert({ path: '/lexique', image_url: url }, { onConflict: 'path' });
    } catch (e) {
      console.error('Erreur de sauvegarde du hero banner:', e);
    }
  };

  // Scroll vers un terme
  useEffect(() => {
    if (selectedTermId && termRefs.current[selectedTermId]) {
      const element = termRefs.current[selectedTermId];
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Highlight temporaire
      element.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-blue-500');
      }, 2000);
      setSelectedTermId(null);
    }
  }, [selectedTermId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* HERO BANNER - reuse shared component to match /a-propos */}
      <HeroBanner
        title="Lexique du Site Paroissial"
        subtitle="Découvrez le nom, la fonction et l'utilisation de chaque élément de notre plateforme"
        backgroundImage={undefined}
        showBackButton={true}
        bucket="directory-images"
        onBgSave={handleHeroImageSave}
      />

      {/* Search under hero */}
      <div className="-mt-10 mb-8">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
            <LexiqueSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher un terme... (ex: Hero Banner, Carte, Modal)"
            />
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <main className="container mx-auto max-w-7xl px-4 py-16">
        {/* Navigation par catégories */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Filtrer par catégorie
            </h2>
            <CategoryNav
              categories={LEXIQUE_CATEGORIES}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </motion.div>
        </div>

        {/* Résultats */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {searchQuery || activeCategory
                  ? `${filteredTerms.length} terme${filteredTerms.length !== 1 ? 's' : ''} trouvé${filteredTerms.length !== 1 ? 's' : ''}`
                  : `${LEXIQUE_TERMS.length} termes du lexique`}
              </h2>
              {(searchQuery || activeCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory(null);
                  }}
                  className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>

            {/* Grille de termes */}
            {filteredTerms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTerms.map((term, index) => (
                  <div
                    key={term.id}
                    ref={(el) => {
                      if (el) termRefs.current[term.id] = el;
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <TermCard
                        term={term}
                        onRelatedTermClick={(relatedId) => {
                          setSelectedTermId(relatedId);
                        }}
                      />
                    </motion.div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                  😔 Aucun terme ne correspond à votre recherche
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                  Essayez avec d'autres mots-clés ou réinitialisez les filtres
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Info supplémentaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            💡 Comment utiliser ce lexique ?
          </h3>
          <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Ce guide est destiné à aider les nouveaux administrateurs, bénévoles et visiteurs à comprendre 
            l'interface du Site Paroissial. Chaque terme inclut une définition, son utilité et des instructions 
            spécifiques pour les administrateurs et les visiteurs.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            💬 Vous avez une question ? Cliquez sur les termes connexes (section "Voir aussi") pour explorer les concepts liés !
          </p>
        </motion.div>
      </main>
    </div>
  );
}
