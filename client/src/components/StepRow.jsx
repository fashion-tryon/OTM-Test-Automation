import React from 'react';
import { CheckCircle2, XCircle, Clock, Camera } from 'lucide-react';

const STATUS_ICON = {
  passed: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
  pass:   <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
  failed: <XCircle      className="w-4 h-4 text-red-500 shrink-0"     />,
  fail:   <XCircle      className="w-4 h-4 text-red-500 shrink-0"     />,
};

const ROW_BG = {
  passed: 'bg-emerald-50/60 border-emerald-100',
  pass:   'bg-emerald-50/60 border-emerald-100',
  failed: 'bg-red-50 border-red-100',
  fail:   'bg-red-50 border-red-100',
};

export default function StepRow({ step, index, onScreenshotClick }) {
  const icon = STATUS_ICON[step.status] || (
    <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
  );
  const bg = ROW_BG[step.status] || 'bg-slate-50/60 border-slate-100';

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bg}`}>
      <span className="text-xs font-mono text-slate-400 w-5 text-right shrink-0">
        {index + 1}
      </span>

      {icon}

      <div className="flex-1 text-sm font-medium text-slate-700 min-w-0">
        {step.name || step.step || 'Step ' + (index + 1)}
      </div>

      {step.duration_ms != null && (
        <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
          <Clock className="w-3 h-3" />
          {step.duration_ms}ms
        </div>
      )}

      {step.screenshot && (
        <button
          onClick={e => { e.stopPropagation(); onScreenshotClick && onScreenshotClick(step.screenshot); }}
          className="shrink-0 p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
          title="View screenshot"
        >
          <Camera className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </div>
  );
}
