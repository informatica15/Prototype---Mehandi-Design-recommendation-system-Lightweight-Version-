import React from 'react';
import { Sparkles, Cpu, Moon, Sun, GitBranch } from 'lucide-react';

export default function Navbar({ modelStatus, isDarkMode, setIsDarkMode }) {
  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-brand-600 to-roseGold-600 p-2.5 rounded-xl shadow-md text-white">
            <Sparkles size={20} className="animate-spin-slow" />
          </div>
          <div>
            <h1 className="font-serif text-xl md:text-2xl font-bold tracking-wide bg-gradient-to-r from-brand-700 to-roseGold-800 bg-clip-text text-transparent dark:from-brand-400 dark:to-roseGold-400">
              Antigravity Mehandi AI
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 tracking-wider uppercase font-semibold">
              Lightweight Recommendation System
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          
          {/* Model Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <Cpu size={14} className={modelStatus === 'ready' ? 'text-emerald-500 animate-pulse' : 'text-amber-500 animate-spin'} />
            <span className="font-medium text-slate-600 dark:text-slate-300">
              AI: {modelStatus === 'loading' ? 'Loading Model...' : modelStatus === 'ready' ? 'Ready (MobileNet)' : 'Offline'}
            </span>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all duration-200"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Github Link */}
          <a
            href="https://github.com/informatica15/Prototype---Mehandi-Design-recommendation-system-Lightweight-Version-"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all duration-200"
            title="GitHub Repository"
          >
            <GitBranch size={18} />
          </a>
        </div>
      </div>
      
      {/* Mobile status banner */}
      <div className="sm:hidden flex items-center justify-center gap-1.5 mt-2 py-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-lg text-[10px] font-semibold text-slate-500">
        <Cpu size={12} className={modelStatus === 'ready' ? 'text-emerald-500 animate-pulse' : 'text-amber-500 animate-spin'} />
        <span>AI MODEL: {modelStatus === 'loading' ? 'LOADING...' : modelStatus === 'ready' ? 'READY' : 'OFFLINE'}</span>
      </div>
    </nav>
  );
}
