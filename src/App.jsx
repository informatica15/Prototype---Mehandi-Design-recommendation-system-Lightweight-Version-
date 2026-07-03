import React, { useState, useEffect, useMemo, useRef } from 'react';
import DesignGrid from './components/DesignGrid';
import DesignModal from './components/DesignModal';

// Utilities & Data
import designsData from './data/designs.json';
import { getRecommendations } from './utils/recommend';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Search, 
  Upload, 
  X, 
  Menu, 
  RotateCcw, 
  Heart,
  Filter,
  Check,
  ChevronDown
} from 'lucide-react';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sidebar toggle state (for mobile screen size)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Search state
  const [inputValue, setInputValue] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  
  // Selected reference image state (for similarity matching)
  const [referenceImage, setReferenceImage] = useState(null); // { id, src, title, isCustom }
  const fileInputRef = useRef(null);

  // Active filters
  const [filters, setFilters] = useState({
    style: 'All',
    complexity: 'All',
    occasion: 'All'
  });

  // Saved / Bookmarked design IDs (persisted in localStorage)
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('mehndi_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Selected design for the detail popup modal
  const [selectedDesign, setSelectedDesign] = useState(null);

  // Apply dark mode theme class to document root
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Toggle favorite bookmark state
  const handleToggleFavorite = (designId) => {
    setFavorites(prev => {
      let updated;
      if (prev.includes(designId)) {
        updated = prev.filter(id => id !== designId);
      } else {
        updated = [...prev, designId];
      }
      localStorage.setItem('mehndi_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  // Perform search submission
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveQuery(inputValue);
  };

  // Clear all filters, queries, and uploaded references
  const handleClearAll = () => {
    setInputValue('');
    setActiveQuery('');
    setReferenceImage(null);
    setFilters({
      style: 'All',
      complexity: 'All',
      occasion: 'All'
    });
  };

  // Suggestion pill handler
  const handleSuggestionClick = (pillText) => {
    setInputValue(pillText);
    setActiveQuery(pillText);
  };

  // Handle uploading custom photo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Please upload a valid image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage({
          id: 'custom_upload',
          src: event.target.result,
          title: file.name,
          isCustom: true
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file selection input
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Run the matching & recommendation logic
  const recommendations = useMemo(() => {
    return getRecommendations(
      designsData,
      activeQuery,
      referenceImage,
      filters
    );
  }, [activeQuery, referenceImage, filters]);

  // Map favorited IDs back to design objects for sidebar display
  const favoritedDesigns = useMemo(() => {
    return designsData.filter(d => favorites.includes(d.id));
  }, [favorites]);

  const uniqueStyles = ['Arabic', 'Minimal', 'Indian', 'Rajasthani'];
  const uniqueComplexities = ['Simple', 'Medium', 'Detailed'];
  const uniqueOccasions = ['Bridal', 'Festival', 'Everyday'];

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-[#1a1a1a] text-zinc-800 dark:text-zinc-100 font-sans transition-colors duration-300">
      
      {/* 1. Left Control Panel Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-[#252525] border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transform transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* Sidebar Brand Header */}
          <div className="p-5 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-teal-600 dark:bg-teal-500 p-2 rounded-lg text-white">
                <Sparkles size={16} />
              </div>
              <span className="font-semibold text-sm tracking-wide text-zinc-900 dark:text-white">
                Design Studio AI
              </span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
            >
              <X size={16} />
            </button>
          </div>

          {/* Sidebar Scrollable Panel Section */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Filter Panel Block */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={12} />
                Filters & Settings
              </h3>
              
              {/* Style Dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-450 block">Style</label>
                <div className="relative">
                  <select
                    value={filters.style}
                    onChange={(e) => setFilters(prev => ({ ...prev, style: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 px-3 text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="All">All Styles</option>
                    {uniqueStyles.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-2.5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Occasion Dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-450 block">Occasion</label>
                <div className="relative">
                  <select
                    value={filters.occasion}
                    onChange={(e) => setFilters(prev => ({ ...prev, occasion: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 px-3 text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="All">All Occasions</option>
                    {uniqueOccasions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-2.5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Complexity Dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-450 block">Complexity</label>
                <div className="relative">
                  <select
                    value={filters.complexity}
                    onChange={(e) => setFilters(prev => ({ ...prev, complexity: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 px-3 text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="All">All Levels</option>
                    {uniqueComplexities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-2.5 text-zinc-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Reference Image Upload Block */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Upload size={12} />
                Image Reference Match
              </h3>

              {referenceImage ? (
                <div className="border border-teal-200/50 dark:border-teal-900/30 rounded-xl p-3 bg-teal-50/20 dark:bg-teal-950/10 flex items-center gap-3 relative">
                  <img 
                    src={referenceImage.src} 
                    alt="Active reference" 
                    className="h-12 w-12 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase tracking-wider text-teal-600 dark:text-teal-400 font-bold block">
                      {referenceImage.isCustom ? 'Custom Upload' : 'Preset Match'}
                    </span>
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold truncate block">
                      {referenceImage.title || "Custom Photo"}
                    </span>
                  </div>
                  <button
                    onClick={() => setReferenceImage(null)}
                    className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={triggerFileSelect}
                  className="border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-teal-500 hover:dark:border-teal-500 rounded-xl p-4 text-center cursor-pointer transition-colors"
                >
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Upload hand photo or pattern
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                    Finds matching designs automatically
                  </span>
                </div>
              )}
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Bookmarked / Saved Favorites Block */}
            <div className="space-y-3 pt-4 border-t border-zinc-150 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Heart size={12} className="text-zinc-400" />
                Bookmarked Designs ({favorites.length})
              </h3>
              
              {favoritedDesigns.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {favoritedDesigns.map(design => (
                    <button
                      key={design.id}
                      onClick={() => setSelectedDesign(design)}
                      className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:scale-105 transition-transform"
                      title={design.title}
                    >
                      <img 
                        src={design.imageUrl} 
                        alt={design.title} 
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal">
                  No bookmarks saved. Click the heart icon on any design card to keep it here.
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-5 border-t border-zinc-150 dark:border-zinc-800 space-y-2">
          {/* Reset Filters and Queries */}
          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-650 dark:text-zinc-350 transition-colors"
          >
            <RotateCcw size={13} />
            Reset dashboard options
          </button>

          {/* Theme Switcher Button */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-650 dark:text-zinc-350 transition-all duration-150"
          >
            {isDarkMode ? (
              <>
                <Sun size={14} />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={14} />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden transition-opacity"
        />
      )}

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Workspace Top Header Bar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#212121] z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-semibold text-sm tracking-wide text-zinc-900 dark:text-white">
              Mehndi Catalog Recommendations
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded">
              Active Dashboard
            </span>
          </div>
        </header>

        {/* Catalog Main Feed (Scrollable panel) */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-6">
          
          {/* Welcome Dashboard Block */}
          <div className="bg-white dark:bg-[#252525] border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 rounded-2xl shadow-sm">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-800 dark:text-white">
              Intelligent Search & Matching Engine
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl leading-relaxed">
              Retrieve recommendations instantly. Type descriptive keywords or tags, upload image files, or click tags to narrow styles, occasions, or density tags.
            </p>

            {/* Main Workspace Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-xl mt-5">
              <div className="relative flex-grow">
                <Search size={15} className="absolute left-3.5 top-3.5 text-zinc-400" />
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search styles, descriptions, occasion tags..."
                  className="w-full bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent"
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => setInputValue('')}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white font-semibold text-xs py-3 px-5 rounded-xl transition-all shadow-sm"
              >
                Search Catalog
              </button>
            </form>

            {/* Quick Suggestion Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Suggestions:</span>
              <button 
                onClick={() => handleSuggestionClick("Arabic Floral Trail")}
                className="bg-zinc-50 dark:bg-[#1a1a1a] hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-full text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                Arabic Floral Trail
              </button>
              <button 
                onClick={() => handleSuggestionClick("Minimalist Finger Bands")}
                className="bg-zinc-50 dark:bg-[#1a1a1a] hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-full text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                Minimalist Bands
              </button>
              <button 
                onClick={() => handleSuggestionClick("Traditional Rajasthani Bridal")}
                className="bg-zinc-50 dark:bg-[#1a1a1a] hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-full text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                Rajasthani Bridal
              </button>
              <button 
                onClick={() => handleSuggestionClick("Everyday Mandalas")}
                className="bg-zinc-50 dark:bg-[#1a1a1a] hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-full text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                Everyday Mandalas
              </button>
            </div>
          </div>

          {/* Results Grid Container */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
                  {activeQuery.trim() || referenceImage ? "Search Recommendations" : "Design Catalog"}
                </h3>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Displaying {recommendations.length} designs ranked by metadata tags and keyword parameters.
                </p>
              </div>
            </div>

            {/* Matching Grid */}
            <DesignGrid 
              designs={recommendations} 
              onDesignClick={setSelectedDesign}
              onFindSimilar={setReferenceImage}
              referenceImageId={referenceImage?.id}
              isSimilarityActive={!!activeQuery.trim() || !!referenceImage}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>

        </div>

      </main>

      {/* Detail Modal overlay */}
      {selectedDesign && (
        <DesignModal 
          design={selectedDesign} 
          onClose={() => setSelectedDesign(null)}
          onFindSimilar={setReferenceImage}
          allDesigns={designsData}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

    </div>
  );
}
