import React, { useRef } from 'react';

interface UploadProps {
  onFileSelect: (file: File) => void;
}

const Upload: React.FC<UploadProps> = ({ onFileSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
        // Critical fix: Reset value before clicking to ensure onChange fires 
        // even if the user selects the exact same file as before.
        inputRef.current.value = '';
        inputRef.current.click();
    }
  };

  return (
    <div 
      className="max-w-xl mx-auto mt-20 p-10 border-2 border-dashed border-gray-300 rounded-2xl bg-white hover:border-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer text-center group select-none"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={inputRef} 
        onChange={handleChange} 
        accept="image/png, image/jpeg, image/webp, image/bmp, image/gif"
      />
      <div className="mb-4 text-emerald-100 group-hover:text-emerald-200 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Image</h2>
      <p className="text-gray-500">Drag & drop your image here or click to browse</p>
      <div className="mt-6 flex gap-2 justify-center text-xs text-gray-400 uppercase tracking-wide">
        <span>JPG</span><span>•</span>
        <span>PNG</span><span>•</span>
        <span>WEBP</span><span>•</span>
        <span>GIF</span><span>•</span>
        <span>BMP</span>
      </div>
    </div>
  );
};

export default Upload;