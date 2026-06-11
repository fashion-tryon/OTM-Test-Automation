import React from 'react';
import { Film } from 'lucide-react';

export default function VideoPlayer({ src }) {
  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 gap-2">
        <Film className="w-8 h-8 opacity-40" />
        <span className="text-sm">No video available for this test</span>
      </div>
    );
  }

  return (
    <video
      className="w-full rounded-xl border border-slate-200 bg-black max-h-96"
      controls
      preload="metadata"
      src={src}
    >
      Your browser does not support video playback.
    </video>
  );
}
