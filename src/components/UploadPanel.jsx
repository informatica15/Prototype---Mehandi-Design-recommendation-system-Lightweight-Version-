import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles, Check } from 'lucide-react';

export default function UploadPanel({ 
  referenceImage, 
  setReferenceImage, 
  presetImages, 
  onReferenceSelected,
  modelStatus 
}) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      onReferenceSelected({
        id: 'custom_upload',
        src: event.target.result,
        title: file.name,
        isCustom: true
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-stretch">
      
      {/* Upload Box / Reference Preview */}
      <div className="flex-1 flex flex-col justify-between min-h-[220px]">
        <div>
          <h2 className="text-lg md:text-xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
            <Sparkles size={18} className="text-brand-600 dark:text-brand-400" />
            AI Similarity Query
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Upload a design or hand photo, or select a template below to find visually matching mehndi designs.
          </p>
        </div>

        {referenceImage ? (
          /* Active Preview State */
          <div className="relative rounded-2xl overflow-hidden border border-brand-200 dark:border-brand-900 bg-slate-900/5 dark:bg-black/30 p-4 flex items-center gap-4 animate-scale-in">
            <div className="relative h-24 w-24 rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-white border border-white/20">
              <img 
                src={referenceImage.src} 
                alt="AI Reference" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-grow min-w-0">
              <span className="inline-block text-[10px] font-bold text-brand-700 dark:text-brand-400 bg-brand-100 dark:bg-brand-950/40 px-2 py-0.5 rounded-full mb-1">
                {referenceImage.isCustom ? 'Uploaded Photo' : 'Preset Template'}
              </span>
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">
                {referenceImage.title}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                AI similarity analysis active
              </p>
            </div>
            <button 
              onClick={() => setReferenceImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
              title="Clear reference"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          /* Drag & Drop Upload Zone */
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[140px]
              ${isDragActive 
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20' 
                : 'border-slate-300 dark:border-slate-800 hover:border-brand-400 hover:bg-slate-50/30 dark:hover:bg-slate-900/10'
              }`}
          >
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <div className="bg-brand-100 dark:bg-brand-950/50 text-brand-700 dark:text-brand-400 p-3 rounded-full mb-3">
              <Upload size={22} className="animate-bounce" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Click to upload or drag & drop design
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Supports PNG, JPG, WEBP • Processed locally
            </p>
          </div>
        )}
      </div>

      {/* Preset Quick Select Panel */}
      <div className="w-full md:w-80 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-6 md:pt-0 md:pl-8">
        <div>
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ImageIcon size={14} />
            Select from Presets
          </h3>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {presetImages.slice(0, 8).map((preset) => {
              const isSelected = referenceImage?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onReferenceSelected({
                    id: preset.id,
                    src: preset.imageUrl,
                    title: preset.title,
                    isCustom: false
                  })}
                  className={`relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 transition-all duration-200 group
                    ${isSelected 
                      ? 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-950/40 scale-95 shadow-inner' 
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:scale-105 shadow-sm'
                    }`}
                  title={preset.title}
                >
                  <img 
                    src={preset.imageUrl} 
                    alt={preset.title} 
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-brand-500/20 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="bg-brand-600 text-white rounded-full p-1 shadow-sm">
                        <Check size={10} strokeWidth={4} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
          Tip: Selecting an image extracts its MobileNet activation feature vector and ranks other designs in milliseconds.
        </div>
      </div>

    </div>
  );
}
