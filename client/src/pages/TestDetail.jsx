import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle, X } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import StepRow from '../components/StepRow';
import VideoPlayer from '../components/VideoPlayer';
import ScreenshotViewer from '../components/ScreenshotViewer';

export default function TestDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [test,    setTest]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);

  useEffect(() => {
    fetch('/api/tests/' + id)
      .then(r => r.json())
      .then(d => { setTest(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!test || test.error) {
    return <div className="text-center py-24 text-slate-400">Test not found</div>;
  }

  const steps = Array.isArray(test.steps) ? test.steps : [];

  // Collect screenshots from steps + final screenshot
  const screenshots = [];
  steps.forEach(s => {
    if (s.screenshot) {
      screenshots.push({ src: '/api/screenshots/' + s.screenshot, label: s.name || s.step || 'Step screenshot' });
    }
  });
  if (test.screenshot_path) {
    screenshots.push({ src: '/api/screenshots/' + test.screenshot_path, label: 'Final Screenshot' });
  }

  const videoSrc = test.video_path
    ? '/api/videos/' + encodeURIComponent(test.video_path)
    : null;

  return (
    <div className="space-y-6">

      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-800 truncate">{test.test_name}</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {test.suite_name && <>{test.suite_name} &middot; </>}
            {test.duration_ms ? (test.duration_ms / 1000).toFixed(1) + 's' : '—'}
          </p>
        </div>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <StatusBadge status={test.status} />
          <div className="text-sm text-slate-400">
            {test.duration_ms ? test.duration_ms.toLocaleString() + ' ms' : '—'}
          </div>
        </div>

        {test.error_message && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-red-700 mb-1">Error</div>
                <div className="text-sm text-red-600 font-mono whitespace-pre-wrap break-words">
                  {test.error_message}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Steps */}
      {steps.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 font-semibold text-slate-700">
            Test Steps <span className="text-slate-400 font-normal text-sm">({steps.length})</span>
          </div>
          <div className="p-4 space-y-2">
            {steps.map((step, i) => (
              <StepRow
                key={i}
                step={step}
                index={i}
                onScreenshotClick={ss => setModal('/api/screenshots/' + ss)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Screenshots */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-50 font-semibold text-slate-700">Screenshots</div>
        <div className="p-6">
          <ScreenshotViewer screenshots={screenshots} />
        </div>
      </div>

      {/* Video */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-50 font-semibold text-slate-700">Test Recording</div>
        <div className="p-6">
          <VideoPlayer src={videoSrc} />
        </div>
      </div>

      {/* Full-screen screenshot modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4"
          onClick={() => setModal(null)}
        >
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setModal(null)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={modal}
              alt="Screenshot"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}
