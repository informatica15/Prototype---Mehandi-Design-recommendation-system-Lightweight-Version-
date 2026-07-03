import React from 'react';
import { X, Sparkles, Award, Eye, ExternalLink } from 'lucide-react';
import { cosineSimilarity } from '../utils/similarity';

export default function DesignModal({ 
  design, 
  onClose, 
  onFindSimilar, 
  allDesigns, 
  allEmbeddings 
}) {
  if (!design) return null;

  // Calculate similar designs specifically for this item inside the modal!
  let similarDesigns = [];
  const currentEmbedding = allEmbeddings[design.id];
  
  if (currentEmbedding) {
    similarDesigns = allDesigns
      .filter(d => d.id !== design.id) // Exclude current design
      .map(d => {
        const similarity = cosineSimilarity(currentEmbedding, allEmbeddings[d.id] || []);
        return {
          ...d,
          similarityScore: Math.round(similarity * 100)
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 3); // Get top 3
  }

  // Backdrop click handler
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row max-h-[90vh] animate-scale-in">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all duration-200"
          title="Close modal"
        >
          <X size={18} />
        </button>

        {/* Left: Design Image */}
        <div className="md:w-1/2 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-md">
            <img 
              src={design.imageUrl} 
              alt={design.title} 
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Right: Details & Similar Slider */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto min-h-0">
          <div>
            {/* Tag Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-brand-700 dark:text-brand-400 bg-brand-100 dark:bg-brand-950/40 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {design.style} Style
              </span>
              <span className="text-[10px] font-bold text-roseGold-700 dark:text-roseGold-400 bg-rose-100 dark:bg-rose-950/40 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {design.complexity}
              </span>
            </div>

            {/* Title & Desc */}
            <h3 className="font-serif font-bold text-xl md:text-2xl text-slate-800 dark:text-slate-100 mb-3">
              {design.title}
            </h3>
            
            <div className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed mb-6">
              {design.description}
            </div>

            {/* Meta List Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-800/50 mb-6">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Occasion</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{design.occasion}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Storage URL</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 truncate block">{design.imageUrl}</span>
              </div>
            </div>
          </div>

          <div>
            {/* Similar Designs Recommendations */}
            {similarDesigns.length > 0 && (
              <div className="mb-6 border-t border-slate-100 dark:border-slate-800 pt-5">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-brand-500" />
                  AI Suggested Alternatives
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {similarDesigns.map((alt) => (
                    <button
                      key={alt.id}
                      onClick={() => {
                        // Switch modal focus to this design
                        onFindSimilar({
                          id: alt.id,
                          src: alt.imageUrl,
                          title: alt.title,
                          isCustom: false
                        });
                        onClose();
                      }}
                      className="group flex flex-col items-stretch text-left focus:outline-none"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850">
                        <img 
                          src={alt.imageUrl} 
                          alt={alt.title} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[8px] font-extrabold px-1 py-0.5 rounded">
                          {alt.similarityScore}%
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate mt-1 group-hover:text-brand-600">
                        {alt.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Set as Active Query / Find Similar button */}
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
              className="w-full btn-primary"
            >
              <Sparkles size={16} />
              Set as Recommendation Reference
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
