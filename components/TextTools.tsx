import React, { useState } from 'react';
import Button from './Button';

const TextTools: React.FC = () => {
  const [text, setText] = useState('');
  
  const stats = {
    chars: text.length,
    words: text.trim() === '' ? 0 : text.trim().split(/\s+/).length,
    sentences: text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(Boolean).length,
    paragraphs: text.trim() === '' ? 0 : text.split(/\n+/).filter(Boolean).length
  };

  const handleCase = (type: 'upper' | 'lower' | 'title' | 'sentence' | 'alternating') => {
    switch(type) {
      case 'upper':
        setText(text.toUpperCase());
        break;
      case 'lower':
        setText(text.toLowerCase());
        break;
      case 'title':
        setText(text.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase()))));
        break;
      case 'sentence':
        setText(text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()));
        break;
      case 'alternating':
        setText(text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''));
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Text Tools & Word Counter</h2>
        <div className="text-sm text-gray-500">
            Paste your text below to analyze and format it.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-96 p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none font-mono text-sm bg-white text-gray-900 placeholder-gray-400"
              placeholder="Type or paste your text here..."
            />
            <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleCase('upper')}>UPPERCASE</Button>
                <Button size="sm" variant="secondary" onClick={() => handleCase('lower')}>lowercase</Button>
                <Button size="sm" variant="secondary" onClick={() => handleCase('title')}>Title Case</Button>
                <Button size="sm" variant="secondary" onClick={() => handleCase('sentence')}>Sentence case</Button>
                <Button size="sm" variant="secondary" onClick={() => handleCase('alternating')}>aLtErNaTiNg</Button>
                <Button size="sm" variant="danger" onClick={() => setText('')}>Clear</Button>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 h-fit shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Statistics</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Words</span>
                    <span className="text-xl font-bold text-emerald-600">{stats.words}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Characters</span>
                    <span className="text-xl font-bold text-emerald-600">{stats.chars}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Sentences</span>
                    <span className="text-xl font-bold text-emerald-600">{stats.sentences}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Paragraphs</span>
                    <span className="text-xl font-bold text-emerald-600">{stats.paragraphs}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TextTools;