'use strict';
const fs   = require('fs');
const path = require('path');
const db   = require('../db');

const REGIONS_FILE = path.join(__dirname, '..', '..', 'regions.json');

function loadRegions() {
  try { return JSON.parse(fs.readFileSync(REGIONS_FILE, 'utf8')); }
  catch (_) { return {}; }
}

function json(res, data, status) {
  res.writeHead(status || 200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise(resolve => {
    let buf = '';
    req.on('data', c => { buf += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(buf)); } catch (_) { resolve({}); }
    });
  });
}

function handleRegistry(req, res, upath) {
  if (!upath.startsWith('/api/registry')) return false;

  const method = req.method;

  // GET /api/registry/regions
  if (method === 'GET' && upath === '/api/registry/regions') {
    const regions = loadRegions();
    const result  = Object.entries(regions).map(([key, cfg]) => {
      const suites      = db.getSuitesByRegion(key);
      const totalCases  = suites.reduce((s, x) => s + x.case_count, 0);
      const activeCases = suites.reduce((s, x) => s + x.active_count, 0);
      return {
        key,
        label:        cfg.label,
        suite_count:  suites.length,
        total_cases:  totalCases,
        active_cases: activeCases,
      };
    });
    json(res, result);
    return true;
  }

  // GET /api/registry/:region/suites
  const regionSuitesM = upath.match(/^\/api\/registry\/([^/]+)\/suites$/);
  if (method === 'GET' && regionSuitesM) {
    json(res, db.getSuitesByRegion(regionSuitesM[1]));
    return true;
  }

  // POST /api/registry/:region/suites
  if (method === 'POST' && regionSuitesM) {
    readBody(req).then(body => {
      if (!body.name) { json(res, { error: 'name is required' }, 400); return; }
      const id = db.createSuite(regionSuitesM[1], body);
      json(res, { id }, 201);
    });
    return true;
  }

  // PUT /api/registry/suites/:id
  const suiteIdM = upath.match(/^\/api\/registry\/suites\/(\d+)$/);
  if (method === 'PUT' && suiteIdM) {
    readBody(req).then(body => {
      db.updateSuite(parseInt(suiteIdM[1]), body);
      json(res, { ok: true });
    });
    return true;
  }

  // DELETE /api/registry/suites/:id
  if (method === 'DELETE' && suiteIdM) {
    db.deleteSuite(parseInt(suiteIdM[1]));
    json(res, { ok: true });
    return true;
  }

  // GET /api/registry/suites/:id/cases
  const suiteCasesM = upath.match(/^\/api\/registry\/suites\/(\d+)\/cases$/);
  if (method === 'GET' && suiteCasesM) {
    const cases = db.getTestCasesBySuite(parseInt(suiteCasesM[1])).map(tc => ({
      ...tc,
      steps: tryParse(tc.steps, []),
    }));
    json(res, cases);
    return true;
  }

  // POST /api/registry/suites/:id/cases
  if (method === 'POST' && suiteCasesM) {
    readBody(req).then(body => {
      if (!body.name) { json(res, { error: 'name is required' }, 400); return; }
      const region = body.region || 'north-america';
      const id = db.createTestCase(parseInt(suiteCasesM[1]), region, body);
      json(res, { id }, 201);
    });
    return true;
  }

  // GET /api/registry/cases/:id
  const caseIdM = upath.match(/^\/api\/registry\/cases\/(\d+)$/);
  if (method === 'GET' && caseIdM) {
    const tc = db.getTestCaseById(parseInt(caseIdM[1]));
    if (!tc) { json(res, { error: 'Not found' }, 404); return true; }
    tc.steps = tryParse(tc.steps, []);
    json(res, tc);
    return true;
  }

  // PUT /api/registry/cases/:id
  if (method === 'PUT' && caseIdM) {
    readBody(req).then(body => {
      db.updateTestCase(parseInt(caseIdM[1]), body);
      json(res, { ok: true });
    });
    return true;
  }

  // DELETE /api/registry/cases/:id
  if (method === 'DELETE' && caseIdM) {
    db.deleteTestCase(parseInt(caseIdM[1]));
    json(res, { ok: true });
    return true;
  }

  return false;
}

function tryParse(val, fallback) {
  try { return JSON.parse(val); } catch (_) { return fallback; }
}

module.exports = handleRegistry;
