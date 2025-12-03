
import React, { useState, useEffect } from 'react';
import { ToolType, ImageState, WatermarkSettings } from '../types';
import Button from './Button';
import { describeImage } from '../services/geminiService';

interface ToolPanelProps {
  activeTool: ToolType;
  imageState: ImageState;
  watermarkSettings: WatermarkSettings;
  setWatermarkSettings: (s: WatermarkSettings) => void;
  onApply: (newImage: string, type?: string) => void;
  onDownload: () => void;
  onDelete: () => void;
  isLoading: boolean;
}

const ToolPanel: React.FC<ToolPanelProps> = ({ 
  activeTool, 
  imageState, 
  watermarkSettings,
  setWatermarkSettings,
  onApply, 
  onDownload,
  onDelete,
  isLoading 
}) => {
  // Resize State
  const [resizeW, setResizeW] = useState(imageState.width);
  const [resizeH, setResizeH] = useState(imageState.height);
  const [maintainRatio, setMaintainRatio] = useState(true);

  // Rotate State
  const [rotation, setRotation] = useState(90);

  // Compress State
  const [targetKB, setTargetKB] = useState(Math.round(imageState.size / 1024));
  const [compressFormat, setCompressFormat] = useState(imageState.type);

  // Convert State
  const [convertFormat, setConvertFormat] = useState('image/jpeg');

  // AI State
  const [aiResult, setAiResult] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Effect to update local inputs when global image state changes
  useEffect(() => {
    setResizeW(imageState.width);
    setResizeH(imageState.height);
    setTargetKB(Math.round(imageState.size / 1024));
    setCompressFormat(imageState.type);
  }, [imageState.width, imageState.height, imageState.size, imageState.type]);

  const handleResizeChange = (dim: 'w' | 'h', val: number) => {
    if (maintainRatio) {
      const ratio = imageState.width / imageState.height;
      if (dim === 'w') {
        setResizeW(val);
        setResizeH(Math.round(val / ratio));
      } else {
        setResizeH(val);
        setResizeW(Math.round(val * ratio));
      }
    } else {
      if (dim === 'w') setResizeW(val);
      else setResizeH(val);
    }
  };

  const handleAiDescribe = async () => {
    if (!imageState.currentPreviewUrl) return;
    setIsAiLoading(true);
    setAiResult('');
    try {
        const result = await describeImage(imageState.currentPreviewUrl, imageState.type);
        setAiResult(result);
    } catch (e) {
        setAiResult('AI description failed. Please try again.');
    } finally {
        setIsAiLoading(false);
    }
  };

  // Shared input style for consistent "white box" look
  const inputClass = "w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-base p-2.5 bg-white text-gray-900 font-medium";
  const labelClass = "block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide";

  const renderContent = () => {
    switch (activeTool) {
      case ToolType.RESIZE:
        return (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-gray-900 pb-2">Resize Image</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Width (px)</label>
                <input 
                  type="number" 
                  value={resizeW} 
                  onChange={(e) => handleResizeChange('w', Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Height (px)</label>
                <input 
                  type="number" 
                  value={resizeH} 
                  onChange={(e) => handleResizeChange('h', Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
              <input 
                id="aspect" 
                type="checkbox" 
                checked={maintainRatio}
                onChange={(e) => setMaintainRatio(e.target.checked)}
                className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="aspect" className="ml-3 block text-sm font-medium text-gray-900 cursor-pointer">
                Maintain aspect ratio
              </label>
            </div>
            <div className="pt-2">
                <Button 
                  fullWidth 
                  size="lg"
                  onClick={() => onApply(JSON.stringify({width: resizeW, height: resizeH}), 'RESIZE')}
                  disabled={isLoading}
                >
                  {isLoading ? 'Resizing...' : 'Resize Image'}
                </Button>
            </div>
          </div>
        );

      case ToolType.CROP:
        return (
          <div className="space-y-4">
             <h3 className="font-bold text-lg text-gray-900 pb-2">Crop Image</h3>
             <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg text-sm text-emerald-800">
                Adjust the frame on the canvas to crop your image. Use the corners for freeform cropping.
             </div>
             <Button fullWidth size="lg" onClick={() => onApply('', 'CROP')} disabled={isLoading}>
                {isLoading ? 'Cropping...' : 'Apply Crop'}
             </Button>
          </div>
        );

      case ToolType.FLIP:
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-900 pb-2">Mirror Image</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" className="h-12" onClick={() => onApply('horizontal', 'FLIP')} disabled={isLoading}>
                Horizontal
              </Button>
              <Button variant="secondary" className="h-12" onClick={() => onApply('vertical', 'FLIP')} disabled={isLoading}>
                Vertical
              </Button>
            </div>
          </div>
        );

      case ToolType.ROTATE:
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-900 pb-2">Rotate Image</h3>
            <div>
               <label className={labelClass}>Rotation Angle</label>
               <div className="flex items-center space-x-2">
                 <input 
                   type="number"
                   value={rotation}
                   onChange={(e) => setRotation(Number(e.target.value))}
                   className={inputClass}
                 />
                 <span className="text-gray-500 font-medium">deg</span>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => setRotation(90)}>90°</Button>
                <Button variant="secondary" onClick={() => setRotation(180)}>180°</Button>
            </div>
            <Button fullWidth size="lg" onClick={() => onApply(rotation.toString(), 'ROTATE')} disabled={isLoading}>
              Apply Rotation
            </Button>
          </div>
        );

      case ToolType.COMPRESS:
        const isPng = imageState.type === 'image/png';
        
        return (
          <div className="space-y-6">
             <h3 className="font-bold text-lg text-gray-900 pb-2">Compress Image</h3>
             
             <div className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center shadow-sm">
                <span className="text-sm font-bold text-gray-500 uppercase">Current Size</span>
                <span className="text-xl font-black text-gray-900">{(imageState.size / 1024).toFixed(2)} KB</span>
             </div>
             
             <div>
               <label className={labelClass}>Target Size (KB)</label>
               <input 
                 type="number" 
                 value={targetKB}
                 onChange={(e) => setTargetKB(Number(e.target.value))}
                 className={inputClass}
                 placeholder="e.g. 100"
               />
               <p className="text-xs text-gray-500 mt-2 italic">Note: Extremely small sizes may reduce quality significantly.</p>
             </div>

             <div className="space-y-2">
                <label className={labelClass}>Output Format</label>
                <div className="grid grid-cols-1 gap-2">
                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${compressFormat === 'image/jpeg' ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'hover:bg-gray-50'}`}>
                        <input 
                            type="radio" 
                            name="compress_fmt" 
                            checked={compressFormat === 'image/jpeg'} 
                            onChange={() => setCompressFormat('image/jpeg')} 
                            className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                        />
                        <div className="ml-3">
                            <span className="block text-sm font-medium text-gray-900">JPG / JPEG</span>
                            <span className="block text-xs text-gray-500">Best for photographs & compression</span>
                        </div>
                    </label>

                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${compressFormat === 'image/webp' ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'hover:bg-gray-50'}`}>
                        <input 
                            type="radio" 
                            name="compress_fmt" 
                            checked={compressFormat === 'image/webp'} 
                            onChange={() => setCompressFormat('image/webp')} 
                            className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                        />
                         <div className="ml-3">
                            <span className="block text-sm font-medium text-gray-900">WebP</span>
                            <span className="block text-xs text-gray-500">Modern format, good compression</span>
                        </div>
                    </label>

                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${compressFormat === 'image/png' ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'hover:bg-gray-50'}`}>
                        <input 
                            type="radio" 
                            name="compress_fmt" 
                            checked={compressFormat === 'image/png'} 
                            onChange={() => setCompressFormat('image/png')} 
                            className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                        />
                         <div className="ml-3">
                            <span className="block text-sm font-medium text-gray-900">PNG</span>
                            <span className="block text-xs text-gray-500">Lossless, larger file size</span>
                        </div>
                    </label>
                </div>
                {isPng && compressFormat === 'image/png' && (
                     <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                        <strong>Tip:</strong> Converting to JPG or WebP is recommended for significantly reducing file size.
                     </div>
                )}
             </div>

             <Button 
                fullWidth 
                size="lg"
                onClick={() => onApply(JSON.stringify({ size: targetKB, format: compressFormat }), 'COMPRESS')} 
                disabled={isLoading}
             >
               {isLoading ? 'Compressing...' : 'Compress Image'}
             </Button>
          </div>
        );

      case ToolType.CONVERT:
        return (
          <div className="space-y-4">
             <h3 className="font-bold text-lg text-gray-900 pb-2">Convert / Document</h3>
             <p className="text-sm text-gray-600 mb-2">Convert image to another format or document type.</p>
             <div className="grid grid-cols-2 gap-3">
                {['image/jpeg', 'image/png', 'image/webp', 'image/bmp'].map(fmt => (
                   <button
                     key={fmt}
                     onClick={() => setConvertFormat(fmt)}
                     className={`px-4 py-3 text-sm font-bold rounded-lg border-2 transition-all ${
                       convertFormat === fmt 
                         ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                         : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                     }`}
                   >
                     {fmt.split('/')[1].toUpperCase()}
                   </button>
                ))}
             </div>
             
             <div className="mt-4 pt-4 border-t">
               <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                 <input 
                    type="radio" 
                    name="doc_fmt"
                    checked={convertFormat === 'application/pdf'}
                    onChange={() => setConvertFormat('application/pdf')}
                    className="h-4 w-4 text-emerald-600"
                 />
                 <span className="text-sm font-bold text-gray-700">PDF Document</span>
               </label>
             </div>

             <Button fullWidth size="lg" onClick={() => onApply(convertFormat, 'CONVERT')} disabled={isLoading}>
               Convert to {convertFormat === 'application/pdf' ? 'PDF' : convertFormat.split('/')[1].toUpperCase()}
             </Button>
          </div>
        );

      case ToolType.WATERMARK:
        return (
          <div className="space-y-6">
             <h3 className="font-bold text-lg text-gray-900 pb-2">Watermark</h3>
             <p className="text-xs text-gray-500 -mt-2">Drag text on image to position.</p>

             {/* Text Input */}
             <div>
                <label className={labelClass}>Text</label>
                <input 
                  type="text" 
                  value={watermarkSettings.text} 
                  onChange={(e) => setWatermarkSettings({...watermarkSettings, text: e.target.value})}
                  className={inputClass}
                />
             </div>

             {/* Text Controls */}
             <div className="grid grid-cols-2 gap-4">
                 {/* Color Picker */}
                 <div>
                    <label className={labelClass}>Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={watermarkSettings.color} 
                        onChange={(e) => setWatermarkSettings({...watermarkSettings, color: e.target.value})}
                        className="w-10 h-10 p-1 rounded border border-gray-300 cursor-pointer"
                      />
                      <div className="flex-1 flex items-center px-2 border rounded bg-white text-xs font-mono">
                          {watermarkSettings.color}
                      </div>
                    </div>
                 </div>
                 
                 {/* Size Slider */}
                 <div>
                    <div className="flex justify-between items-center mb-1">
                       <label className={labelClass}>Size</label>
                       <span className="text-xs font-mono">{Math.round(watermarkSettings.fontSize * 100)}</span>
                    </div>
                    <input 
                      type="range"
                      min="0.01"
                      max="0.3"
                      step="0.01"
                      value={watermarkSettings.fontSize}
                      onChange={(e) => setWatermarkSettings({...watermarkSettings, fontSize: Number(e.target.value)})}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-2"
                    />
                 </div>
             </div>

             {/* Opacity Slider */}
             <div>
                <div className="flex justify-between items-center mb-1">
                   <label className={labelClass}>Transparency</label>
                   <span className="text-xs font-mono">{Math.round(watermarkSettings.opacity * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={watermarkSettings.opacity}
                  onChange={(e) => setWatermarkSettings({...watermarkSettings, opacity: Number(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
             </div>

             {/* Position Grid */}
             <div>
                <label className={labelClass}>Quick Position</label>
                <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
                    {[
                      {x:0, y:0}, {x:0.5, y:0}, {x:1, y:0},
                      {x:0, y:0.5}, {x:0.5, y:0.5}, {x:1, y:0.5},
                      {x:0, y:1}, {x:0.5, y:1}, {x:1, y:1},
                    ].map((pos, i) => (
                      <button 
                        key={i}
                        className={`h-8 w-8 rounded border transition-colors ${
                          watermarkSettings.x === pos.x && watermarkSettings.y === pos.y
                            ? 'bg-emerald-600 border-emerald-600'
                            : 'bg-white border-gray-300 hover:bg-gray-100'
                        }`}
                        onClick={() => setWatermarkSettings({...watermarkSettings, x: pos.x, y: pos.y})}
                      >
                         {/* Simple dot for visual */}
                         <div className={`w-1.5 h-1.5 rounded-full mx-auto ${
                            watermarkSettings.x === pos.x && watermarkSettings.y === pos.y ? 'bg-white' : 'bg-gray-400'
                         }`}></div>
                      </button>
                    ))}
                </div>
             </div>

             <Button fullWidth size="lg" onClick={() => onApply('', 'WATERMARK')} disabled={isLoading}>
               Apply Watermark
             </Button>
          </div>
        );
      
      case ToolType.AI_UPSCALE:
        return (
          <div className="space-y-4">
             <h3 className="font-bold text-lg text-gray-900 pb-2">AI Upscale & Enhance</h3>
             <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg text-sm text-purple-900">
                <p className="font-bold mb-1"> ✨ Powered by Gemini AI</p>
                Uses generative AI to increase resolution, sharpen details, and improve image quality.
             </div>
             
             <p className="text-xs text-gray-500 italic">
               Note: The AI will regenerate the image with higher details. This may slightly alter facial features or small details.
             </p>

             <Button 
                fullWidth 
                size="lg" 
                onClick={() => onApply('', 'AI_UPSCALE')} 
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500"
             >
               {isLoading ? 'Upscaling...' : 'Upscale Image 2x'}
             </Button>
          </div>
        );

      case ToolType.AI_DESCRIBE:
        return (
          <div className="space-y-4">
             <h3 className="font-bold text-lg text-gray-900 pb-2">AI Analysis</h3>
             <p className="text-sm text-gray-600">
               Generate detailed alt text or descriptions for your image using Gemini AI.
             </p>
             <Button fullWidth size="lg" onClick={handleAiDescribe} disabled={isAiLoading || isLoading}>
               {isAiLoading ? 'Analyzing...' : 'Analyze Image'}
             </Button>
             
             {aiResult && (
               <div className="mt-4 p-4 bg-white rounded-lg text-sm text-gray-800 border border-gray-200 shadow-sm">
                 <h4 className="font-bold text-xs uppercase tracking-wide text-gray-500 mb-2">Result:</h4>
                 <p className="leading-relaxed whitespace-pre-wrap">{aiResult}</p>
                 <Button 
                   size="sm" 
                   variant="ghost" 
                   className="mt-3 w-full text-emerald-600 hover:bg-emerald-50 border border-emerald-200"
                   onClick={() => navigator.clipboard.writeText(aiResult)}
                 >
                   Copy Text
                 </Button>
               </div>
             )}
          </div>
        );

      default:
        return <div className="text-gray-400 text-sm italic p-4 text-center">Select a tool from the left menu to begin editing.</div>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {renderContent()}
      </div>
      
      {activeTool !== ToolType.UPLOAD && (
         <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-3 shrink-0">
            <Button 
              fullWidth 
              variant="primary"
              size="lg"
              onClick={onDownload}
              className="shadow-lg shadow-emerald-200 font-bold py-3 text-lg"
            >
              Download
            </Button>
         </div>
      )}
    </div>
  );
};

export default ToolPanel;
