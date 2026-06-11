import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';

const LEFT_BORDER = {
  passed:  'border-l-4 border-l-emerald-400',
  failed:  'border-l-4 border-l-red-400',
  running: 'border-l-4 border-l-blue-400',
  skipped: 'border-l-4 border-l-slate-300',
};

export default function TestRow({ test }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate('/tests/' + test.id)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${LEFT_BORDER[test.status] || ''}`}
    >
      <StatusBadge status={test.status} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800 truncate">{test.test_name}</div>
        {test.suite_name && (
          <div className="text-xs text-slate-400 mt-0.5 truncate">{test.suite_name}</div>
        )}
      </div>

      {test.error_message && (
        <div className="hidden md:block text-xs text-red-500 truncate max-w-xs">
          {test.error_message}
        </div>
      )}

      <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
        <Clock className="w-3 h-3" />
        {test.duration_ms ? (test.duration_ms / 1000).toFixed(1) + 's' : '—'}
      </div>

      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
    </div>
  );
}
