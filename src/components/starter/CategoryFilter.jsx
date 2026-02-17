// components/Starter/CategoryFilter.jsx
import React from 'react';
import { useRaceStore } from '../../store/raceStore';

export const CategoryFilter = () => {
  const { riders, categoryFilter, setCategoryFilter } = useRaceStore();

  // 🟢 Dynamically get all unique categories in this race
  const categories = ["ALL", ...new Set(riders.map(r => r.category).filter(Boolean))];

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-2 bg-slate-50 rounded-lg border">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setCategoryFilter(cat)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all border
            ${categoryFilter === cat 
              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
            }`}
        >
          {cat.toUpperCase()}
        </button>
      ))}
    </div>
  );
};