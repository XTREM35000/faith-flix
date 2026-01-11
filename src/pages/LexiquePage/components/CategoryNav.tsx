import React from 'react';
import { motion } from 'framer-motion';
import type { LexiqueCategoryMetadata } from '../types';

interface CategoryNavProps {
  categories: LexiqueCategoryMetadata[];
  activeCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export function CategoryNav({ categories, activeCategory, onCategoryChange }: CategoryNavProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-1">
      {/* Bouton "Tous" */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onCategoryChange(null)}
        className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold transition-all ${
          activeCategory === null
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        ✨ Tous
      </motion.button>

      {/* Catégories */}
      {categories.map(category => (
        <motion.button
          key={category.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onCategoryChange(category.id)}
          className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold transition-all flex items-center gap-1 ${
            activeCategory === category.id
              ? `bg-${category.color}-600 text-white shadow-lg`
              : `bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600`
          }`}
        >
          <span>{category.icon}</span>
          <span>{category.name}</span>
        </motion.button>
      ))}
    </div>
  );
}
