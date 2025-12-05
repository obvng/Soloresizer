import React, { useState, useRef, useEffect } from 'react';
import { ToolType, ImageState, AppMode, WatermarkSettings } from './types';
import Upload from './components/Upload';
import ToolPanel from './components/ToolPanel';
import TextTools from './components/TextTools';
import Footer from './components/Footer';
import Button from './components/Button';
import { 
  fileToDataURL, 
  resizeImage, 
  rotateImage, 
  flipImage, 
  compressImage, 
  convertImage,
  cropImage,
  loadImage,
  watermarkImage
} from './services/imageUtils';
import { upscaleImageWithGemini } from './services/geminiService';

const MENU_ITEMS = [
  { id: ToolType.CROP, label: 'Crop', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /> }, 
  { id: ToolType.RESIZE, label: 'Resize', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /> },
  { id: ToolType.FLIP, label: 'Mirror', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /> },
  { id: ToolType.ROTATE, label: 'Rotate', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /> },
  { id: ToolType.COMPRESS, label: 'Compress', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /> },
  { id: ToolType.CONVERT, label: 'Convert', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /> },
  { id: ToolType.WATERMARK, label: 'Watermark', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /> },
  { id: ToolType.AI_UPSCALE, label: 'AI Upscale', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /> },
  { id: ToolType.AI_DESCRIBE, label: 'AI Describe', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /> },
];

