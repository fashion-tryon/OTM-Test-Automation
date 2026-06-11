import { useEffect, useState, useRef, useCallback } from 'react';

const INITIAL_STEPS = [
  { step: 1, name: 'Navigating to OTM',          status: 'pending' },
  { step: 2, name: 'Login page loaded',           status: 'pending' },
  { step: 3, name: 'Entering username',           status: 'pending' },
  { step: 4, name: 'Entering password',           status: 'pending' },
  { step: 5, name: 'Clicking Sign In',            status: 'pending' },
  { step: 6, name: 'Waiting for redirect',        status: 'pending' },
  { step: 7, name: 'Verifying OTM homepage',      status: 'pending' },
  { step: 8, name: 'Capturing homepage screenshot', status: 'pending' },
];

function mergeStep(steps, incoming) {
  return steps.map(s =>
    s.step === incoming.step ? { ...s, ...incoming } : s
  );
}

export default function useLiveStatus() {
  const [runStatus, setRunStatus] = useState('idle');   // idle | running | passed | failed
  const [steps,     setSteps]     = useState(INITIAL_STEPS);
  const [runId,     setRunId]     = useState(null);
  const [durationMs, setDurationMs] = useState(null);
  const esRef = useRef(null);

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();

    const es = new EventSource('/api/live');
    esRef.current = es;

    // Reconnect snapshot
    es.addEventListener('init', e => {
      try {
        const d = JSON.parse(e.data);
        setRunStatus(d.status || 'idle');
        setRunId(d.runId || null);
        if (d.steps && d.steps.length > 0) {
          setSteps(INITIAL_STEPS.map(s => {
            const found = d.steps.find(x => x.step === s.step);
            return found ? { ...s, ...found } : s;
          }));
        } else {
          setSteps(INITIAL_STEPS);
        }
      } catch (_) {}
    });

    // Run started — reset steps
    es.addEventListener('start', e => {
      try {
        const d = JSON.parse(e.data);
        setRunStatus('running');
        setRunId(d.runId);
        setSteps(INITIAL_STEPS);
        setDurationMs(null);
      } catch (_) {}
    });

    // Individual step update
    es.addEventListener('step', e => {
      try {
        const d = JSON.parse(e.data);
        setSteps(prev => mergeStep(prev, d));
      } catch (_) {}
    });

    // Run finished
    es.addEventListener('done', e => {
      try {
        const d = JSON.parse(e.data);
        setRunStatus(d.status);   // 'passed' | 'failed'
        setRunId(d.runId);
        setDurationMs(d.durationMs || null);
      } catch (_) {}
    });

    es.onerror = () => {
      es.close();
      setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => { if (esRef.current) esRef.current.close(); };
  }, [connect]);

  return { runStatus, steps, runId, durationMs };
}
