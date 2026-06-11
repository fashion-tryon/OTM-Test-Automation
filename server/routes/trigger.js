'use strict';
const { exec }  = require('child_process');
const path      = require('path');
const fs        = require('fs');
const { createRun, updateRun, getTestsByRunId } = require('../db');

const ROOT = path.join(__dirname, '..', '..');

function loadRegions() {
  try {
    const f = path.join(ROOT, 'regions.json');
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
    if (process.env.REGIONS_JSON) return JSON.parse(process.env.REGIONS_JSON);
  } catch (_) {}
  return {};
}

// ── Shared live state ─────────────────────────────────────────────────────
const live = {
  status:  'idle',
  runId:   null,
  steps:   [],
  clients: new Set(),
};

function broadcastEvent(eventName, data) {
  const msg = 'event: ' + eventName + '\ndata: ' + JSON.stringify(data) + '\n\n';
  live.clients.forEach(c => {
    try { c.write(msg); } catch (_) { live.clients.delete(c); }
  });
}

function json(res, data, status) {
  res.writeHead(status || 200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ── Handler ───────────────────────────────────────────────────────────────
function handleTrigger(req, res, upath) {

  if (req.method === 'GET' && upath === '/api/status') {
    json(res, { status: live.status, runId: live.runId });
    return true;
  }

  if (req.method === 'GET' && upath === '/api/live') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    });
    res.write('event: init\ndata: ' + JSON.stringify({
      status: live.status,
      runId:  live.runId,
      steps:  live.steps,
    }) + '\n\n');
    live.clients.add(res);
    req.on('close', () => live.clients.delete(res));
    return true;
  }

  if (req.method === 'POST' && upath === '/api/trigger') {
    if (live.status === 'running') {
      json(res, { error: 'A run is already in progress' }, 409);
      return true;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let payload = {};
      try { payload = JSON.parse(body); } catch (_) {}

      const suite      = payload.suite      || 'login';
      const regionKey  = payload.region     || 'north-america';

      // Load region credentials
      const regions     = loadRegions();
      const regionCfg   = regions[regionKey] || {};
      const regionLabel = regionCfg.label || regionKey;

      const runId    = createRun('manual', 'test', regionKey, regionLabel);
      const runStart = Date.now();
      live.status    = 'running';
      live.runId     = runId;
      live.steps     = [];

      broadcastEvent('start', { runId, status: 'running', region: regionKey, regionLabel });

      const cmd = suite === 'all'
        ? 'npm run test:all && npm run report'
        : 'npm run test:login && npm run report';

      const child = exec(cmd, {
        cwd:       ROOT,
        maxBuffer: 20 * 1024 * 1024,
        env: {
          ...process.env,
          OTM_RUN_ID:       String(runId),
          OTM_USERNAME:     regionCfg.username || '',
          OTM_PASSWORD:     regionCfg.password || '',
          OTM_DOMAIN:       regionCfg.domain   || '',
          OTM_REGION:       regionKey,
          OTM_REGION_LABEL: regionLabel,
        },
      });

      child.on('error', err => {
        broadcastEvent('error', { message: err.message });
      });

      let stdoutBuf = '';
      child.stdout.on('data', chunk => {
        stdoutBuf += chunk.toString();
        const lines = stdoutBuf.split('\n');
        stdoutBuf = lines.pop(); // hold incomplete tail
        lines.forEach(line => {
          if (!line.trim()) return;
          try {
            const obj = JSON.parse(line);
            if (obj.type === 'step') {
              const idx = live.steps.findIndex(s => s.step === obj.step);
              if (idx >= 0) live.steps[idx] = obj;
              else live.steps.push(obj);
              broadcastEvent('step', obj);
              return;
            }
          } catch (_) {}
          // Non-JSON lines silently ignored
        });
      });

      child.stderr.on('data', () => {});

      child.on('close', code => {
        const status     = code === 0 ? 'passed' : 'failed';
        const durationMs = Date.now() - runStart;
        live.status      = 'idle';

        const tests  = getTestsByRunId(runId);
        const passed = tests.filter(t => t.status === 'passed').length;
        const failed = tests.filter(t => t.status === 'failed').length;

        updateRun(runId, {
          status,
          finished_at: new Date().toISOString(),
          duration_ms: durationMs,
          total_tests: tests.length || 1,
          passed:      tests.length ? passed : (code === 0 ? 1 : 0),
          failed:      tests.length ? failed : (code === 0 ? 0 : 1),
        });

        broadcastEvent('done', { status, runId, durationMs });
      });

      json(res, { runId, status: 'started' });
    });
    return true;
  }

  return false;
}

module.exports = handleTrigger;