const LANDING_CONTENT: Record<string, { title: string; subtitle: string }> = {
  [ToolType.UPLOAD]: { title: 'The Ultimate Online Image Editor', subtitle: 'Resize, crop, convert, and compress images in seconds. Secure, fast, and free.' },
  [ToolType.RESIZE]: { title: 'Resize Image Online', subtitle: 'Change image dimensions in pixels or percentage without losing quality.' },
  [ToolType.CROP]: { title: 'Crop Image Online', subtitle: 'Trim unwanted parts of your photos with our free cropping tool.' },
  [ToolType.COMPRESS]: { title: 'Compress Image Online', subtitle: 'Reduce image file size while maintaining quality (JPG, PNG, WebP).' },
  [ToolType.CONVERT]: { title: 'Image Converter', subtitle: 'Convert images to JPG, PNG, WEBP, BMP or PDF documents.' },
  [ToolType.ROTATE]: { title: 'Rotate Image', subtitle: 'Rotate your photos 90 or 180 degrees clockwise or counter-clockwise.' },
  [ToolType.FLIP]: { title: 'Mirror Image', subtitle: 'Flip your images horizontally or vertically instantly.' },
  [ToolType.WATERMARK]: { title: 'Add Watermark', subtitle: 'Add text watermarks to your images to protect your work.' },
  [ToolType.AI_UPSCALE]: { title: 'AI Image Upscaler', subtitle: 'Enhance image quality and resolution using artificial intelligence.' },
  [ToolType.AI_DESCRIBE]: { title: 'AI Image Describer', subtitle: 'Generate descriptions and alt text using AI.' },
};

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>(AppMode.EDITOR);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.UPLOAD);
  const [imageState, setImageState] = useState<ImageState | null>(null);
  const [history, setHistory] = useState<ImageState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  
  // Bulk Mode State
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  
  // Crop UI state
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, w: 100, h: 100 });
  
  // Dragging state (Crop & Watermark)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Watermark State
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>({
    text: 'SoloResizer',
    color: '#ff0000',
    opacity: 1,
    x: 0.5,
    y: 0.5,
    fontSize: 0.05
  });
  
  const imgRef = useRef<HTMLImageElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  // Auto delete timer logic (Backend simulation)
  useEffect(() => {
    let interval: number;
    if (imageState && appMode === AppMode.EDITOR) {
      // 10 minutes in seconds (600s)
      let timeLeft = 600;
      interval = window.setInterval(() => {
        timeLeft -= 1;
        if (timeLeft <= 0) {
          handleDelete(); // Time's up
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [imageState, appMode]);

  // CENTRAL ROUTING LOGIC
  useEffect(() => {
    const handleHashChange = () => {
        const hash = window.location.hash.replace('#', '').toUpperCase();
        
        // Scroll to top of the content area on navigation
        if (mainScrollRef.current) {
            mainScrollRef.current.scrollTop = 0;
        }
        window.scrollTo(0, 0);

        // Handle TEXT mode specifically
        if (hash === 'TEXT') {
            setAppMode(AppMode.TEXT);
            document.title = 'Text Tools & Word Counter - SoloResizer';
            return;
        }

        // Handle Image Tools
        if (Object.values(ToolType).includes(hash as ToolType)) {
             const tool = hash as ToolType;
             setActiveTool(tool);
             setAppMode(AppMode.EDITOR);
             
             // Update Page Title
             const info = LANDING_CONTENT[tool];
             document.title = `${info ? info.title : 'Image Editor'} - SoloResizer`;
        } else {
             // Default / Home
             // Only default to UPLOAD if no hash is present or invalid
             if (!hash) {
                setActiveTool(ToolType.UPLOAD);
                setAppMode(AppMode.EDITOR);
                document.title = 'SoloResizer - Free Online Image Editor';
             }
        }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Trigger once on load to set initial state
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Helper to change tool via Hash (Single Source of Truth)
  const navigateToTool = (tool: ToolType) => {
    window.location.hash = tool;
  };

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    try {
      const url = await fileToDataURL(file);
      const img = await loadImage(url);
      
      setImageState({
        originalFile: file,
        currentPreviewUrl: url,
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
        name: file.name
      });
      setHistory([]); 
      
      // If currently on generic upload, switch to resize for better UX. 
      // If already on a specific tool (e.g. #crop), stay there.
      if (activeTool === ToolType.UPLOAD) {
        navigateToTool(ToolType.RESIZE);
      }
      
      setCropRect({
         x: Math.floor(img.width * 0.25),
         y: Math.floor(img.height * 0.25),
         w: Math.floor(img.width * 0.5),
         h: Math.floor(img.height * 0.5)
      });
      
    } catch (e) {
      alert("Failed to load image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBulkFiles(Array.from(e.target.files));
      setAppMode(AppMode.BULK);
    }
  };

  const handleDelete = () => {
    setImageState(null);
    setHistory([]);
    // Do not reset hash/activeTool to preserve "Page" feel
    // If user was on Crop Page, they stay on Crop Page (showing Crop Landing content)
  };

  const handleNewImage = () => {
    // If there are changes (history), ask for confirmation.
    // If no changes, just reset immediately.
    if (history.length > 0) {
        if (window.confirm("Discard current edits and start over?")) {
            handleDelete();
        }
    } else {
        handleDelete();
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setImageState(previousState);

    setCropRect({
       x: Math.floor(previousState.width * 0.25),
       y: Math.floor(previousState.height * 0.25),
       w: Math.floor(previousState.width * 0.5),
       h: Math.floor(previousState.height * 0.5)
    });
  };

  const handleToolApply = async (params: string, toolType: string) => {
    if (!imageState?.currentPreviewUrl) return;

    setIsLoading(true);
    try {
      let resultUrl = imageState.currentPreviewUrl;
      let newType = imageState.type;
      let newSize = imageState.size;

      switch (toolType) {
        case 'RESIZE':
          const { width, height } = JSON.parse(params);
          resultUrl = await resizeImage(resultUrl, width, height, imageState.type);
          break;
        case 'ROTATE':
          resultUrl = await rotateImage(resultUrl, Number(params));
          break;
        case 'FLIP':
          resultUrl = await flipImage(resultUrl, params === 'horizontal', params === 'vertical');
          break;
        case 'COMPRESS':
          const compressParams = JSON.parse(params);
          const compressionResult = await compressImage(resultUrl, compressParams.size, compressParams.format);
          resultUrl = compressionResult.url;
          newType = compressParams.format;
          newSize = compressionResult.size * 1024;
          break;
        case 'CONVERT':
          if (params === 'application/pdf') {
             newType = 'application/pdf';
          } else {
             resultUrl = await convertImage(resultUrl, params);
             newType = params;
          }
          break;
        case 'CROP':
             resultUrl = await cropImage(resultUrl, cropRect.x, cropRect.y, cropRect.w, cropRect.h);
          break;
        case 'WATERMARK':
             resultUrl = await watermarkImage(resultUrl, watermarkSettings);
          break;
        case 'AI_UPSCALE':
             resultUrl = await upscaleImageWithGemini(resultUrl, imageState.type);
          break;
      }

      const img = await loadImage(resultUrl);
      
      if (toolType !== 'COMPRESS') {
          const head = 'data:' + newType + ';base64,';
          newSize = Math.round((resultUrl.length - head.length) * 3 / 4);
      }

      setHistory(prev => [...prev, imageState!]);

      setImageState({
        ...imageState,
        currentPreviewUrl: resultUrl,
        width: img.width,
        height: img.height,
        size: newSize,
        type: newType
      });

      // Reset crop rect to center of new image
      setCropRect({
         x: Math.floor(img.width * 0.25),
         y: Math.floor(img.height * 0.25),
         w: Math.floor(img.width * 0.5),
         h: Math.floor(img.height * 0.5)
      });

    } catch (e) {
      console.error(e);
      alert("Operation failed. The image might be too large or invalid, or the AI service is unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (!imageState?.currentPreviewUrl) return;
    
    // PDF Handling
    if (imageState.type === 'application/pdf') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head><title>${imageState.name}</title></head>
                    <body style="margin:0; display:flex; justify-content:center; align-items:center;">
                        <img src="${imageState.currentPreviewUrl}" style="max-width:100%;" />
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
        return;
    }

    const link = document.createElement('a');
    link.href = imageState.currentPreviewUrl;
    
    const ext = imageState.type.split('/')[1] || 'jpg';
    const originalName = imageState.name.substring(0, imageState.name.lastIndexOf('.')) || imageState.name;
    
    link.download = `${originalName}_soloresizer.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Helpers ---
  const getScale = () => {
     if (!imgRef.current) return 1;
     return imgRef.current.naturalWidth / imgRef.current.offsetWidth;
  };

  // --- Interaction Handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!imgRef.current) return;

    if (activeTool === ToolType.CROP) {
        setIsDragging(true);
        const rect = imgRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) * getScale();
        const y = (e.clientY - rect.top) * getScale();
        setDragStart({ x, y });
        setCropRect({ x, y, w: 0, h: 0 });
    } else if (activeTool === ToolType.WATERMARK) {
        setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();

    if (activeTool === ToolType.CROP) {
        const scale = getScale();
        const currentX = (e.clientX - rect.left) * scale;
        const currentY = (e.clientY - rect.top) * scale;
        
        const minX = Math.min(dragStart.x, currentX);
        const minY = Math.min(dragStart.y, currentY);
        const w = Math.abs(currentX - dragStart.x);
        const h = Math.abs(currentY - dragStart.y);

        const finalX = Math.max(0, minX);
        const finalY = Math.max(0, minY);
        const finalW = Math.min(w, imageState!.width - finalX);
        const finalYH = Math.min(h, imageState!.height - finalY);

        setCropRect({ x: finalX, y: finalY, w: finalW, h: finalYH });
    } else if (activeTool === ToolType.WATERMARK) {
        // Calculate relative position (0-1)
        const relX = (e.clientX - rect.left) / rect.width;
        const relY = (e.clientY - rect.top) / rect.height;
        
        // Clamp between 0 and 1
        const clampedX = Math.max(0, Math.min(1, relX));
        const clampedY = Math.max(0, Math.min(1, relY));

        setWatermarkSettings({
            ...watermarkSettings,
            x: clampedX,
            y: clampedY
        });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // --- Render Views ---

  const renderBulkView = () => (
    <div className="flex-1 overflow-auto bg-gray-50 p-8" ref={mainScrollRef}>
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
         <h2 className="text-2xl font-bold mb-4">Bulk Resize</h2>
         <p className="mb-4 text-gray-600">You have selected {bulkFiles.length} images.</p>
         <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {bulkFiles.map((f, i) => (
               <div key={i} className="aspect-square bg-white rounded-lg border border-gray-200 flex flex-col items-center justify-center p-2 text-center shadow-sm">
                 <div className="text-4xl mb-2">🖼️</div>
                 <div className="text-xs text-gray-500 truncate w-full">{f.name}</div>
               </div>
            ))}
         </div>
         <div className="bg-amber-50 p-4 border border-amber-200 rounded text-amber-800 text-sm mb-6">
           Bulk processing is currently limited in this demo version. Please switch to Single Editor for full features.
         </div>
         <div className="flex gap-4">
            <Button variant="secondary" onClick={() => { setBulkFiles([]); setAppMode(AppMode.EDITOR); }}>Cancel</Button>
            <Button disabled>Process All (Coming Soon)</Button>
         </div>
      </div>
      <div className="mt-20">
        <Footer />
      </div>
    </div>
  );

  const landingInfo = LANDING_CONTENT[activeTool] || LANDING_CONTENT[ToolType.UPLOAD];

  return (
    <div className="h-screen flex flex-col font-sans text-gray-800 bg-white overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-16 shrink-0 z-50 flex items-center justify-between px-4 sm:px-6 relative shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { window.location.hash = ''; }}>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-2 rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 block">SoloResizer</h1>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
           {/* Mode Switcher */}
           <div className="hidden md:flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ''; }} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all block ${appMode === AppMode.EDITOR ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Editor</a>
              <a href="#text" onClick={(e) => { e.preventDefault(); window.location.hash = 'TEXT'; }} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all block ${appMode === AppMode.TEXT ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Text Tools</a>
           </div>
           
           {/* Header Language Selector */}
           <div className="mx-2 hidden sm:block">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 text-xs font-bold rounded p-1.5 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
              >
                <option value="en">EN</option>
                <option value="es">ES</option>
                <option value="fr">FR</option>
                <option value="de">DE</option>
              </select>
           </div>

           {/* Actions */}
           {imageState && appMode === AppMode.EDITOR && (
              <div className="flex items-center space-x-2 border-l pl-4 ml-2 border-gray-200">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleUndo} 
                  disabled={history.length === 0}
                  className="flex items-center gap-1.5"
                  title="Undo last action"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                  <span className="hidden sm:inline">Undo</span>
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleNewImage}
                  className="flex items-center gap-1.5"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New Image</span>
                </Button>
              </div>
            )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {appMode === AppMode.TEXT && (
          <div className="w-full h-full overflow-y-auto bg-gray-50" ref={mainScrollRef}>
            <TextTools />
            <Footer />
          </div>
        )}

        {appMode === AppMode.BULK && renderBulkView()}

        {appMode === AppMode.EDITOR && (
          <>
            {!imageState ? (
              <div className="w-full h-full overflow-y-auto bg-gray-50 flex flex-col" ref={mainScrollRef}>
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="max-w-2xl w-full text-center mb-10">
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">{landingInfo.title}</h2>
                        <p className="text-lg text-gray-600">{landingInfo.subtitle}</p>
                    </div>
                    <Upload onFileSelect={handleFileSelect} />
                    <div className="mt-8 text-center">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full border border-emerald-200 transition-all hover:shadow-md">
                            <input type="file" multiple className="hidden" onChange={handleBulkSelect} accept="image/*" />
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Try Bulk Resizing
                        </label>
                    </div>
                </div>
                <Footer />
              </div>
            ) : (
              // 3-Pane Editor Layout - Responsive
              <div className="flex flex-col md:flex-row w-full h-full">
                
                {/* 1. Left Toolbar (Navigation) */}
                <nav className="w-full md:w-20 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-row md:flex-col items-center justify-center md:justify-start py-2 md:py-4 gap-2 md:gap-4 overflow-x-auto md:overflow-y-auto shrink-0 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.02)] no-scrollbar">
                  {MENU_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigateToTool(item.id)}
                      className={`min-w-[3.5rem] w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 group ${
                        activeTool === item.id
                          ? 'bg-emerald-50 text-emerald-600 shadow-sm ring-1 ring-emerald-200'
                          : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      title={item.label}
                    >
                      <svg className={`w-6 h-6 ${activeTool === item.id ? 'stroke-2' : 'stroke-1.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                      <span className="text-[9px] font-semibold">{item.label}</span>
                    </button>
                  ))}
                </nav>

                {/* 2. Center Workspace (Canvas) */}
                <div className="flex-1 bg-gray-100 relative overflow-hidden flex flex-col z-10">
                   {/* Info Bar */}
                   <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-gray-700 border border-gray-200 flex gap-4 shadow-sm pointer-events-none select-none">
                      <span>{imageState.width} × {imageState.height}</span>
                      <span className="text-gray-300">|</span>
                      <span>{(imageState.size / 1024).toFixed(1)} KB</span>
                      <span className="text-gray-300">|</span>
                      <span>{imageState.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                   </div>

                   {/* Canvas */}
                   <div 
                      className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden checkerboard w-full h-full"
                      ref={imageContainerRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <div className="relative shadow-2xl transition-all duration-300">
                        <img 
                          ref={imgRef}
                          src={imageState.currentPreviewUrl} 
                          alt="Workspace" 
                          className={`max-w-full max-h-[70vh] md:max-h-[85vh] block object-contain select-none ${
                             activeTool === ToolType.CROP || activeTool === ToolType.WATERMARK ? 'cursor-crosshair' : ''
                          }`}
                          draggable={false}
                        />
                        
                        {/* Crop Overlay */}
                        {activeTool === ToolType.CROP && imgRef.current && (
                          <div 
                             className="absolute border-2 border-emerald-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none"
                             style={{
                               left: `${cropRect.x / (imgRef.current.naturalWidth / imgRef.current.offsetWidth)}px`,
                               top: `${cropRect.y / (imgRef.current.naturalWidth / imgRef.current.offsetWidth)}px`,
                               width: `${cropRect.w / (imgRef.current.naturalWidth / imgRef.current.offsetWidth)}px`,
                               height: `${cropRect.h / (imgRef.current.naturalWidth / imgRef.current.offsetWidth)}px`,
                             }}
                          >
                             {/* Rule of Thirds Grid */}
                             <div className="absolute top-0 bottom-0 left-1/3 w-px bg-emerald-400/50 shadow-sm"></div>
                             <div className="absolute top-0 bottom-0 left-2/3 w-px bg-emerald-400/50 shadow-sm"></div>
                             <div className="absolute left-0 right-0 top-1/3 h-px bg-emerald-400/50 shadow-sm"></div>
                             <div className="absolute left-0 right-0 top-2/3 h-px bg-emerald-400/50 shadow-sm"></div>

                             {/* Handles - Visual Only since Drag is handled on Parent */}
                             <div className="crop-handle -top-1.5 -left-1.5"></div>
                             <div className="crop-handle -top-1.5 -right-1.5"></div>
                             <div className="crop-handle -bottom-1.5 -left-1.5"></div>
                             <div className="crop-handle -bottom-1.5 -right-1.5"></div>
                          </div>
                        )}

                        {/* Watermark Overlay */}
                        {activeTool === ToolType.WATERMARK && imgRef.current && (
                            <div 
                                className="absolute transform whitespace-nowrap pointer-events-none select-none"
                                style={{
                                    left: `${watermarkSettings.x * 100}%`,
                                    top: `${watermarkSettings.y * 100}%`,
                                    transform: `translate(${watermarkSettings.x <= 0.05 ? '0' : watermarkSettings.x >= 0.95 ? '-100%' : '-50%'}, ${watermarkSettings.y <= 0.05 ? '0' : watermarkSettings.y >= 0.95 ? '-100%' : '-50%'})`,
                                    color: watermarkSettings.color,
                                    opacity: watermarkSettings.opacity,
                                    fontSize: `${(imgRef.current.offsetWidth * watermarkSettings.fontSize)}px`, 
                                    fontWeight: 'bold',
                                    textShadow: '0 0 2px rgba(255,255,255,0.5)',
                                    padding: watermarkSettings.x <= 0.05 || watermarkSettings.x >= 0.95 ? '0 1%' : '0'
                                }}
                            >
                                {watermarkSettings.text}
                            </div>
                        )}
                      </div>
                   </div>
                </div>

                {/* 3. Right Sidebar (Properties) */}
                <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col shrink-0 z-20 shadow-[-2px_0_10px_rgba(0,0,0,0.02)] h-1/3 md:h-auto overflow-y-auto">
                   <ToolPanel 
                      activeTool={activeTool}
                      imageState={imageState}
                      watermarkSettings={watermarkSettings}
                      setWatermarkSettings={setWatermarkSettings}
                      onApply={handleToolApply}
                      onDownload={downloadImage}
                      onDelete={handleDelete}
                      isLoading={isLoading}
                   />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;