import React, { useState } from 'react';
import { X, ZoomIn, ImageOff } from 'lucide-react';

export default function ScreenshotViewer({ screenshots }) {
  const [modal, setModal] = useState(null);

  if (!screenshots || screenshots.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-slate-400 text-sm gap-2">
        <ImageOff className="w-5 h-5 opacity-40" />
        No screenshots available
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {screenshots.map((ss, i) => (
          <button
            key={i}
            onClick={() => setModal(ss)}
            className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
          >
            <img
              src={ss.src}
              alt={ss.label}
              className="w-full h-28 object-cover"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
              <div className="text-white text-xs font-medium truncate">{ss.label}</div>
            </div>
          </button>
        ))}
      </div>

      {modal && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
          onClick={() => setModal(null)}
        >
          <div className="relative max-w-5xl max-h-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setModal(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={modal.src}
              alt={modal.label}
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <div className="text-white/70 text-center mt-3 text-sm">{modal.label}</div>
          </div>
        </div>
      )}
    </>
  );
}
