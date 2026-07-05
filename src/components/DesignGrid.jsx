import React from 'react';
import { Eye, Sparkles, Heart } from 'lucide-react';

export default function DesignGrid({ 
  designs, 
  onDesignClick, 
  onFindSimilar, 
  referenceImageId,
  isSimilarityActive,
  favorites = [],
  onToggleFavorite
}) {
  if (designs.length === 0) {
    return (
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[220px] bg-zinc-50/50 dark:bg-zinc-900/10">
        <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          No matching designs found
        </h3>
        <p className="text-[10px] text-zinc-450 mt-1 max-w-xs leading-normal">
          Adjust search keywords or check active dropdown categories in the left panel.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
      {designs.map((design) => {
        const isCurrentReference = referenceImageId === design.id;
        const hasScore = isSimilarityActive && design.similarityScore > 0;
        const isFavorited = favorites.includes(design.id);
        
        // Match score styling
        let badgeStyle = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400';
        if (hasScore) {
          if (design.similarityScore >= 80) {
            badgeStyle = 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 border border-brand-200/25 dark:border-brand-900/25';
          } else if (design.similarityScore >= 50) {
            badgeStyle = 'bg-zinc-50 dark:bg-zinc-900 text-zinc-550 dark:text-zinc-450 border border-zinc-200/20';
          }
        }

        return (
          <div 
            key={design.id}
            className={`flex flex-col justify-between rounded-xl overflow-hidden border transition-all duration-300 bg-white dark:bg-[#1a1f1c] ${
              isCurrentReference 
                ? 'border-gold-500 shadow-sm ring-1 ring-gold-500/50' 
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow'
            }`}
          >
            {/* Image section */}
            <div className="relative aspect-square w-full overflow-hidden bg-zinc-50 dark:bg-zinc-900 group">
              <img 
                src={design.imageUrl} 
                alt={design.title} 
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                loading="lazy"
              />
              
              {/* Overlay controls on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                <button 
                  onClick={() => onDesignClick(design)}
                  className="bg-white text-zinc-900 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md hover:bg-zinc-100 transition-all"
                >
                  <Eye size={12} />
                  Details
                </button>
                                {!isCurrentReference && (
                  <button 
                    onClick={() => onFindSimilar({
                      id: design.id,
                      src: design.imageUrl,
                      title: design.title,
                      isCustom: false
                    })}
                    className="bg-brand-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md hover:bg-brand-700 transition-all"
                  >
                    <Sparkles size={12} />
                    Similar
                  </button>
                )}
              </div>

              {/* Heart/Bookmark button in top right corner */}
              <button
                onClick={() => onToggleFavorite(design.id)}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors z-10"
                title={isFavorited ? "Remove from bookmarks" : "Save to bookmarks"}
              >
                <Heart 
                  size={14} 
                  className={isFavorited ? "fill-red-500 text-red-500" : "text-white"} 
                />
              </button>

              {/* Match Score / Reference Indicator */}
              {isCurrentReference ? (
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[9px] font-bold shadow-sm bg-brand-800 text-white uppercase tracking-wider">
                  Active Reference
                </div>
              ) : hasScore ? (
                <div className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm ${badgeStyle}`}>
                  {design.similarityScore}% Match
                </div>
              ) : null}
            </div>

            {/* Content card body */}
            <div className="p-4 flex-grow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mb-1">
                  <span>{design.style}</span>
                  <span>•</span>
                  <span>{design.placement || "Palm"}</span>
                  <span>•</span>
                  <span>{design.complexity}</span>
                </div>
                <h4 className="font-semibold text-xs text-[#2c3e35] dark:text-zinc-200 line-clamp-1">
                  {design.title}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-450 mt-1 line-clamp-2 leading-relaxed">
                  {design.description}
                </p>
              </div>

              {/* Card Footer tags */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-[9px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-450 px-2 py-0.5 rounded">
                  {design.occasion}
                </span>
                
                <button
                  onClick={() => onDesignClick(design)}
                  className="text-[11px] font-semibold text-brand-800 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
