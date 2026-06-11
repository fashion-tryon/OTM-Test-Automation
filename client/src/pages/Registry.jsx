import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, FlaskConical, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

const REGION_META = {
  'north-america': { flag: '🇺🇸', color: 'from-blue-600 to-blue-700',    ring: 'ring-blue-200' },
  'poland':        { flag: '🇵🇱', color: 'from-red-600 to-red-700',       ring: 'ring-red-200'  },
  'turkey':        { flag: '🇹🇷', color: 'from-orange-500 to-red-600',    ring: 'ring-orange-200' },
  'germany':       { flag: '🇩🇪', color: 'from-slate-700 to-slate-800',   ring: 'ring-slate-200' },
  'brazil':        { flag: '🇧🇷', color: 'from-green-600 to-emerald-700', ring: 'ring-green-200' },
};

export default function Registry() {
  const [regions,  setRegions]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/registry/regions')
      .then(r => r.json())
      .then(d => { setRegions(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const totalSuites = regions.reduce((s, r) => s + r.suite_count, 0);
  const totalCases  = regions.reduce((s, r) => s + r.total_cases, 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Test Case Registry</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {totalSuites} suites &middot; {totalCases} test cases across {regions.length} regions
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-sm">
          <FlaskConical className="w-4 h-4 text-blue-500" />
          <span className="text-blue-700 font-medium">All Regions</span>
        </div>
      </div>

      {/* Region cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {regions.map(region => {
          const meta     = REGION_META[region.key] || { flag: '🌐', color: 'from-slate-500 to-slate-600', ring: 'ring-slate-200' };
          const inactive = region.total_cases - region.active_cases;

          return (
            <div
              key={region.key}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate('/registry/' + region.key)}
            >
              {/* Gradient header */}
              <div className={`bg-gradient-to-r ${meta.color} px-5 py-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-white/15 ring-2 ${meta.ring} flex items-center justify-center text-xl`}>
                      {meta.flag}
                    </div>
                    <div>
                      <div className="text-white font-bold text-base leading-tight">{region.label}</div>
                      <div className="text-white/60 text-xs mt-0.5">{region.key}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
                </div>
              </div>

              {/* Stats */}
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-extrabold text-slate-800">{region.suite_count}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Suites</div>
                  </div>
                  <div className="text-center border-x border-slate-100">
                    <div className="text-2xl font-extrabold text-slate-800">{region.total_cases}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Test Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-extrabold text-emerald-600">{region.active_cases}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Active</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {region.active_cases} active
                    </span>
                    {inactive > 0 && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <XCircle className="w-3.5 h-3.5" /> {inactive} inactive
                      </span>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); navigate('/registry/' + region.key); }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View Test Cases →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
