import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import type { LexiqueTerm } from '../types';
import { LEXIQUE_TERMS } from '../data/terms';

interface TermCardProps {
  term: LexiqueTerm;
  onRelatedTermClick?: (termId: string) => void;
}

export function TermCard({ term, onRelatedTermClick }: TermCardProps) {
  const relatedTermData = term.relatedTerms
    .map(id => LEXIQUE_TERMS.find(t => t.id === id))
    .filter(Boolean) as LexiqueTerm[];

  const categoryColors = {
    interface: 'blue',
    navigation: 'emerald',
    content: 'amber',
    actions: 'rose',
    admin: 'purple',
  };

  const categoryColor = categoryColors[term.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow`}
    >
      {/* Header avec catégorie et icône */}
      <div className={`bg-gradient-to-r from-${categoryColor}-50 to-${categoryColor}-100 dark:from-${categoryColor}-900/20 dark:to-${categoryColor}-800/20 p-4 border-b border-gray-200 dark:border-slate-700`}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-4xl">{term.icon}</span>
          <Badge className={`bg-${categoryColor}-100 text-${categoryColor}-800 dark:bg-${categoryColor}-900 dark:text-${categoryColor}-200`}>
            {term.category}
          </Badge>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {term.term}
        </h3>
        {term.synonyms.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Synonymes:</span> {term.synonyms.join(', ')}
          </p>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4 space-y-4">
        {/* Qu'est-ce que c'est? */}
        <section>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span>❓</span> Qu'est-ce que c'est ?
          </h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {term.definition.what}
          </p>
        </section>

        {/* À quoi ça sert? */}
        {term.definition.purpose.length > 0 && (
          <section>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>⚡</span> À quoi ça sert ?
            </h4>
            <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
              {term.definition.purpose.map((purpose, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-gray-400 flex-shrink-0">•</span>
                  <span>{purpose}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Où le trouver? */}
        <section>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span>📍</span> Où le trouver ?
          </h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {term.definition.location}
          </p>
        </section>

        {/* Comment l'utiliser? */}
        <section>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span>🎯</span> Comment l'utiliser ?
          </h4>
          <div className="space-y-2 text-sm">
            {term.definition.usage.admin && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-3">
                <p className="font-semibold text-purple-900 dark:text-purple-200 mb-1">
                  Pour les administrateurs :
                </p>
                <p className="text-purple-800 dark:text-purple-300">
                  {term.definition.usage.admin}
                </p>
              </div>
            )}
            {term.definition.usage.user && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Pour les visiteurs :
                </p>
                <p className="text-blue-800 dark:text-blue-300">
                  {term.definition.usage.user}
                </p>
              </div>
            )}
            {term.definition.usage.both && (
              <div className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-3">
                <p className="text-gray-700 dark:text-gray-300">
                  {term.definition.usage.both}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Termes connexes */}
        {relatedTermData.length > 0 && (
          <section>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>🔗</span> Voir aussi
            </h4>
            <div className="flex flex-wrap gap-2">
              {relatedTermData.map(relatedTerm => (
                <button
                  key={relatedTerm.id}
                  onClick={() => onRelatedTermClick?.(relatedTerm.id)}
                  className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-300 rounded-full transition-colors border border-gray-300 dark:border-gray-600"
                >
                  {relatedTerm.icon} {relatedTerm.term}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Difficulté/Niveau */}
        {term.difficulty && (
          <section className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600 dark:text-gray-400">Niveau:</span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium capitalize">
                {term.difficulty === 'beginner' && '👶 Débutant'}
                {term.difficulty === 'intermediate' && '📚 Intermédiaire'}
                {term.difficulty === 'advanced' && '🚀 Avancé'}
              </span>
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
}
