import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { RegionBadge } from '../components/StatusBadge';
import StatusBadge from '../components/StatusBadge';

const PRIORITY_STYLES = {
  high:   'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-slate-100 text-slate-500 border-slate-200',
};

const REGION_META = {
  'north-america': { flag: '🇺🇸' },
  'poland':        { flag: '🇵🇱' },
  'turkey':        { flag: '🇹🇷' },
  'germany':       { flag: '🇩🇪' },
  'brazil':        { flag: '🇧🇷' },
};

export default function TestCaseDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [tc,      setTc]      = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/registry/cases/' + id).then(r => r.json()),
      fetch('/api/runs').then(r => r.json()),
    ]).then(([tcData, runs]) => {
      setTc(tcData);
      // Find runs matching this test's name from test_results
      // We'll use the last 5 runs for the region
      const regionRuns = runs
        .filter(r => r.region === tcData.region)
        .slice(0, 5);
      setHistory(regionRuns);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-24"><RefreshCw className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  if (!tc || tc.error) return <div className="text-center py-24 text-slate-400">Test case not found</div>;

  const steps    = Array.isArray(tc.steps) ? tc.steps : [];
  const meta     = REGION_META[tc.region] || { flag: '🌐' };
  const priStyle = PRIORITY_STYLES[tc.priority] || PRIORITY_STYLES.medium;

  return (
    <div className="space-y-6">

      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/registry/' + tc.region)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800">{tc.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <RegionBadge region={tc.region} label={meta.flag + ' ' + tc.region} />
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priStyle}`}>
              {tc.priority} priority
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tc.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
              {tc.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Overview card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="font-semibold text-slate-700 mb-3">Overview</div>
        <p className="text-slate-600 text-sm leading-relaxed">
          {tc.description || <span className="italic text-slate-400">No description provided</span>}
        </p>
        <div className="flex gap-4 mt-4 text-xs text-slate-400">
          <span>Created: {new Date(tc.created_at).toLocaleDateString()}</span>
          <span>Updated: {new Date(tc.updated_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Preconditions */}
      {tc.preconditions && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-50 font-semibold text-slate-700">Preconditions</div>
          <div className="px-6 py-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 leading-relaxed">{tc.preconditions}</p>
            </div>
          </div>
        </div>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-50 font-semibold text-slate-700">
            Test Steps <span className="text-slate-400 font-normal text-sm">({steps.length})</span>
          </div>
          <div className="p-4 space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700 leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expected result */}
      {tc.expected_result && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-50 font-semibold text-slate-700">Expected Result</div>
          <div className="px-6 py-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 leading-relaxed">{tc.expected_result}</p>
            </div>
          </div>
        </div>
      )}

      {/* Execution history */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-50 font-semibold text-slate-700">
          Recent Runs for This Region
        </div>
        {history.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">
            No runs yet for {tc.region}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {history.map(run => (
              <div
                key={run.id}
                onClick={() => navigate('/runs/' + run.id)}
                className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <StatusBadge status={run.status} size="sm" />
                <div className="flex-1 text-sm text-slate-600">Run #{run.id}</div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {new Date(run.started_at).toLocaleString()}
                </div>
                {run.duration_ms > 0 && (
                  <div className="text-xs text-slate-400">{(run.duration_ms / 1000).toFixed(1)}s</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
