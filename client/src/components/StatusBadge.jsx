import React from 'react';

const STATUS_STYLES = {
  passed:  { wrap: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Passed'  },
  failed:  { wrap: 'bg-red-100 text-red-700',         dot: 'bg-red-500',     label: 'Failed'  },
  running: { wrap: 'bg-blue-100 text-blue-700',        dot: 'bg-blue-500',    label: 'Running', pulse: true },
  skipped: { wrap: 'bg-slate-100 text-slate-500',      dot: 'bg-slate-400',   label: 'Skipped' },
  idle:    { wrap: 'bg-slate-100 text-slate-500',      dot: 'bg-slate-400',   label: 'Idle'    },
};

export default function StatusBadge({ status, size = 'md' }) {
  const s   = STATUS_STYLES[status] || STATUS_STYLES.idle;
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${s.wrap} ${pad}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
}

// Region colour map
const REGION_STYLES = {
  'north-america': { wrap: 'bg-blue-100 text-blue-700',    flag: '🇺🇸' },
  'poland':        { wrap: 'bg-red-100 text-red-700',      flag: '🇵🇱' },
  'turkey':        { wrap: 'bg-orange-100 text-orange-700', flag: '🇹🇷' },
  'germany':       { wrap: 'bg-slate-200 text-slate-700',  flag: '🇩🇪' },
  'brazil':        { wrap: 'bg-green-100 text-green-700',  flag: '🇧🇷' },
};

export function RegionBadge({ region, label, size = 'sm' }) {
  const s   = REGION_STYLES[region] || { wrap: 'bg-slate-100 text-slate-500', flag: '🌐' };
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${s.wrap} ${pad}`}>
      <span>{s.flag}</span>
      {label || region}
    </span>
  );
}
