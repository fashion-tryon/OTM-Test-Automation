import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ChevronRight, ClipboardList } from 'lucide-react';
import StatusBadge, { RegionBadge } from '../components/StatusBadge';

const STATUS_FILTERS = ['all', 'passed', 'failed', 'running'];

export default function RunHistory() {
  const [runs,          setRuns]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [regionFilter,  setRegionFilter]  = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/runs')
      .then(r => r.json())
      .then(d => { setRuns(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Build unique region list from runs
  const regionOptions = [
    { key: 'all', label: 'All Regions' },
    ...Array.from(
      new Map(runs.filter(r => r.region).map(r => [r.region, r.region_label])).entries()
    ).map(([key, label]) => ({ key, label })),
  ];

  const filtered = runs.filter(r => {
    const statusOk = statusFilter === 'all' || r.status === statusFilter;
    const regionOk = regionFilter === 'all' || r.region === regionFilter;
    return statusOk && regionOk;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header + filters */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Run History</h1>
          <p className="text-slate-400 text-sm mt-0.5">{runs.length} total runs</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Region filter */}
          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          >
            {regionOptions.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Status filter */}
          <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm p-1 gap-0.5">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  statusFilter === f
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
            <div className="text-sm">No runs match the current filters</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Run #', 'Status', 'Region', 'Suite', 'Tests', 'Passed', 'Failed', 'Duration', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(run => (
                  <tr
                    key={run.id}
                    onClick={() => navigate('/runs/' + run.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-700 text-sm">#{run.id}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(run.started_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={run.status} size="sm" /></td>
                    <td className="px-4 py-3">
                      {run.region
                        ? <RegionBadge region={run.region} label={run.region_label} />
                        : <span className="text-xs text-slate-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 capitalize">{run.trigger_type}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{run.total_tests}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-emerald-600">{run.passed}</span>
                    </td>
                    <td className="px-4 py-3">
                      {run.failed > 0
                        ? <span className="text-sm font-semibold text-red-500">{run.failed}</span>
                        : <span className="text-sm text-slate-300">0</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                      {run.duration_ms ? (run.duration_ms / 1000).toFixed(1) + 's' : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
