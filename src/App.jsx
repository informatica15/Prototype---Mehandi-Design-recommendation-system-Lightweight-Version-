import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import UploadPanel from './components/UploadPanel';
import FilterPanel from './components/FilterPanel';
import DesignGrid from './components/DesignGrid';
import DesignModal from './components/DesignModal';

// Utilities & Data
import designsData from './data/designs.json';
import baselineEmbeddings from './data/embeddings.json';
import { loadModel, getEmbedding } from './utils/model';
import { getRecommendations } from './utils/recommend';
import { Sparkles, Cpu, RefreshCw, Copy, Check, CheckSquare } from 'lucide-react';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // AI model status
  const [modelStatus, setModelStatus] = useState('loading'); // loading, ready, error

  // Selected query reference image for similarity ranking
  const [referenceImage, setReferenceImage] = useState(null); // { id, src, title, isCustom }
  const [referenceEmbedding, setReferenceEmbedding] = useState(null);

  // Active filters
  const [filters, setFilters] = useState({
    style: 'All',
    complexity: 'All',
    occasion: 'All'
  });

  // Modal active item
  const [selectedDesign, setSelectedDesign] = useState(null);

  // Developer precomputation state
  const [isPrecomputing, setIsPrecomputing] = useState(false);
  const [precomputeProgress, setPrecomputeProgress] = useState(0);
  const [generatedEmbeddings, setGeneratedEmbeddings] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Monitor theme updates
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

  // Load TensorFlow.js / MobileNet on launch
  useEffect(() => {
    async function initModel() {
      try {
        await loadModel();
        setModelStatus('ready');
      } catch (err) {
        console.error("Failed to load TensorFlow model:", err);
        setModelStatus('error');
      }
    }
    initModel();
  }, []);

  // Handle extracting embedding when query image changes
  useEffect(() => {
    if (!referenceImage) {
      setReferenceEmbedding(null);
      return;
    }

    // Performance optimization: If preset and embedding is precomputed, use it directly
    if (!referenceImage.isCustom && baselineEmbeddings[referenceImage.id]) {
      setReferenceEmbedding(baselineEmbeddings[referenceImage.id]);
      return;
    }

    // Otherwise (custom upload or missing precomputed vector), compute it at runtime
    async function extractQueryEmbedding() {
      try {
        // Create offscreen image element to feed into TensorFlow.js
        const imgElement = new Image();
        imgElement.src = referenceImage.src;
        
        // Wait for image content to fully load
        await new Promise((resolve, reject) => {
          imgElement.onload = resolve;
          imgElement.onerror = () => reject(new Error("Failed to load reference image for inference."));
        });

        const embedding = await getEmbedding(imgElement);
        setReferenceEmbedding(embedding);
      } catch (err) {
        console.error("Error computing query embedding:", err);
        alert("Failed to process image features. Please check console or try a different image.");
        setReferenceImage(null);
      }
    }

    extractQueryEmbedding();
  }, [referenceImage]);

  // Developer Utility: Process all static designs in-browser to compute the embeddings dataset
  const startDatasetPrecomputation = async () => {
    setIsPrecomputing(true);
    setPrecomputeProgress(0);
    const resultEmbeddings = {};

    try {
      // Ensure model is ready
      await loadModel();

      for (let i = 0; i < designsData.length; i++) {
        const design = designsData[i];
        
        // Create image element and load URL
        const imgElement = new Image();
        imgElement.src = design.imageUrl;
        
        await new Promise((resolve, reject) => {
          imgElement.onload = resolve;
          imgElement.onerror = () => reject(new Error(`Failed to load image: ${design.imageUrl}`));
        });

        // Run inference to get embedding vector
        const vector = await getEmbedding(imgElement);
        resultEmbeddings[design.id] = vector;
        
        setPrecomputeProgress(i + 1);
      }

      setGeneratedEmbeddings(JSON.stringify(resultEmbeddings, null, 2));
    } catch (err) {
      console.error("Precomputation error:", err);
      alert("Failed to precompute embeddings: " + err.message);
    } finally {
      setIsPrecomputing(false);
    }
  };

  const handleCopyEmbeddings = () => {
    navigator.clipboard.writeText(generatedEmbeddings);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Check if embeddings are empty to show precomputation dashboard
  const isEmbeddingsDatabaseEmpty = useMemo(() => {
    return Object.keys(baselineEmbeddings).length === 0;
  }, []);

  // Compute recommendation results
  const recommendations = useMemo(() => {
    return getRecommendations(
      designsData, 
      baselineEmbeddings, 
      referenceEmbedding, 
      filters
    );
  }, [referenceEmbedding, filters]);

  // Fetch unique categories for filter panel layout
  const availableStyles = useMemo(() => {
    return [...new Set(designsData.map(d => d.style))];
  }, []);

  const availableComplexities = useMemo(() => {
    return [...new Set(designsData.map(d => d.complexity))];
  }, []);

  const availableOccasions = useMemo(() => {
    return [...new Set(designsData.map(d => d.occasion))];
  }, []);

  // "Surprise Me" randomized selection
  const handleSurpriseMe = () => {
    if (designsData.length === 0) return;
    const randomIndex = Math.floor(Math.random() * designsData.length);
    const chosen = designsData[randomIndex];
    
    // Set this random design as the active query reference
    setReferenceImage({
      id: chosen.id,
      src: chosen.imageUrl,
      title: chosen.title,
      isCustom: false
    });
    
    // Smooth scroll down to grid to view results
    document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        {/* Navigation */}
        <Navbar 
          modelStatus={modelStatus} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode} 
        />

        <main className="max-w-7xl mx-auto px-4 py-8 md:px-8 flex flex-col gap-8">
          
          {/* Developer Tooling: Displayed only if embeddings.json is unpopulated */}
          {isEmbeddingsDatabaseEmpty && (
            <div className="bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 rounded-3xl p-6 md:p-8 animate-fade-in">
              <h2 className="text-xl font-bold font-serif text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
                <Cpu className="animate-pulse" />
                Developer Utility: Precompute Embeddings Database
              </h2>
              <p className="text-sm text-amber-700 dark:text-slate-350 mb-6 max-w-3xl leading-relaxed">
                The embeddings file `embeddings.json` is currently empty. Run the extraction utility below to compute MobileNet feature embeddings for all 30 designs. Copy the generated JSON and write it back to `src/data/embeddings.json` to enable instantaneous static recommendations.
              </p>

              {!generatedEmbeddings ? (
                <button
                  disabled={isPrecomputing}
                  onClick={startDatasetPrecomputation}
                  className="btn-primary"
                >
                  {isPrecomputing ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Processing Designs ({precomputeProgress} / {designsData.length})
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Extract & Precompute embeddings
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4 animate-scale-in">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckSquare size={14} />
                      Precomputation Complete!
                    </span>
                    <button
                      onClick={handleCopyEmbeddings}
                      className="btn-secondary py-2 px-4 text-xs font-bold"
                    >
                      {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={generatedEmbeddings}
                    id="developer-embeddings-output"
                    className="w-full h-64 p-4 font-mono text-xs bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Model Loading Screen */}
          {modelStatus === 'loading' && !isEmbeddingsDatabaseEmpty && (
            <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px] animate-pulse">
              <Cpu size={48} className="text-brand-500 animate-spin mb-4" />
              <h2 className="text-xl font-bold font-serif text-slate-800 dark:text-slate-100">
                Initializing Intelligent Recommendation Engine...
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-md">
                Loading pre-trained MobileNet neural network for local client-side processing (~5MB). This takes just a moment.
              </p>
            </div>
          )}

          {/* Core App View */}
          {modelStatus !== 'loading' && (
            <>
              {/* Reference Selector & Upload Box */}
              <UploadPanel 
                referenceImage={referenceImage} 
                setReferenceImage={setReferenceImage}
                presetImages={designsData}
                onReferenceSelected={setReferenceImage}
                modelStatus={modelStatus}
              />

              {/* Advanced Rule Filters */}
              <FilterPanel 
                filters={filters} 
                setFilters={setFilters} 
                onSurpriseMe={handleSurpriseMe}
                availableStyles={availableStyles}
                availableComplexities={availableComplexities}
                availableOccasions={availableOccasions}
              />

              {/* Gallery Grid */}
              <div id="catalog-grid" className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-slate-850 dark:text-slate-100">
                      {referenceEmbedding ? 'AI Recommended Designs' : 'Mehandi Design Catalog'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {referenceEmbedding 
                        ? `Displaying ${recommendations.length} designs ranked by visual similarity to reference.`
                        : `Displaying ${recommendations.length} designs filtered from static repository.`}
                    </p>
                  </div>
                </div>

                <DesignGrid 
                  designs={recommendations} 
                  onDesignClick={setSelectedDesign}
                  onFindSimilar={setReferenceImage}
                  referenceImageId={referenceImage?.id}
                  isSimilarityActive={!!referenceEmbedding}
                />
              </div>
            </>
          )}

        </main>
      </div>

      {/* Expanded Modal view */}
      {selectedDesign && (
        <DesignModal 
          design={selectedDesign} 
          onClose={() => setSelectedDesign(null)}
          onFindSimilar={setReferenceImage}
          allDesigns={designsData}
          allEmbeddings={baselineEmbeddings}
        />
      )}

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-white/5 py-6 px-4 text-center mt-12">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Antigravity Mehandi AI — Premium Client-side Machine Learning Showcase
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-600 mt-1">
          Powered by TensorFlow.js & MobileNet. Model weights served via Google CDN.
        </p>
      </footer>
    </div>
  );
}
