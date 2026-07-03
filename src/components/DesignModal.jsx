import React, { useState } from 'react';
import { X, Sparkles, Heart, Download, Share2, Check } from 'lucide-react';

export default function DesignModal({ 
  design, 
  onClose, 
  onFindSimilar, 
  allDesigns,
  favorites = [],
  onToggleFavorite
}) {
  if (!design) return null;

  const [copyStatus, setCopyStatus] = useState(false);
  const isFavorited = favorites.includes(design.id);

  // Calculate similar designs using tag matching
  let similarDesigns = [];
  if (design && allDesigns) {
    similarDesigns = allDesigns
      .filter(d => d.id !== design.id) // Exclude current design
      .map(d => {
        let tagMatches = 0;
        let totalWeight = 0;

        if (d.style.toLowerCase() === design.style.toLowerCase()) tagMatches += 40;
        totalWeight += 40;

        if (d.occasion.toLowerCase() === design.occasion.toLowerCase()) tagMatches += 30;
        totalWeight += 30;

        if (d.complexity.toLowerCase() === design.complexity.toLowerCase()) tagMatches += 30;
        totalWeight += 30;

        const similarityScore = Math.round((tagMatches / totalWeight) * 100);
        return {
          ...d,
          similarityScore
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 3); // Top 3 matching alternatives
  }

  // Handle link sharing copy
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?design=${design.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  // Close when clicking overlay backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#252525] rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row max-h-[90vh] animate-scale-in">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
          title="Close modal"
        >
          <X size={16} />
        </button>

        {/* Left pane: Product image */}
        <div className="md:w-1/2 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-sm">
            <img 
              src={design.imageUrl} 
              alt={design.title} 
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Right pane: Product details */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto min-h-0">
          <div>
            {/* Tag Badges */}
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              <span className="text-[9px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-200/20 px-2 py-0.5 rounded uppercase tracking-wider">
                {design.style} Style
              </span>
              <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase tracking-wider">
                {design.complexity}
              </span>
              <span className="text-[9px] font-bold text-zinc-650 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700 px-2 py-0.5 rounded uppercase tracking-wider">
                {design.occasion}
              </span>
            </div>

            {/* Title & Description */}
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-2">
              {design.title}
            </h3>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
              {design.description}
            </p>
          </div>

          <div>
            {/* Action buttons (Bookmark / Download / Copy link) */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => onToggleFavorite(design.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                  isFavorited ? 'text-red-500 border-red-200/30' : 'text-zinc-600 dark:text-zinc-350'
                }`}
                title={isFavorited ? "Saved" : "Save design"}
              >
                <Heart size={13} className={isFavorited ? "fill-red-500" : ""} />
                <span>{isFavorited ? 'Bookmarked' : 'Bookmark'}</span>
              </button>

              <a
                href={design.imageUrl}
                download={`${design.title.replace(/\s+/g, '_')}.jpg`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-center"
              >
                <Download size={13} />
                <span>Save JPG</span>
              </a>

              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {copyStatus ? <Check size={13} className="text-teal-600" /> : <Share2 size={13} />}
                <span>{copyStatus ? 'Copied' : 'Share'}</span>
              </button>
            </div>

            {/* AI Suggested Alternatives */}
            {similarDesigns.length > 0 && (
              <div className="mb-6 border-t border-zinc-150 dark:border-zinc-800 pt-4">
                <h4 className="text-[10px] font-bold text-zinc-405 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-teal-500" />
                  Recommended Alternatives
                </h4>
                <div className="grid grid-cols-3 gap-2.5">
                  {similarDesigns.map((alt) => (
                    <button
                      key={alt.id}
                      onClick={() => {
                        onFindSimilar({
                          id: alt.id,
                          src: alt.imageUrl,
                          title: alt.title,
                          isCustom: false
                        });
                        onClose();
                      }}
                      className="group flex flex-col text-left focus:outline-none"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <img 
                          src={alt.imageUrl} 
                          alt={alt.title} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                          {alt.similarityScore}%
                        </div>
                      </div>
                      <span className="text-[9px] font-medium text-zinc-700 dark:text-zinc-300 truncate mt-1 group-hover:text-teal-600">
                        {alt.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Set as Active reference button */}
            <button
              onClick={() => {
                onFindSimilar({
                  id: design.id,
                  src: design.imageUrl,
                  title: design.title,
                  isCustom: false
                });
                onClose();
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:scale-[0.98] transition-all shadow"
            >
              <Sparkles size={13} />
              Set as Image Reference Match
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
