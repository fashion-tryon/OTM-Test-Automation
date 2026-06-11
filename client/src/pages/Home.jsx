import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, RefreshCw, TrendingUp, Clock,
  CheckCircle, XCircle, Activity, X,
  CheckCircle2, AlertCircle, ExternalLink,
} from 'lucide-react';
import StatusBadge, { RegionBadge } from '../components/StatusBadge';
import PassRateChart from '../components/PassRateChart';
import useLiveStatus from '../hooks/useLiveStatus';

// ── Metric card ───────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, colorBg, colorText, Icon }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</div>
          <div className="text-sm font-semibold text-slate-500 mt-1">{label}</div>
          {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${colorBg}`}>
          <Icon className={`w-5 h-5 ${colorText}`} />
        </div>
      </div>
    </div>
  );
}

// ── Step row ──────────────────────────────────────────────────────────────
function StepItem({ step }) {
  const isRunning = step.status === 'running';
  const isPass    = step.status === 'pass' || step.status === 'passed';
  const isFail    = step.status === 'fail' || step.status === 'failed';
  const isPending = step.status === 'pending';

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-all ${
      isRunning ? 'bg-blue-50 border border-blue-100' :
      isPass    ? 'bg-emerald-50/60 border border-emerald-100' :
      isFail    ? 'bg-red-50 border border-red-100' :
                  'bg-slate-50/0 border border-transparent'
    }`}>
      {/* Icon */}
      <div className="shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center">
        {isRunning && (
          <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        )}
        {isPass && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        {isFail  && <AlertCircle  className="w-5 h-5 text-red-500" />}
        {isPending && <div className="w-3 h-3 rounded-full border-2 border-slate-300" />}
      </div>

      {/* Label + error */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${
          isRunning ? 'text-blue-700' :
          isPass    ? 'text-emerald-700' :
          isFail    ? 'text-red-700' :
                      'text-slate-400'
        }`}>
          {step.name}
          {isRunning && <span className="ml-1 opacity-60">…</span>}
        </div>
        {isFail && step.error && (
          <div className="text-xs text-red-500 mt-0.5 font-mono break-words">
            {step.error.length > 120 ? step.error.slice(0, 120) + '…' : step.error}
          </div>
        )}
      </div>

      {/* Duration */}
      {(isPass || isFail) && step.duration_ms != null && (
        <div className="text-xs text-slate-400 shrink-0 mt-0.5">
          {(step.duration_ms / 1000).toFixed(1)}s
        </div>
      )}
    </div>
  );
}

// ── Step progress panel ───────────────────────────────────────────────────
function StepProgressPanel({ steps, runStatus, runId, durationMs }) {
  const navigate   = useNavigate();
  const isRunning  = runStatus === 'running';
  const isDone     = runStatus === 'passed' || runStatus === 'failed';
  const passed     = steps.filter(s => s.status === 'pass' || s.status === 'passed').length;
  const failed     = steps.filter(s => s.status === 'fail' || s.status === 'failed').length;
  const completed  = passed + failed;
  const total      = steps.length;
  const pct        = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          {isRunning && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
          {runStatus === 'passed' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          {runStatus === 'failed' && <span className="w-2 h-2 rounded-full bg-red-500" />}
          <span className="font-semibold text-slate-700 text-sm">
            {isRunning ? 'Live Test Progress' : isDone ? 'Test Run Complete' : 'Test Steps'}
          </span>
          {runId && <span className="text-xs text-slate-400">Run #{runId}</span>}
        </div>
        {isDone && durationMs && (
          <span className="text-xs text-slate-400">
            {(durationMs / 1000).toFixed(1)}s total
          </span>
        )}
      </div>

      {/* Steps */}
      <div className="p-3 space-y-1">
        {steps.map(s => <StepItem key={s.step} step={s} />)}
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3 pt-1">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>{completed} of {total} steps</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              failed > 0 ? 'bg-red-400' : 'bg-emerald-400'
            }`}
            style={{ width: pct + '%' }}
          />
        </div>
      </div>

      {/* Done banner */}
      {isDone && (
        <div className={`mx-3 mb-3 px-4 py-3 rounded-xl flex items-center justify-between ${
          runStatus === 'passed'
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {runStatus === 'passed'
              ? <CheckCircle className="w-5 h-5 text-emerald-600" />
              : <AlertCircle  className="w-5 h-5 text-red-600" />
            }
            <span className={`text-sm font-semibold ${
              runStatus === 'passed' ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {runStatus === 'passed' ? 'All steps passed' : 'Run failed'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/report"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Allure Report
            </a>
            {runId && (
              <button
                onClick={() => navigate('/runs/' + runId)}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors ml-2"
              >
                View Details →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [runs,      setRuns]      = useState([]);
  const [trend,     setTrend]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [suite,     setSuite]     = useState('');
  const [region,    setRegion]    = useState('north-america');
  const [regions,   setRegions]   = useState({});
  const [suites,    setSuites]    = useState([]);
  const env = 'test';
  const navigate = useNavigate();

  const { runStatus, steps, runId, durationMs } = useLiveStatus();

  useEffect(() => {
    fetchData();
    fetch('/api/regions').then(r => r.json()).then(d => setRegions(d)).catch(() => {});
  }, []);

  useEffect(() => {
    setSuites([]);
    setSuite('');
    fetch('/api/registry/' + region + '/suites')
      .then(r => r.json())
      .then(d => {
        const active = (Array.isArray(d) ? d : []).filter(s => s.is_active);
        setSuites(active);
        if (active.length > 0) setSuite(String(active[0].id));
      })
      .catch(() => {});
  }, [region]);

  // Refresh run list after a run finishes
  useEffect(() => {
    if (runStatus === 'passed' || runStatus === 'failed') {
      setTimeout(fetchData, 1000);
    }
  }, [runStatus]);

  async function fetchData() {
    try {
      const [r1, r2] = await Promise.all([fetch('/api/runs'), fetch('/api/trend')]);
      setRuns(await r1.json());
      setTrend(await r2.json());
    } catch (_) {}
    setLoading(false);
  }

  async function triggerRun() {
    setShowModal(false);
    try {
      await fetch('/api/trigger', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ suite, region, environment: env }),
      });
    } catch (_) {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const last5     = runs.slice(0, 5);
  const completed = runs.filter(r => r.status === 'passed' || r.status === 'failed');
  const passRate  = completed.length
    ? Math.round(runs.filter(r => r.status === 'passed').length / completed.length * 100)
    : 0;
  const lastRun  = runs[0];
  const durations = runs.filter(r => r.duration_ms > 0);
  const avgSec    = durations.length
    ? (durations.reduce((s, r) => s + r.duration_ms, 0) / durations.length / 1000).toFixed(0)
    : null;

  const showProgress = runStatus === 'running' ||
    runStatus === 'passed' || runStatus === 'failed';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">OTM Sanity Test Automation</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={runStatus === 'running'}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {runStatus === 'running'
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Running…</>
            : <><Play className="w-4 h-4" /> Run Tests</>}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Runs"        value={runs.length}
          Icon={Activity}   colorBg="bg-blue-50"    colorText="text-blue-600" />
        <MetricCard label="Pass Rate"         value={passRate + '%'}  sub={completed.length + ' completed'}
          Icon={TrendingUp} colorBg="bg-emerald-50" colorText="text-emerald-600" />
        <MetricCard
          label="Last Run"
          value={lastRun ? (lastRun.status.charAt(0).toUpperCase() + lastRun.status.slice(1)) : 'None'}
          sub={lastRun ? new Date(lastRun.started_at).toLocaleDateString() : '—'}
          Icon={lastRun?.status === 'passed' ? CheckCircle : XCircle}
          colorBg={lastRun?.status === 'passed' ? 'bg-emerald-50' : 'bg-red-50'}
          colorText={lastRun?.status === 'passed' ? 'text-emerald-600' : 'text-red-500'}
        />
        <MetricCard label="Avg Duration"      value={avgSec ? avgSec + 's' : '—'}
          Icon={Clock}      colorBg="bg-purple-50"  colorText="text-purple-600" />
      </div>

      {/* Pass rate chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="font-semibold text-slate-700 mb-5">Pass Rate Trend</div>
        <PassRateChart data={trend} />
      </div>

      {/* Step progress panel */}
      {showProgress && (
        <StepProgressPanel
          steps={steps}
          runStatus={runStatus}
          runId={runId}
          durationMs={durationMs}
        />
      )}

      {/* Recent runs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <div className="font-semibold text-slate-700">Recent Runs</div>
          <button
            onClick={() => navigate('/runs')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all →
          </button>
        </div>
        {last5.length === 0 ? (
          <div className="text-center py-14 text-slate-400">
            <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
            No runs yet — click <strong className="text-slate-500">Run Tests</strong> to start
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {last5.map(run => (
              <div
                key={run.id}
                onClick={() => navigate('/runs/' + run.id)}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <StatusBadge status={run.status} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700">
                    Run #{run.id} &mdash; {run.environment}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-400">{new Date(run.started_at).toLocaleString()}</span>
                    {run.region && <RegionBadge region={run.region} label={run.region_label} />}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-emerald-600">{run.passed} pass</div>
                  {run.failed > 0 && <div className="text-xs text-red-500">{run.failed} fail</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Run modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="font-bold text-lg text-slate-800">Run Tests</div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">

              {/* Region selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Region</label>
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(regions).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                  {Object.keys(regions).length === 0 && (
                    <option value="north-america">North America</option>
                  )}
                </select>
              </div>

              {/* Suite selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Test Suite</label>
                {suites.length === 0 ? (
                  <div className="text-sm text-slate-400 italic py-2">No active suites for this region</div>
                ) : (
                  <select
                    value={suite}
                    onChange={e => setSuite(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {suites.map(s => (
                      <option key={s.id} value={String(s.id)}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600">
                <span className="font-semibold text-slate-700">Environment:</span> Test
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={triggerRun}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
              >
                <Play className="w-4 h-4" /> Run Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
