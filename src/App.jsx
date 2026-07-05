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
  ChevronDown,
  RefreshCw,
  Plus,
  Paperclip,
  Send,
  Trash2,
  Camera
} from 'lucide-react';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sidebar toggle state (mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Chat sessions state (persisted in localStorage)
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('mehndi_chat_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  // Active chat session ID (null represents splash new search)
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const saved = localStorage.getItem('mehndi_active_session_id');
    return saved || null;
  });

  // Saved bookmark design IDs
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('mehndi_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Prompt inputs
  const [inputValue, setInputValue] = useState('');
  const [stagedImage, setStagedImage] = useState(null); // { src, title }
  const fileInputRef = useRef(null);

  // Live Camera states & references
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  // Google Lens–style lens box state (percentages 0–1)
  const [lensBox, setLensBox] = useState({ x: 0.18, y: 0.22, w: 0.64, h: 0.56 });
  const [isStabilized, setIsStabilized] = useState(false);
  const [autoCapturing, setAutoCapturing] = useState(false);
  const [isShrinking, setIsShrinking] = useState(false);
  const [handDetected, setHandDetected] = useState(false);   // true only when hand pixels exceed threshold
  const [noHandWarning, setNoHandWarning] = useState(false); // flashes warning on manual snap without hand
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const trackingCanvasRef = useRef(null);
  const trackingIntervalRef = useRef(null);
  const stabilizationTimerRef = useRef(null);
  const dragStateRef = useRef(null); // { handle, startX, startY, startBox }

  // Filter dropdown toggle states
  const [activeFilterDropdown, setActiveFilterDropdown] = useState(null); // 'style' | 'complexity' | 'occasion' | 'placement' | null

  // Active filters for the *next* query
  const [filters, setFilters] = useState({
    style: 'All',
    complexity: 'All',
    occasion: 'All',
    placement: 'All'
  });

  // Selected design for detail modal
  const [selectedDesign, setSelectedDesign] = useState(null);

  // Persist sessions & active session ID
  useEffect(() => {
    localStorage.setItem('mehndi_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('mehndi_active_session_id', activeSessionId);
    } else {
      localStorage.removeItem('mehndi_active_session_id');
    }
  }, [activeSessionId]);

  // Persist dark mode theme classes
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

  // Handle bookmark favorite click
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

  // Start new empty search session
  const handleNewSession = () => {
    setActiveSessionId(null);
    setInputValue('');
    setStagedImage(null);
    setFilters({
      style: 'All',
      complexity: 'All',
      occasion: 'All',
      placement: 'All'
    });
    setIsSidebarOpen(false);
  };

  // Delete specific session from history
  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  };

  // Stage selected image file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Please select a valid image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setStagedImage({
          id: 'custom_upload_' + Date.now(),
          src: event.target.result,
          title: file.name,
          isCustom: true
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Open camera stream in workspace background
  const handleStartCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Could not access camera. Please verify permission settings.");
      setIsCameraOpen(false);
    }
  };

  // Close camera stream background
  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  // Toggle camera background feed
  const handleToggleCamera = async () => {
    if (isCameraOpen) {
      handleCloseCamera();
    } else {
      await handleStartCamera();
    }
  };

  // ── Google Lens: skin-tone detection + stabilization + auto-capture ──
  useEffect(() => {
    if (!isCameraOpen) {
      clearInterval(trackingIntervalRef.current);
      clearTimeout(stabilizationTimerRef.current);
      trackingIntervalRef.current = null;
      stabilizationTimerRef.current = null;
      setIsStabilized(false);
      setAutoCapturing(false);
      setLensBox({ x: 0.18, y: 0.22, w: 0.64, h: 0.56 });
      return;
    }

    if (!trackingCanvasRef.current) {
      trackingCanvasRef.current = document.createElement('canvas');
    }
    const tc = trackingCanvasRef.current;
    tc.width = 40; tc.height = 30;
    const tctx = tc.getContext('2d', { willReadFrequently: true });

    let stableFrames = 0;
    let prevCx = 0.5, prevCy = 0.5;

    trackingIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      tctx.drawImage(video, 0, 0, 40, 30);
      const { data } = tctx.getImageData(0, 0, 40, 30);

      let sumX = 0, sumY = 0, count = 0;
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > 80 && g > 40 && b > 20 && r > g && r > b && (r - g) > 10) {
          const px = ((i / 4) % 40) / 40;
          const py = Math.floor((i / 4) / 40) / 30;
          sumX += px; sumY += py; count++;
          if (px < minX) minX = px; if (px > maxX) maxX = px;
          if (py < minY) minY = py; if (py > maxY) maxY = py;
        }
      }

      // Require a meaningful cluster of skin pixels to qualify as a hand
      const handPresent = count > 40;
      setHandDetected(handPresent);

      if (handPresent) {
        const cx = sumX / count;
        const cy = sumY / count;
        const spread = Math.max(maxX - minX, 0.12);
        const spreadY = Math.max(maxY - minY, 0.10);
        // Smoothly move and resize the lens box toward the hand
        setLensBox(prev => {
          const newW = Math.min(0.72, Math.max(0.24, spread * 2.2));
          const newH = Math.min(0.65, Math.max(0.20, spreadY * 2.2));
          return {
            x: prev.x + (cx - newW / 2 - prev.x) * 0.12,
            y: prev.y + (cy - newH / 2 - prev.y) * 0.12,
            w: prev.w + (newW - prev.w) * 0.12,
            h: prev.h + (newH - prev.h) * 0.12,
          };
        });

        // Stabilization: if centroid hasn't moved much for 10 frames → stabilized
        const moved = Math.hypot(cx - prevCx, cy - prevCy);
        if (moved < 0.04) {
          stableFrames++;
          if (stableFrames >= 10 && !isStabilized) {
            setIsStabilized(true);
          }
        } else {
          stableFrames = 0;
          setIsStabilized(false);
        }
        prevCx = cx; prevCy = cy;
      } else {
        stableFrames = 0;
        setIsStabilized(false);
      }
    }, 80);

    return () => {
      clearInterval(trackingIntervalRef.current);
      clearTimeout(stabilizationTimerRef.current);
      trackingIntervalRef.current = null;
      stabilizationTimerRef.current = null;
    };
  }, [isCameraOpen]);

  // Auto-capture when stabilized for 1.2s — hand is guaranteed present at this point
  useEffect(() => {
    if (isStabilized && !autoCapturing) {
      setAutoCapturing(true);
      stabilizationTimerRef.current = setTimeout(() => {
        doCapture(true); // force=true: hand is confirmed stable
        setAutoCapturing(false);
        setIsStabilized(false);
      }, 1200);
    }
    if (!isStabilized) {
      clearTimeout(stabilizationTimerRef.current);
      stabilizationTimerRef.current = null;
      setAutoCapturing(false);
    }
  }, [isStabilized]);

  // Core snap function — only fires when a hand is in frame
  const doCapture = (force = false) => {
    if (!videoRef.current || !streamRef.current) return;
    // Block if no hand detected, unless this is an auto-capture (force=true)
    if (!force && !handDetected) {
      setNoHandWarning(true);
      setTimeout(() => setNoHandWarning(false), 1200);
      return;
    }
    setIsShrinking(true);
    setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      setStagedImage({
        id: 'capture_' + Date.now(),
        src: canvas.toDataURL('image/jpeg'),
        title: `Hand Snap (${new Date().toLocaleTimeString()})`,
        isCustom: true
      });
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 160);
      setIsShrinking(false);
    }, 300);
  };

  // Manual shutter — passes handDetected check
  const handleCaptureFrame = () => doCapture(false);

  // ── Drag-to-resize lens box handlers ──────────────────────────────
  const handleLensDragStart = (e, handle) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStateRef.current = { handle, startX: clientX, startY: clientY, startBox: { ...lensBox } };
    window.addEventListener('mousemove', handleLensDragMove);
    window.addEventListener('mouseup', handleLensDragEnd);
    window.addEventListener('touchmove', handleLensDragMove, { passive: false });
    window.addEventListener('touchend', handleLensDragEnd);
  };

  const handleLensDragMove = (e) => {
    if (!dragStateRef.current) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const { handle, startX, startY, startBox } = dragStateRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dx = (clientX - startX) / vw;
    const dy = (clientY - startY) / vh;
    setLensBox(prev => {
      let { x, y, w, h } = startBox;
      if (handle === 'tl') { x += dx; y += dy; w -= dx; h -= dy; }
      if (handle === 'tr') { y += dy; w += dx; h -= dy; }
      if (handle === 'bl') { x += dx; w -= dx; h += dy; }
      if (handle === 'br') { w += dx; h += dy; }
      // Clamp
      w = Math.max(0.15, Math.min(0.9, w));
      h = Math.max(0.12, Math.min(0.85, h));
      x = Math.max(0, Math.min(1 - w, x));
      y = Math.max(0, Math.min(1 - h, y));
      return { x, y, w, h };
    });
  };

  const handleLensDragEnd = () => {
    dragStateRef.current = null;
    window.removeEventListener('mousemove', handleLensDragMove);
    window.removeEventListener('mouseup', handleLensDragEnd);
    window.removeEventListener('touchmove', handleLensDragMove);
    window.removeEventListener('touchend', handleLensDragEnd);
  };

  // Click on dimmed area to re-center lens box
  const handleLensAreaClick = (e) => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;
    setLensBox(prev => ({
      ...prev,
      x: Math.max(0, Math.min(1 - prev.w, cx - prev.w / 2)),
      y: Math.max(0, Math.min(1 - prev.h, cy - prev.h / 2)),
    }));
  };


  // Submit search request to conversation flow
  const handleSendPrompt = (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() && !stagedImage) return;

    const userMessage = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      text: inputValue,
      image: stagedImage
    };

    // Calculate matches instantly matching input parameters
    const matches = getRecommendations(
      designsData,
      inputValue,
      stagedImage,
      filters
    );

    const assistantMessage = {
      id: 'msg_assistant_' + Date.now(),
      sender: 'assistant',
      text: stagedImage 
        ? `Here are the matching patterns calculated by matching tag categories with your uploaded reference photo.`
        : `Here are the matching patterns retrieved from the catalog matching your description.`,
      designs: matches,
      appliedFilters: { ...filters }
    };

    let targetSessionId = activeSessionId;

    if (!targetSessionId || targetSessionId === 'bookmarks') {
      // Create new session
      const newSession = {
        id: 'session_' + Date.now(),
        title: inputValue.trim() 
          ? inputValue.substring(0, 24) 
          : stagedImage ? `Photo Match (${stagedImage.title.substring(0, 10)})` : 'New Search',
        messages: [userMessage, assistantMessage],
        filters: { ...filters }
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
    } else {
      // Append to active session
      setSessions(prev => prev.map(s => {
        if (s.id === targetSessionId) {
          return {
            ...s,
            messages: [...s.messages, userMessage, assistantMessage]
          };
        }
        return s;
      }));
    }

    // Reset inputs
    setInputValue('');
    setStagedImage(null);
  };

  // Click suggestion card prompt
  const handleSuggestionClick = (promptText) => {
    setInputValue(promptText);
  };

  // Set filter categories
  const handleFilterSelect = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
    setActiveFilterDropdown(null);
  };

  // Cycle filter parameter on click
  const handleCycleFilter = (type) => {
    const lists = {
      style: ['All', ...uniqueStyles],
      placement: ['All', ...uniquePlacements],
      complexity: ['All', ...uniqueComplexities],
      occasion: ['All', ...uniqueOccasions]
    };
    
    const list = lists[type];
    const currentVal = filters[type];
    const currentIndex = list.indexOf(currentVal);
    const nextIndex = (currentIndex + 1) % list.length;
    const nextVal = list[nextIndex];
    
    setFilters(prev => ({
      ...prev,
      [type]: nextVal
    }));
  };

  // Retrieve current active session object
  const currentSession = useMemo(() => {
    if (activeSessionId === 'bookmarks') {
      return {
        id: 'bookmarks',
        title: 'Saved Bookmarks',
        messages: [
          {
            id: 'msg_bookmarks',
            sender: 'assistant',
            text: 'Here are all the designs you have bookmarked.',
            designs: designsData.filter(d => favorites.includes(d.id)).map(d => ({
              ...d,
              similarityScore: 0
            }))
          }
        ]
      };
    }
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId, favorites]);

  const uniqueStyles = ['Arabic', 'Minimal', 'Indian', 'Rajasthani'];
  const uniqueComplexities = ['Simple', 'Medium', 'Detailed'];
  const uniqueOccasions = ['Bridal', 'Festival', 'Everyday'];
  const uniquePlacements = ['Palm', 'Back Hand', 'Fingers', 'Wrist'];

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#1a1a1a] text-zinc-800 dark:text-zinc-200 font-sans transition-colors duration-300">
      
      {/* 1. Left Conversation History Sidebar (ChatGPT style) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#171717] text-[#ececec] border-r border-[#262626] flex flex-col justify-between transform transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* New Search Action Button */}
          <div className="p-3.5">
            <button
              onClick={handleNewSession}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[#404040] hover:bg-[#212121] text-xs font-semibold tracking-wide transition-all"
            >
              <span className="flex items-center gap-2">
                <Plus size={14} />
                New Match Session
              </span>
              <span className="text-[10px] bg-[#2d2d2d] px-1.5 py-0.5 rounded text-zinc-400">Ctrl N</span>
            </button>
          </div>

          {/* Session History List */}
          <div className="flex-1 overflow-y-auto px-3 space-y-4">
            <div>
              <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider px-2 block mb-1">
                Recent Matches
              </span>
              
              {sessions.length > 0 ? (
                <div className="space-y-0.5">
                  {sessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => { setActiveSessionId(session.id); setIsSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between group px-3 py-2 rounded-lg text-xs font-medium text-left truncate transition-all ${
                        activeSessionId === session.id
                          ? 'bg-[#212121] text-white'
                          : 'hover:bg-[#212121] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="truncate pr-2">{session.title}</span>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-opacity"
                        title="Delete session"
                      >
                        <Trash2 size={12} />
                      </button>
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-zinc-500 italic px-2 block">
                  No match history
                </span>
              )}
            </div>

            {/* Bookmarks Toggle button */}
            <div className="pt-3 border-t border-[#262626]">
              <button
                onClick={() => { setActiveSessionId('bookmarks'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                  activeSessionId === 'bookmarks'
                    ? 'bg-[#212121] text-white font-semibold'
                    : 'hover:bg-[#212121] text-zinc-400 hover:text-zinc-250'
                }`}
              >
                <Heart size={13} className={favorites.length > 0 ? "fill-red-500 text-red-500" : ""} />
                <span>Bookmarked Collection ({favorites.length})</span>
              </button>
            </div>

          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3.5 border-t border-[#262626] flex items-center justify-between text-xs text-zinc-400">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded hover:bg-[#212121] hover:text-white transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <span className="text-[10px] font-semibold text-zinc-600">MEHANDI STUDIO AI</span>
        </div>
      </aside>

      {/* Mobile Sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/45 lg:hidden transition-opacity"
        />
      )}

      {/* 2. Main Chat Thread Layout */}
      <main className="flex-grow flex flex-col h-screen overflow-hidden bg-zinc-50 dark:bg-[#212121] relative z-0">
        
        {/* Background Live Camera Feed */}
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          webkit-playsinline="true"
          muted
          className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-300 ${
            isCameraOpen ? 'opacity-90' : 'opacity-0'
          }`}
        />
        {/* ── Clean corner-bracket camera overlay (reference style) ──────── */}
        {isCameraOpen && (() => {
          const bracketColor = isStabilized ? 'rgba(74,222,128,0.95)' : 'rgba(255,255,255,0.90)';
          const glow = isStabilized ? '0 0 12px 3px rgba(74,222,128,0.5)' : 'none';
          const bracketLen = 22; // px
          const thickness = 3;  // px
          const pad = 20;       // inset from viewport edge

          const corners = [
            { top: pad, left: pad,   borderTop: thickness, borderLeft: thickness,   borderRight: 0, borderBottom: 0 },
            { top: pad, right: pad,  borderTop: thickness, borderRight: thickness,  borderLeft: 0,  borderBottom: 0 },
            { bottom: pad, left: pad,  borderBottom: thickness, borderLeft: thickness,  borderRight: 0, borderTop: 0 },
            { bottom: pad, right: pad, borderBottom: thickness, borderRight: thickness, borderLeft: 0,  borderTop: 0 },
          ];

          return (
            <>
              {/* Four corner L-brackets */}
              {corners.map((c, i) => (
                <div
                  key={i}
                  className="absolute z-20 pointer-events-none"
                  style={{
                    width: bracketLen,
                    height: bracketLen,
                    top: c.top, left: c.left, right: c.right, bottom: c.bottom,
                    borderStyle: 'solid',
                    borderColor: bracketColor,
                    borderTopWidth:    c.borderTop    || 0,
                    borderLeftWidth:   c.borderLeft   || 0,
                    borderRightWidth:  c.borderRight  || 0,
                    borderBottomWidth: c.borderBottom || 0,
                    borderRadius: i === 0 ? '4px 0 0 0' : i === 1 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 0 4px 0',
                    boxShadow: glow,
                    transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
                  }}
                />
              ))}

              {/* Scan line when NOT stabilized */}
              {!isStabilized && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none lens-scan-line"
                  style={{
                    height: '1.5px',
                    background: 'linear-gradient(to right, transparent 10%, rgba(255,255,255,0.55) 50%, transparent 90%)',
                  }}
                />
              )}

              {/* Ripple rings when stabilized */}
              {isStabilized && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                  <div className="lens-ripple w-20 h-20 rounded-full border border-green-400/50" />
                  <div className="lens-ripple absolute w-32 h-32 rounded-full border border-green-400/25" style={{ animationDelay: '0.3s' }} />
                </div>
              )}

              {/* Minimal status chip — bottom-center */}
              <div className="absolute bottom-36 left-0 right-0 z-20 flex justify-center pointer-events-none">
                <span className={`text-[10px] tracking-widest font-semibold px-3 py-1 rounded-full backdrop-blur-sm transition-all duration-300 ${
                  noHandWarning  ? 'text-red-300 bg-black/60 animate-pulse' :
                  isShrinking    ? 'text-white bg-black/50' :
                  autoCapturing  ? 'text-green-300 bg-black/50' :
                  isStabilized   ? 'text-green-300 bg-black/50' :
                  handDetected   ? 'text-yellow-200 bg-black/40' :
                                   'text-white/70 bg-black/30'
                }`}>
                  {noHandWarning ? '✋ Show your hand first' :
                   isShrinking   ? 'Capturing…' :
                   autoCapturing ? 'Analysing…' :
                   isStabilized  ? '✓ Hold still — snapping' :
                   handDetected  ? 'Hand detected — hold steady' :
                                   'Show your hand to capture'}
                </span>
              </div>

              {/* Tap anywhere to re-centre brackets (no-op needed; brackets are fixed to viewport edges) */}
            </>
          );
        })()}


        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-zinc-250 dark:border-zinc-800 bg-white/80 dark:bg-[#212121]/80 backdrop-blur-sm z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 lg:hidden"
            >
              <Menu size={18} />
            </button>
            <h1 className="font-semibold text-xs tracking-wide text-zinc-900 dark:text-white uppercase">
              {currentSession ? currentSession.title : 'AI Recommender Console'}
            </h1>
          </div>

        </header>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 pb-36 relative z-10">
          
          {!currentSession ? (
            /* NEW CHAT SPLASH SCREEN (Claude style center alignment) */
            !isCameraOpen && (
              <div className="max-w-2xl mx-auto text-center py-12 md:py-20 space-y-8 animate-fade-in">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight text-zinc-800 dark:text-white">
                  Explore Mehndi Collections
                </h2>
                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
                  Type description prompts to query catalog matches, or attach reference designs using similarity logic.
                </p>
              </div>

              {/* Suggestion Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-4 text-left">
                <button
                  onClick={() => handleSuggestionClick("Arabic Floral Trail")}
                  className="p-4 bg-white dark:bg-[#2d2d2d] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 rounded-xl transition-all shadow-sm group"
                >
                  <h4 className="text-xs font-semibold text-zinc-800 dark:text-white group-hover:text-[#b0a05e] dark:group-hover:text-[#dbd2ad]">Arabic Floral Trail</h4>
                  <p className="text-[10px] text-zinc-550 mt-1">Flowing leaf trails and floral patterns.</p>
                </button>

                <button
                  onClick={() => handleSuggestionClick("Minimalist Finger Bands")}
                  className="p-4 bg-white dark:bg-[#2d2d2d] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl transition-all shadow-sm group"
                >
                  <h4 className="text-xs font-semibold text-zinc-800 dark:text-white group-hover:text-[#b0a05e] dark:group-hover:text-[#dbd2ad]">Minimalist Bands</h4>
                  <p className="text-[10px] text-zinc-550 mt-1">Simple ring cuffs and geometric finger bands.</p>
                </button>

                <button
                  onClick={() => handleSuggestionClick("Traditional Rajasthani Bridal")}
                  className="p-4 bg-white dark:bg-[#2d2d2d] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl transition-all shadow-sm group"
                >
                  <h4 className="text-xs font-semibold text-zinc-800 dark:text-white group-hover:text-[#b0a05e] dark:group-hover:text-[#dbd2ad]">Rajasthani Bridal</h4>
                  <p className="text-[10px] text-zinc-550 mt-1">Dense, detailed patterns featuring paisleys and peacocks.</p>
                </button>

                <button
                  onClick={() => handleSuggestionClick("Everyday Mandalas")}
                  className="p-4 bg-white dark:bg-[#2d2d2d] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl transition-all shadow-sm group"
                >
                  <h4 className="text-xs font-semibold text-zinc-800 dark:text-white group-hover:text-[#b0a05e] dark:group-hover:text-[#dbd2ad]">Everyday Mandalas</h4>
                  <p className="text-[10px] text-zinc-550 mt-1">Symmetrical circular motifs placed at palm centers.</p>
                </button>
              </div>
            </div>
            )
          ) : (
            /* CONVERSATION BUBBLE LIST */
            <div className="max-w-4xl mx-auto space-y-6">
              {currentSession.messages.map((message) => {
                const isUser = message.sender === 'user';
                return (
                  <div 
                    key={message.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm space-y-4 ${
                      isUser
                        ? 'bg-zinc-800 text-white border border-zinc-700 rounded-tr-none'
                        : 'bg-white dark:bg-[#2d2d2d] border border-zinc-200 dark:border-zinc-800 rounded-tl-none text-zinc-800 dark:text-zinc-200'
                    }`}>
                      
                      {/* Message Content Text */}
                      {message.text && (
                        <p className="text-xs font-medium leading-relaxed whitespace-pre-line">
                          {message.text}
                        </p>
                      )}

                      {/* Staged user image reference badge inside user bubble */}
                      {isUser && message.image && (
                        <div className="flex items-center gap-3 bg-zinc-700/50 p-2.5 rounded-lg border border-zinc-650 max-w-sm mt-2">
                          <img 
                            src={message.image.src} 
                            alt="Staged attachment"
                            className="h-12 w-12 object-cover rounded-md border border-zinc-600 bg-white"
                          />
                          <div className="truncate">
                            <span className="text-[8px] uppercase tracking-wider font-bold text-[#b0a05e] block">Staged Attachment</span>
                            <span className="text-[11px] font-semibold truncate block">{message.image.title}</span>
                          </div>
                        </div>
                      )}

                      {/* Matched designs gallery cards inside assistant bubble */}
                      {!isUser && message.designs && (
                        <div className="pt-2">
                          <DesignGrid 
                            designs={message.designs}
                            onDesignClick={setSelectedDesign}
                            onFindSimilar={(ref) => {
                              setStagedImage(ref);
                              // Auto trigger send matching
                              const userMsg = {
                                id: 'msg_user_' + Date.now(),
                                sender: 'user',
                                text: `Similar pattern request for design ID ${ref.id}`,
                                image: ref
                              };
                              const matches = getRecommendations(designsData, '', ref, filters);
                              const assistantMsg = {
                                id: 'msg_assistant_' + Date.now(),
                                sender: 'assistant',
                                text: `Here are the matching patterns computed based on similarity to design: ${ref.title}.`,
                                designs: matches,
                                appliedFilters: { ...filters }
                              };
                              setSessions(prev => prev.map(s => {
                                if (s.id === activeSessionId) {
                                  return {
                                    ...s,
                                    messages: [...s.messages, userMsg, assistantMsg]
                                  };
                                }
                                return s;
                              }));
                            }}
                            referenceImageId={message.designs.find(d => d.similarityScore === 100)?.id}
                            isSimilarityActive={true}
                            favorites={favorites}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* 3. Floating Bottom Input Console (ChatGPT style) */}
        <div className={`absolute bottom-0 inset-x-0 pt-10 pb-6 px-6 z-10 transition-all duration-300 ${
          isCameraOpen 
            ? 'bg-gradient-to-t from-zinc-50/40 dark:from-[#212121]/45 to-transparent' 
            : 'bg-gradient-to-t from-zinc-50 dark:from-[#212121] via-zinc-50/90 dark:via-[#212121]/90 to-transparent'
        }`}>
          <div className="max-w-2xl mx-auto space-y-3">
            
            {/* Floating pill Input Box */}
            <form 
              onSubmit={handleSendPrompt}
              className="group relative bg-white dark:bg-[#2d2d2d] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-md p-2 flex flex-col transition-all duration-300 ease-out transform hover:-translate-y-1.5 hover:scale-[1.015] hover:shadow-lg hover:border-brand-500 focus-within:-translate-y-1.5 focus-within:scale-[1.015] focus-within:shadow-lg focus-within:border-brand-500"
            >
              {/* Joined camera tab header sitting flush on top of the chat box border */}
              <button
                type="button"
                onClick={handleToggleCamera}
                className={`absolute -top-[27px] left-1/2 -translate-x-1/2 z-20 h-[28px] px-3.5 rounded-t-xl border-t border-x border-b-0 flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all duration-200 text-[10px] font-bold ${
                  isCameraOpen
                    ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950 dark:border-brand-900 dark:text-brand-400 hover:border-brand-300 dark:hover:border-brand-800'
                    : 'bg-white dark:bg-[#2d2d2d] border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-brand-700 dark:hover:text-brand-400 hover:border-brand-400 dark:hover:border-brand-600 group-hover:text-brand-700 dark:group-hover:text-brand-400 group-hover:border-brand-400 dark:group-hover:border-brand-600'
                }`}
                title={isCameraOpen ? "Turn off live camera backdrop" : "Turn on live camera backdrop"}
              >
                <Camera size={12} />
                <span>Camera Backdrop</span>
              </button>

              {/* Simple parameter toggles embedded in the chat box */}
              <div className="flex flex-wrap items-center justify-center gap-1 px-2 pt-4 pb-1 mb-1.5">
                <button
                  type="button"
                  onClick={() => handleCycleFilter('style')}
                  className={`px-3 py-1 rounded-md border text-[11px] font-semibold transform hover:scale-105 active:scale-95 transition-all duration-200 ${
                    filters.style !== 'All'
                      ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950/40 dark:border-brand-900/50 dark:text-brand-400 shadow-sm'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:bg-[#1a1a1a] dark:border-zinc-800 dark:text-zinc-400'
                  }`}
                  title="Cycle style category"
                >
                  Style: {filters.style}
                </button>

                <button
                  type="button"
                  onClick={() => handleCycleFilter('placement')}
                  className={`px-3 py-1 rounded-md border text-[11px] font-semibold transform hover:scale-105 active:scale-95 transition-all duration-200 ${
                    filters.placement !== 'All'
                      ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950/40 dark:border-brand-900/50 dark:text-brand-400 shadow-sm'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:bg-[#1a1a1a] dark:border-zinc-800 dark:text-zinc-400'
                  }`}
                  title="Cycle placement area"
                >
                  Area: {filters.placement}
                </button>

                <button
                  type="button"
                  onClick={() => handleCycleFilter('complexity')}
                  className={`px-3 py-1 rounded-md border text-[11px] font-semibold transform hover:scale-105 active:scale-95 transition-all duration-200 ${
                    filters.complexity !== 'All'
                      ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950/40 dark:border-brand-900/50 dark:text-brand-400 shadow-sm'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:bg-[#1a1a1a] dark:border-zinc-800 dark:text-zinc-400'
                  }`}
                  title="Cycle detail level"
                >
                  Detail: {filters.complexity}
                </button>

                <button
                  type="button"
                  onClick={() => handleCycleFilter('occasion')}
                  className={`px-3 py-1 rounded-md border text-[11px] font-semibold transform hover:scale-105 active:scale-95 transition-all duration-200 ${
                    filters.occasion !== 'All'
                      ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950/40 dark:border-brand-900/50 dark:text-brand-400 shadow-sm'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:bg-[#1a1a1a] dark:border-zinc-800 dark:text-zinc-400'
                  }`}
                  title="Cycle occasion"
                >
                  Occasion: {filters.occasion}
                </button>
              </div>

              {/* Mini thumbnail reference preview badge */}
              {stagedImage && (
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-[#212121] border border-zinc-200 dark:border-zinc-850 p-1.5 rounded-xl self-start mb-2 ml-2 animate-scale-in">
                  <img 
                    src={stagedImage.src} 
                    alt="Staged" 
                    className="h-8 w-8 object-cover rounded-md"
                  />
                  <span className="text-[10px] text-zinc-600 dark:text-zinc-300 truncate max-w-[120px] font-semibold">{stagedImage.title}</span>
                  <button 
                    type="button"
                    onClick={() => setStagedImage(null)}
                    className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full text-zinc-400"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Paperclip attachment button */}
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="p-2 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#383838] rounded-xl transition-all"
                  title="Attach design photo"
                >
                  <Paperclip size={16} />
                </button>

                {/* Shutter snapshot capture button (Visible only when camera backdrop active) */}
                {isCameraOpen && (
                  <button
                    type="button"
                    onClick={handleCaptureFrame}
                    className="p-2 text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                    title="Snapshot: Capture pattern from background camera"
                  >
                    <div className="h-4.5 w-4.5 rounded-full border-2 border-red-500 bg-red-100 flex items-center justify-center animate-pulse">
                      <div className="h-2 w-2 rounded-full bg-red-600 animate-ping-slow" />
                    </div>
                  </button>
                )}

                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Message Mehndi AI..."
                  className="flex-grow bg-transparent text-xs py-2 focus:outline-none placeholder-zinc-400"
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim() && !stagedImage}
                  className={`p-2 rounded-xl text-white transition-all shadow ${
                    (inputValue.trim() || stagedImage)
                      ? 'bg-[#1e352c] hover:bg-[#3d5f51]'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>

      </main>

      {/* Screen flash white overlay */}
      {showFlash && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none animate-flash" />
      )}

      {/* Expanded popover */}
      {selectedDesign && (
        <DesignModal 
          design={selectedDesign} 
          onClose={() => setSelectedDesign(null)}
          onFindSimilar={(ref) => {
            setStagedImage(ref);
            // Trigger auto search
            const userMsg = {
              id: 'msg_user_' + Date.now(),
              sender: 'user',
              text: `Similar pattern request for design ID ${ref.id}`,
              image: ref
            };
            const matches = getRecommendations(designsData, '', ref, filters);
            const assistantMsg = {
              id: 'msg_assistant_' + Date.now(),
              sender: 'assistant',
              text: `Here are the matching patterns computed based on similarity to design: ${ref.title}.`,
              designs: matches,
              appliedFilters: { ...filters }
            };
            setSessions(prev => prev.map(s => {
              if (s.id === activeSessionId) {
                return {
                  ...s,
                  messages: [...s.messages, userMsg, assistantMsg]
                };
              }
              return s;
            }));
          }}
          allDesigns={designsData}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

    </div>
  );
}
