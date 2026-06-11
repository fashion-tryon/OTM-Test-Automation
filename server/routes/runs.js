'use strict';
const { getRuns, getRunById, getTestsByRunId, getPassRateTrend } = require('../db');

function json(res, data, status) {
  res.writeHead(status || 200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function handleRuns(req, res, upath) {
  if (req.method !== 'GET') return false;

  if (upath === '/api/runs') {
    json(res, getRuns(50));
    return true;
  }

  if (upath === '/api/trend') {
    json(res, getPassRateTrend());
    return true;
  }

  const runMatch = upath.match(/^\/api\/runs\/(\d+)$/);
  if (runMatch) {
    const run = getRunById(parseInt(runMatch[1]));
    if (!run) { json(res, { error: 'Not found' }, 404); return true; }
    const tests = getTestsByRunId(run.id).map(t => {
      try { t.steps = JSON.parse(t.steps || '[]'); } catch (_) { t.steps = []; }
      return t;
    });
    json(res, { ...run, tests });
    return true;
  }

  const testsMatch = upath.match(/^\/api\/runs\/(\d+)\/tests$/);
  if (testsMatch) {
    json(res, getTestsByRunId(parseInt(testsMatch[1])));
    return true;
  }

  return false;
}

module.exports = handleRuns;
