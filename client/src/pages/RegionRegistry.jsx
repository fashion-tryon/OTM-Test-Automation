import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Plus, ChevronDown, ChevronRight,
  Edit2, Trash2, Eye, ToggleLeft, ToggleRight, FlaskConical, Play,
} from 'lucide-react';
import { RegionBadge } from '../components/StatusBadge';

const PRIORITY_STYLES = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-slate-100 text-slate-500',
};

const REGION_META = {
  'north-america': { flag: '🇺🇸', label: 'North America' },
  'poland':        { flag: '🇵🇱', label: 'Europe - Poland' },
  'turkey':        { flag: '🇹🇷', label: 'Europe - Turkey' },
  'germany':       { flag: '🇩🇪', label: 'Europe - Germany' },
  'brazil':        { flag: '🇧🇷', label: 'South America - Brazil' },
};

// ── Small modal ────────────────────────────────────────────────────────────
function Modal({ title, onClose, onSave, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="font-bold text-slate-800">{title}</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={onSave}  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const INPUT  = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const TEXTAREA = INPUT + " resize-none";

// ── Suite modal ────────────────────────────────────────────────────────────
function SuiteModal({ suite, onClose, onSave }) {
  const [name, setName]     = useState(suite?.name || '');
  const [desc, setDesc]     = useState(suite?.description || '');
  return (
    <Modal title={suite ? 'Edit Suite' : 'Add Suite'} onClose={onClose} onSave={() => onSave({ name, description: desc })}>
      <Field label="Suite Name *"><input className={INPUT} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Order Management" /></Field>
      <Field label="Description"><textarea className={TEXTAREA} rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does this suite cover?" /></Field>
    </Modal>
  );
}

// ── Test Case modal ────────────────────────────────────────────────────────
function CaseModal({ tc, onClose, onSave }) {
  const [name,     setName]     = useState(tc?.name || '');
  const [desc,     setDesc]     = useState(tc?.description || '');
  const [priority, setPriority] = useState(tc?.priority || 'medium');
  const [pre,      setPre]      = useState(tc?.preconditions || '');
  const [steps,    setSteps]    = useState(Array.isArray(tc?.steps) ? tc.steps : (tc?.steps ? [] : ['']));
  const [exp,      setExp]      = useState(tc?.expected_result || '');

  const addStep    = () => setSteps(s => [...s, '']);
  const removeStep = i  => setSteps(s => s.filter((_, j) => j !== i));
  const setStep    = (i, v) => setSteps(s => s.map((x, j) => j === i ? v : x));

  return (
    <Modal title={tc ? 'Edit Test Case' : 'Add Test Case'} onClose={onClose}
      onSave={() => onSave({ name, description: desc, priority, preconditions: pre, steps: steps.filter(s => s.trim()), expected_result: exp })}>
      <Field label="Test Case Name *"><input className={INPUT} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Create Order" /></Field>
      <Field label="Description"><textarea className={TEXTAREA} rows={2} value={desc} onChange={e => setDesc(e.target.value)} /></Field>
      <Field label="Priority">
        <select className={INPUT} value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </Field>
      <Field label="Preconditions"><textarea className={TEXTAREA} rows={2} value={pre} onChange={e => setPre(e.target.value)} placeholder="What must be true before this test runs?" /></Field>
      <Field label="Steps">
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-slate-400 w-5 text-right shrink-0">{i + 1}.</span>
              <input className={INPUT + ' flex-1'} value={s} onChange={e => setStep(i, e.target.value)} placeholder={'Step ' + (i + 1)} />
              <button onClick={() => removeStep(i)} className="text-slate-300 hover:text-red-400 shrink-0"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={addStep} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mt-1">
            <Plus className="w-4 h-4" /> Add Step
          </button>
        </div>
      </Field>
      <Field label="Expected Result"><textarea className={TEXTAREA} rows={2} value={exp} onChange={e => setExp(e.target.value)} placeholder="What should happen when the test passes?" /></Field>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function RegionRegistry() {
  const { region }      = useParams();
  const navigate        = useNavigate();
  const meta            = REGION_META[region] || { flag: '🌐', label: region };

  const [suites,     setSuites]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState({});
  const [cases,      setCases]      = useState({});  // suiteId → []

  // Modals
  const [suiteModal,   setSuiteModal]   = useState(null);  // null | 'add' | suite obj
  const [caseModal,    setCaseModal]    = useState(null);  // null | { suiteId, tc? }
  const [confirmDel,   setConfirmDel]   = useState(null);  // null | { type, id, label }
  const [runModal,     setRunModal]     = useState(null);  // null | { tc, suiteName }

  const fetchSuites = useCallback(() => {
    fetch('/api/registry/' + region + '/suites')
      .then(r => r.json())
      .then(d => { setSuites(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [region]);

  useEffect(() => { fetchSuites(); }, [fetchSuites]);

  const fetchCases = (suiteId) => {
    fetch('/api/registry/suites/' + suiteId + '/cases')
      .then(r => r.json())
      .then(d => setCases(prev => ({ ...prev, [suiteId]: d })));
  };

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id] && !cases[id]) fetchCases(id);
      return next;
    });
  };

  // Suite CRUD
  const saveSuite = async (data) => {
    if (suiteModal === 'add') {
      await fetch('/api/registry/' + region + '/suites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } else {
      await fetch('/api/registry/suites/' + suiteModal.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }
    setSuiteModal(null);
    fetchSuites();
  };

  const deleteSuite = async (id) => {
    await fetch('/api/registry/suites/' + id, { method: 'DELETE' });
    setConfirmDel(null);
    fetchSuites();
  };

  // Case CRUD
  const saveCase = async (data) => {
    const { suiteId, tc } = caseModal;
    if (tc) {
      await fetch('/api/registry/cases/' + tc.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } else {
      await fetch('/api/registry/suites/' + suiteId + '/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, region }) });
    }
    setCaseModal(null);
    fetchCases(suiteId);
  };

  const deleteCase = async (id, suiteId) => {
    await fetch('/api/registry/cases/' + id, { method: 'DELETE' });
    setConfirmDel(null);
    fetchCases(suiteId);
  };

  const toggleCase = async (tc) => {
    await fetch('/api/registry/cases/' + tc.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: tc.is_active ? 0 : 1 }) });
    fetchCases(tc.suite_id);
  };

  const triggerTestCase = async (tc, suiteName) => {
    setRunModal(null);
    await fetch('/api/trigger', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ suite: 'login', region, testCase: tc.name }),
    });
    navigate('/');
  };

  if (loading) return <div className="flex justify-center py-24"><RefreshCw className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/registry')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{meta.flag} {meta.label}</h1>
            <RegionBadge region={region} label={meta.label} />
          </div>
          <p className="text-slate-400 text-sm mt-0.5">{suites.length} suites &middot; {suites.reduce((s, x) => s + x.case_count, 0)} test cases</p>
        </div>
        <button
          onClick={() => setSuiteModal('add')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Suite
        </button>
      </div>

      {/* Suite list */}
      {suites.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 text-slate-400">
          <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
          No suites yet — click Add Suite to create one
        </div>
      ) : (
        <div className="space-y-3">
          {suites.map(suite => {
            const open     = !!expanded[suite.id];
            const suiteCases = cases[suite.id] || [];

            return (
              <div key={suite.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                {/* Suite header */}
                <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleExpand(suite.id)}>
                  {open
                    ? <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    : <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800">{suite.name}</div>
                    {suite.description && <div className="text-xs text-slate-400 mt-0.5 truncate">{suite.description}</div>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400">{suite.case_count} cases</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${suite.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {suite.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={e => { e.stopPropagation(); setSuiteModal(suite); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setConfirmDel({ type: 'suite', id: suite.id, label: suite.name, suiteId: suite.id }); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Test cases */}
                {open && (
                  <div className="border-t border-slate-50">
                    {suiteCases.length === 0 ? (
                      <div className="px-5 py-6 text-sm text-slate-400 text-center">No test cases yet</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {suiteCases.map(tc => (
                          <div key={tc.id} className={`flex items-center gap-3 px-5 py-3 transition-colors ${tc.is_active ? '' : 'opacity-50'}`}>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[tc.priority] || PRIORITY_STYLES.medium}`}>
                              {tc.priority}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-800">{tc.name}</div>
                              {tc.description && <div className="text-xs text-slate-400 mt-0.5 truncate">{tc.description}</div>}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => setRunModal({ tc, suiteName: suite.name })}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 text-xs font-semibold transition-colors"
                                title="Run this test"
                              >
                                <Play className="w-3 h-3" /> Run
                              </button>
                              <button onClick={() => navigate('/registry/cases/' + tc.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="View">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setCaseModal({ suiteId: suite.id, tc })} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Edit">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => toggleCase(tc)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-500" title={tc.is_active ? 'Deactivate' : 'Activate'}>
                                {tc.is_active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                              </button>
                              <button onClick={() => setConfirmDel({ type: 'case', id: tc.id, label: tc.name, suiteId: suite.id })} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="px-5 py-3 border-t border-slate-50">
                      <button
                        onClick={() => setCaseModal({ suiteId: suite.id })}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Plus className="w-4 h-4" /> Add Test Case
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Suite modal */}
      {suiteModal && (
        <SuiteModal
          suite={suiteModal === 'add' ? null : suiteModal}
          onClose={() => setSuiteModal(null)}
          onSave={saveSuite}
        />
      )}

      {/* Case modal */}
      {caseModal && (
        <CaseModal
          tc={caseModal.tc || null}
          onClose={() => setCaseModal(null)}
          onSave={saveCase}
        />
      )}

      {/* Run test case confirmation */}
      {runModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="font-bold text-slate-800 mb-4">Run Test Case</div>
            <div className="space-y-2 mb-5 text-sm">
              <div className="flex gap-2">
                <span className="text-slate-400 w-16 shrink-0">Test</span>
                <span className="font-semibold text-slate-800">{runModal.tc.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-16 shrink-0">Suite</span>
                <span className="text-slate-600">{runModal.suiteName}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-slate-400 w-16 shrink-0">Region</span>
                <span className="text-slate-600">{meta.flag} {meta.label}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRunModal(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => triggerTestCase(runModal.tc, runModal.suiteName)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> Run Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="font-bold text-slate-800 mb-2">Delete {confirmDel.type === 'suite' ? 'Suite' : 'Test Case'}?</div>
            <p className="text-sm text-slate-500 mb-5">
              <strong className="text-slate-700">{confirmDel.label}</strong> will be permanently deleted.
              {confirmDel.type === 'suite' && ' All test cases inside will also be deleted.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button
                onClick={() => confirmDel.type === 'suite' ? deleteSuite(confirmDel.id) : deleteCase(confirmDel.id, confirmDel.suiteId)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
