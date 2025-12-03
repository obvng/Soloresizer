import React from 'react';

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-white border-t border-gray-200 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900">SoloResizer</h3>
            <p className="text-sm text-gray-500">
              The simplest way to edit and convert your images online. Free, fast, and secure.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Edit & Resize</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#resize" onClick={scrollToTop} className="hover:text-emerald-600 hover:underline">Resize Image</a></li>
              <li><a href="#crop" onClick={scrollToTop} className="hover:text-emerald-600 hover:underline">Crop Image</a></li>
              <li><a href="#rotate" onClick={scrollToTop} className="hover:text-emerald-600 hover:underline">Rotate Image</a></li>
              <li><a href="#flip" onClick={scrollToTop} className="hover:text-emerald-600 hover:underline">Mirror / Flip</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Optimize & Utilities</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#compress" onClick={scrollToTop} className="hover:text-emerald-600 hover:underline">Compress JPEG/PNG</a></li>
              <li><a href="#convert" onClick={scrollToTop} className="hover:text-emerald-600 hover:underline">Convert to JPG/WEBP</a></li>
              <li><a href="#convert" onClick={scrollToTop} className="hover:text-emerald-600 hover:underline">Image to PDF</a></li>
              <li><a href="#text" onClick={scrollToTop} className="hover:text-emerald-600 hover:underline">Word Counter & Text Tools</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Language</h4>
            <div className="relative">
              <select className="block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2 px-3 bg-white text-gray-900 font-medium">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
                <option value="nl">Nederlands</option>
                <option value="pl">Polski</option>
                <option value="ru">Русский</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
                <option value="ko">한국어</option>
                <option value="ar">العربية</option>
                <option value="tr">Türkçe</option>
                <option value="hi">हिन्दी</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} SoloResizer.com. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;