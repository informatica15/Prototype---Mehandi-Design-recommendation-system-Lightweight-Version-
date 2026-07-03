import React from 'react';
import { Eye, Flame, Award, Sliders } from 'lucide-react';

export default function DesignGrid({ 
  designs, 
  onDesignClick, 
  onFindSimilar, 
  referenceImageId,
  isSimilarityActive 
}) {
  if (designs.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] animate-fade-in">
        <div className="text-slate-400 dark:text-slate-600 mb-3 bg-slate-100 dark:bg-slate-900 p-4 rounded-full">
          <Sliders size={32} />
        </div>
        <h3 className="text-lg font-serif font-bold text-slate-700 dark:text-slate-200">
          No matches found
        </h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
          Try loosening your filter constraints or clearing your similarity reference image.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
      {designs.map((design) => {
        const isCurrentReference = referenceImageId === design.id;
        
        // Dynamic badge color depending on match score
        let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
        if (isSimilarityActive) {
          if (design.similarityScore >= 85) {
            badgeColor = 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/50';
          } else if (design.similarityScore >= 70) {
            badgeColor = 'bg-brand-100 dark:bg-brand-950/50 text-brand-700 dark:text-brand-400 border border-brand-200/50';
          } else {
            badgeColor = 'bg-slate-100 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400';
          }
        }

        return (
          <div 
            key={design.id}
            className={`glass-card group flex flex-col justify-between relative
              ${isCurrentReference ? 'ring-2 ring-brand-500 dark:ring-brand-400 scale-[0.98] shadow-inner' : ''}`}
          >
            {/* Image section */}
            <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
              <img 
                src={design.imageUrl} 
                alt={design.title} 
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                loading="lazy"
              />
              
              {/* Image Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                <button 
                  onClick={() => onDesignClick(design)}
                  className="bg-white/90 dark:bg-slate-900/90 hover:bg-white text-slate-800 dark:text-slate-100 p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow backdrop-blur-sm transition-all duration-200 transform translate-y-2 group-hover:translate-y-0"
                >
                  <Eye size={14} />
                  View Details
                </button>
                
                {!isCurrentReference && (
                  <button 
                    onClick={() => onFindSimilar({
                      id: design.id,
                      src: design.imageUrl,
                      title: design.title,
                      isCustom: false
                    })}
                    className="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-xl text-xs font-semibold shadow transition-all duration-200 transform translate-y-2 group-hover:translate-y-0"
                  >
                    Find Similar
                  </button>
                )}
              </div>

              {/* Match Score Badge (AI indicator) */}
              {isSimilarityActive && (
                <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md backdrop-blur-sm ${badgeColor}`}>
                  {isCurrentReference ? (
                    <span className="flex items-center gap-1">
                      <Award size={10} />
                      Reference Query
                    </span>
                  ) : (
                    <span>{design.similarityScore}% Match</span>
                  )}
                </div>
              )}
            </div>

            {/* Content section */}
            <div className="p-4 flex-grow flex flex-col justify-between bg-white/40 dark:bg-slate-900/40 border-t border-slate-100/50 dark:border-slate-800/30">
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {design.style} Style
                  </span>
                  <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                    {design.complexity}
                  </span>
                </div>
                <h4 className="font-serif font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors duration-200 line-clamp-1">
                  {design.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {design.description}
                </p>
              </div>

              {/* Tags and interaction summary */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100/80 dark:border-slate-800/40">
                <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-450 px-2 py-0.5 rounded-md">
                  {design.occasion}
                </span>
                
                <button
                  onClick={() => onDesignClick(design)}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1 transition-colors duration-200"
                >
                  Inspect
                </button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
