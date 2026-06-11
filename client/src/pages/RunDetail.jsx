import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react';
import StatusBadge, { RegionBadge } from '../components/StatusBadge';
import TestRow from '../components/TestRow';

export default function RunDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [run,     setRun]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/runs/' + id)
      .then(r => r.json())
      .then(d => { setRun(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!run || run.error) {
    return <div className="text-center py-24 text-slate-400">Run not found</div>;
  }

  const tests   = run.tests || [];
  const pct     = run.total_tests > 0 ? Math.round(run.passed / run.total_tests * 100) : 0;
  const duration = run.duration_ms ? (run.duration_ms / 1000).toFixed(1) + 's' : '—';

  // Group tests by suite_name
  const suites = {};
  tests.forEach(t => {
    const key = t.suite_name || 'General';
    if (!suites[key]) suites[key] = [];
    suites[key].push(t);
  });

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
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Run #{run.id}</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date(run.started_at).toLocaleString()}
            {run.finished_at && (
              <> &rarr; {new Date(run.finished_at).toLocaleTimeString()}</>
            )}
          </p>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-5">
          {[
            { label: 'Status',      value: <StatusBadge status={run.status} /> },
            { label: 'Region',      value: run.region ? <RegionBadge region={run.region} label={run.region_label} size="md" /> : <span className="text-sm text-slate-400">—</span> },
            { label: 'Environment', value: <span className="text-sm font-semibold text-slate-700">{run.environment}</span> },
            { label: 'Duration',    value: <span className="text-sm font-semibold text-slate-700">{duration}</span> },
            { label: 'Pass Rate',   value: <span className="text-sm font-bold text-emerald-600">{pct}%</span> },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{label}</div>
              {value}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-2 flex justify-between text-xs text-slate-500">
          <span>
            <span className="text-emerald-600 font-semibold">{run.passed}</span> passed &middot;&nbsp;
            <span className="text-red-500 font-semibold">{run.failed}</span> failed &middot;&nbsp;
            {run.skipped || 0} skipped
          </span>
          <span>{run.total_tests} total</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          {run.total_tests > 0 && (
            <>
              <div
                className="h-full bg-emerald-400 float-left rounded-l-full"
                style={{ width: (run.passed / run.total_tests * 100) + '%' }}
              />
              <div
                className="h-full bg-red-400 float-left"
                style={{ width: (run.failed / run.total_tests * 100) + '%' }}
              />
            </>
          )}
        </div>
        <div style={{ clear: 'both' }} />

        <div className="mt-4">
          <a
            href="/report"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Allure Report
          </a>
        </div>
      </div>

      {/* Tests grouped by suite */}
      {tests.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-100 shadow-sm">
          No test results recorded for this run
        </div>
      ) : (
        Object.entries(suites).map(([suiteName, suiteTests]) => (
          <div key={suiteName} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/50">
              <div className="font-semibold text-slate-700">{suiteName}</div>
              <div className="text-xs text-slate-400">{suiteTests.length} test{suiteTests.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="p-3 space-y-1">
              {suiteTests.map(t => <TestRow key={t.id} test={t} />)}
            </div>
          </div>
        ))
      )}

    </div>
  );
}
