import React from 'react';
import { RotateCcw, HelpCircle } from 'lucide-react';

export default function FilterPanel({ 
  filters, 
  setFilters, 
  onSurpriseMe, 
  availableStyles, 
  availableComplexities, 
  availableOccasions 
}) {
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      style: 'All',
      complexity: 'All',
      occasion: 'All'
    });
  };

  const isFiltered = filters.style !== 'All' || filters.complexity !== 'All' || filters.occasion !== 'All';

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-slate-800 dark:text-slate-100 mb-0.5">
            Refine Catalog
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Combine rule-based filters with the current AI similarity ranking.
          </p>
        </div>
        
        {/* Helper Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {isFiltered && (
            <button 
              onClick={resetFilters}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800/80 rounded-xl transition-all duration-200 border border-slate-200/50 dark:border-slate-850"
            >
              <RotateCcw size={12} />
              Reset Filters
            </button>
          )}

          <button 
            onClick={onSurpriseMe}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-roseGold-700 to-brand-600 hover:from-roseGold-850 hover:to-brand-705 rounded-xl shadow-sm hover:shadow-md transform active:scale-95 transition-all duration-200"
          >
            <HelpCircle size={14} />
            Surprise Me!
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Style Filter */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Design Style
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['All', ...availableStyles].map(style => {
              const active = filters.style === style;
              return (
                <button
                  key={style}
                  onClick={() => handleFilterChange('style', style)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border
                    ${active 
                      ? 'bg-brand-600 dark:bg-brand-500 text-white border-transparent shadow-sm' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                  {style}
                </button>
              );
            })}
          </div>
        </div>

        {/* Complexity Filter */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Complexity Level
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['All', ...availableComplexities].map(comp => {
              const active = filters.complexity === comp;
              return (
                <button
                  key={comp}
                  onClick={() => handleFilterChange('complexity', comp)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border
                    ${active 
                      ? 'bg-brand-600 dark:bg-brand-500 text-white border-transparent shadow-sm' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                  {comp}
                </button>
              );
            })}
          </div>
        </div>

        {/* Occasion Filter */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Occasion
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['All', ...availableOccasions].map(occ => {
              const active = filters.occasion === occ;
              return (
                <button
                  key={occ}
                  onClick={() => handleFilterChange('occasion', occ)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border
                    ${active 
                      ? 'bg-brand-600 dark:bg-brand-500 text-white border-transparent shadow-sm' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                  {occ}
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
