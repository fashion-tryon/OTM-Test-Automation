'use strict';
const Database = require('better-sqlite3');
const path = require('path');

// Use /tmp on Render (read-only filesystem); fall back to project root locally
const DB_PATH = process.env.RENDER
  ? path.join('/tmp', 'otm-portal.db')
  : path.join(__dirname, '..', 'otm-portal.db');

let _db = null;

function db() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    initSchema(_db);
    migrate(_db);
    seedRegistry(_db);
  }
  return _db;
}

function initSchema(d) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      trigger_type TEXT    NOT NULL DEFAULT 'manual',
      status       TEXT    NOT NULL DEFAULT 'running',
      started_at   TEXT    NOT NULL,
      finished_at  TEXT,
      total_tests  INTEGER DEFAULT 0,
      passed       INTEGER DEFAULT 0,
      failed       INTEGER DEFAULT 0,
      skipped      INTEGER DEFAULT 0,
      duration_ms  INTEGER DEFAULT 0,
      environment  TEXT    DEFAULT 'test',
      region       TEXT    DEFAULT 'north-america',
      region_label TEXT    DEFAULT 'North America'
    );

    CREATE TABLE IF NOT EXISTS test_results (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id          INTEGER NOT NULL,
      suite_name      TEXT,
      test_name       TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'running',
      duration_ms     INTEGER DEFAULT 0,
      error_message   TEXT,
      screenshot_path TEXT,
      video_path      TEXT,
      steps           TEXT    DEFAULT '[]',
      FOREIGN KEY (run_id) REFERENCES runs(id)
    );

    CREATE TABLE IF NOT EXISTS test_suites (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      region      TEXT    NOT NULL,
      name        TEXT    NOT NULL,
      description TEXT,
      is_active   INTEGER DEFAULT 1,
      created_at  TEXT    DEFAULT (datetime('now')),
      updated_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      suite_id        INTEGER NOT NULL REFERENCES test_suites(id),
      region          TEXT    NOT NULL,
      name            TEXT    NOT NULL,
      description     TEXT,
      preconditions   TEXT,
      steps           TEXT    DEFAULT '[]',
      expected_result TEXT,
      is_active       INTEGER DEFAULT 1,
      priority        TEXT    DEFAULT 'medium',
      created_at      TEXT    DEFAULT (datetime('now')),
      updated_at      TEXT    DEFAULT (datetime('now'))
    );
  `);
}

function migrate(d) {
  const runCols = d.prepare(`PRAGMA table_info(runs)`).all().map(c => c.name);
  if (!runCols.includes('region'))       d.exec(`ALTER TABLE runs ADD COLUMN region TEXT DEFAULT 'north-america'`);
  if (!runCols.includes('region_label')) d.exec(`ALTER TABLE runs ADD COLUMN region_label TEXT DEFAULT 'North America'`);
}

// ── Seed ─────────────────────────────────────────────────────────────────
function seedRegistry(d) {
  const count = d.prepare('SELECT COUNT(*) as n FROM test_suites').get().n;
  if (count > 0) return; // already seeded

  const insertSuite = d.prepare(
    `INSERT INTO test_suites (region, name, description) VALUES (?, ?, ?)`
  );
  const insertCase = d.prepare(`
    INSERT INTO test_cases
      (suite_id, region, name, description, preconditions, steps, expected_result, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const REGIONS = ['north-america', 'poland', 'turkey', 'germany', 'brazil'];

  // ── Sanity suite (all regions) ──────────────────────────────────────────
  const sanityCases = [
    {
      name: 'Login',
      description: 'Verify successful login to OTM with valid credentials',
      preconditions: 'Valid user credentials exist. OTM instance is accessible.',
      steps: JSON.stringify([
        'Navigate to the OTM URL',
        'Wait for Oracle IDCS sign-in page to load',
        'Enter username in the username field',
        'Enter password in the password field',
        'Click the Sign In button',
        'Wait for OTM homepage to load',
        'Verify Shipment Management link is visible'
      ]),
      expected_result: 'User is successfully logged in and OTM homepage is displayed with all navigation links visible.',
      priority: 'high',
    },
    {
      name: 'AddProperties',
      description: 'Verify that system properties can be added and saved',
      preconditions: 'User is logged in. Admin access is available.',
      steps: JSON.stringify([
        'Navigate to Admin > System Properties',
        'Click Add Property button',
        'Enter property name and value',
        'Click Save',
        'Verify property appears in the list'
      ]),
      expected_result: 'Property is saved and appears in the system properties list.',
      priority: 'medium',
    },
    {
      name: 'CreateDomain',
      description: 'Verify that a new domain can be created in OTM',
      preconditions: 'User is logged in with admin privileges.',
      steps: JSON.stringify([
        'Navigate to Admin > Domains',
        'Click Create Domain button',
        'Enter Domain ID and description',
        'Configure domain settings',
        'Click Save',
        'Verify domain appears in the domain list'
      ]),
      expected_result: 'Domain is created successfully and is visible in the domain management list.',
      priority: 'high',
    },
    {
      name: 'CreateUser',
      description: 'Verify that a new user can be created with appropriate roles',
      preconditions: 'User is logged in with admin privileges. Target domain exists.',
      steps: JSON.stringify([
        'Navigate to Admin > User Management',
        'Click Create User button',
        'Enter username, email and display name',
        'Assign user to domain',
        'Assign required roles',
        'Set password',
        'Click Save',
        'Verify user appears in user list'
      ]),
      expected_result: 'User is created successfully and can log in with the assigned credentials.',
      priority: 'high',
    },
  ];

  REGIONS.forEach(region => {
    const sid = insertSuite.run(region, 'Sanity', 'Core sanity checks applicable to all regions').lastInsertRowid;
    sanityCases.forEach(c => insertCase.run(sid, region, c.name, c.description, c.preconditions, c.steps, c.expected_result, c.priority));
  });

  // ── North America ────────────────────────────────────────────────────────
  const naOM = insertSuite.run('north-america', 'Order Management', 'End-to-end order lifecycle tests for North America').lastInsertRowid;
  [
    { name: 'Create Order', desc: 'Verify a new freight order can be created', pre: 'User logged in. Active shipper/consignee locations exist.', steps: ['Navigate to Order Management', 'Click New Order', 'Enter order details (source, destination, commodity)', 'Set pickup and delivery dates', 'Assign carrier', 'Click Submit', 'Note the order reference number'], exp: 'Order is created with status New and reference number is generated.', pri: 'high' },
    { name: 'Update Order', desc: 'Verify order details can be modified before tendering', pre: 'An order exists in New or Planning status.', steps: ['Search for the order by reference number', 'Open order details', 'Click Edit', 'Modify delivery date or commodity weight', 'Click Save'], exp: 'Changes are saved and order audit log reflects the update.', pri: 'medium' },
    { name: 'Cancel Order', desc: 'Verify an order can be cancelled with a reason', pre: 'An order exists in New status.', steps: ['Open the order', 'Click Cancel Order', 'Select cancellation reason', 'Enter remarks', 'Click Confirm'], exp: 'Order status changes to Cancelled and is removed from active planning.', pri: 'medium' },
    { name: 'Search Orders', desc: 'Verify order search by multiple criteria', pre: 'Multiple orders exist in various statuses.', steps: ['Navigate to Order Management > Search', 'Enter shipper name or date range', 'Click Search', 'Verify results list appears', 'Apply status filter'], exp: 'Search returns relevant orders matching the criteria.', pri: 'low' },
  ].forEach(c => insertCase.run(naOM, 'north-america', c.name, c.desc, c.pre, JSON.stringify(c.steps.map ? c.steps : [c.steps]), c.exp, c.pri));

  const naSM = insertSuite.run('north-america', 'Shipment Management', 'Shipment creation and tracking for North America').lastInsertRowid;
  [
    { name: 'Create Shipment', desc: 'Verify a shipment can be created from an order', pre: 'Tendered order exists. Carrier is assigned.', steps: ['Navigate to Shipment Management', 'Click Build Shipment', 'Select source order(s)', 'Assign carrier and equipment type', 'Set departure and arrival times', 'Click Save Shipment'], exp: 'Shipment is created and linked to the source order with a shipment reference.', pri: 'high' },
    { name: 'Update Shipment', desc: 'Verify shipment stops and timing can be updated', pre: 'Shipment in Planning status exists.', steps: ['Open shipment by reference', 'Click Edit Stops', 'Modify arrival time at a stop', 'Click Save'], exp: 'Shipment stop times updated and reflected in tracking.', pri: 'medium' },
    { name: 'Track Shipment', desc: 'Verify shipment status and location tracking', pre: 'Active shipment with in-transit status.', steps: ['Open shipment details', 'Click Tracking tab', 'Verify current location and status events', 'Check ETA calculation'], exp: 'Tracking shows correct status history and estimated arrival.', pri: 'medium' },
    { name: 'Cancel Shipment', desc: 'Verify a planned shipment can be cancelled', pre: 'Shipment in Planning status.', steps: ['Open shipment', 'Click Cancel Shipment', 'Enter cancellation reason', 'Confirm cancellation'], exp: 'Shipment cancelled and linked orders return to tendered status.', pri: 'low' },
  ].forEach(c => insertCase.run(naSM, 'north-america', c.name, c.desc, c.pre, JSON.stringify(c.steps), c.exp, c.pri));

  // ── Poland ────────────────────────────────────────────────────────────────
  const plSC = insertSuite.run('poland', 'Shipment Consolidation', 'Consolidation flows for Poland region').lastInsertRowid;
  [
    { name: 'Create Consolidation', desc: 'Verify multiple shipments can be consolidated into a single load', pre: 'Multiple planned shipments to the same destination lane.', steps: ['Navigate to Consolidation Manager', 'Click New Consolidation', 'Select candidate shipments from the list', 'Choose consolidation type (Hub or Direct)', 'Assign equipment and carrier', 'Click Build Consolidation'], exp: 'Consolidated load created with all selected shipments linked.', pri: 'high' },
    { name: 'Update Consolidation', desc: 'Verify shipments can be added or removed from a consolidation', pre: 'Active consolidation exists in Planning status.', steps: ['Open consolidation by ID', 'Click Manage Shipments', 'Remove one shipment from the load', 'Add a different shipment', 'Recalculate weight and volume', 'Save changes'], exp: 'Consolidation updated with new shipment composition.', pri: 'medium' },
    { name: 'Execute Consolidation', desc: 'Verify consolidated load can be dispatched', pre: 'Consolidation approved and all documents generated.', steps: ['Open consolidation', 'Verify all shipments have pick-up confirmation', 'Click Dispatch', 'Confirm departure time', 'Verify status changes to In Transit'], exp: 'Load dispatched and all linked shipments show In Transit status.', pri: 'high' },
  ].forEach(c => insertCase.run(plSC, 'poland', c.name, c.desc, c.pre, JSON.stringify(c.steps), c.exp, c.pri));

  // ── Turkey ────────────────────────────────────────────────────────────────
  const trSAP = insertSuite.run('turkey', 'SAP Integration', 'SAP ERP integration validation for Turkey').lastInsertRowid;
  [
    { name: 'SAP Order Sync', desc: 'Verify sales orders from SAP are received and created in OTM', pre: 'SAP integration is configured. Test sales order triggered in SAP.', steps: ['Trigger a test sales order in SAP SD', 'Check OTM integration queue', 'Verify order message received without errors', 'Open created order in OTM', 'Validate all fields match SAP data'], exp: 'Order is created in OTM with all SAP fields correctly mapped.', pri: 'high' },
    { name: 'SAP Status Update', desc: 'Verify OTM shipment status is pushed back to SAP', pre: 'OTM shipment in transit linked to a SAP delivery.', steps: ['Update shipment to Delivered in OTM', 'Check outbound integration queue', 'Verify status update message sent', 'Confirm delivery status updated in SAP MM'], exp: 'SAP delivery document updated with confirmed delivery date from OTM.', pri: 'high' },
    { name: 'SAP Error Handling', desc: 'Verify integration error messages are captured and alert is raised', pre: 'Integration error simulation configured in test.', steps: ['Send a malformed order message to OTM', 'Check integration error log', 'Verify error is captured with message details', 'Verify alert notification is generated'], exp: 'Error is logged with full details. Alert sent to integration admin.', pri: 'medium' },
  ].forEach(c => insertCase.run(trSAP, 'turkey', c.name, c.desc, c.pre, JSON.stringify(c.steps), c.exp, c.pri));

  const trSP = insertSuite.run('turkey', 'Shipment Planning', 'Route planning and optimisation for Turkey').lastInsertRowid;
  [
    { name: 'Create Plan', desc: 'Verify a shipment plan can be created for unplanned orders', pre: 'Multiple unplanned orders exist for the same origin region.', steps: ['Navigate to Shipment Planning', 'Click New Plan', 'Set planning horizon dates', 'Select eligible orders', 'Click Run Planner'], exp: 'Planning engine runs and generates proposed shipments for selected orders.', pri: 'high' },
    { name: 'Optimize Routes', desc: 'Verify route optimisation reduces total cost', pre: 'A draft shipment plan exists.', steps: ['Open existing plan', 'Click Optimise Routes', 'Wait for optimisation engine to complete', 'Compare cost before and after', 'Review route changes'], exp: 'Optimised plan shows reduced total transport cost vs baseline.', pri: 'medium' },
    { name: 'Execute Plan', desc: 'Verify planned shipments can be confirmed and tendered', pre: 'Approved shipment plan with carrier assignments.', steps: ['Open approved plan', 'Click Execute Plan', 'Confirm all shipments to tender', 'Verify carrier tender notifications sent', 'Check shipment statuses updated'], exp: 'All shipments tendered to carriers and statuses updated to Tendered.', pri: 'high' },
  ].forEach(c => insertCase.run(trSP, 'turkey', c.name, c.desc, c.pre, JSON.stringify(c.steps), c.exp, c.pri));

  // ── Germany ────────────────────────────────────────────────────────────────
  const deSM = insertSuite.run('germany', 'Shipment Management', 'Shipment management for Germany region').lastInsertRowid;
  [
    { name: 'Create Shipment', desc: 'Create a domestic Germany shipment', pre: 'Order exists. German carrier configured.', steps: ['Navigate to Shipment Management', 'Create new shipment for Germany lane', 'Assign DHL or DB Schenker carrier', 'Set ADR (hazmat) flag if required', 'Submit shipment'], exp: 'Shipment created with German carrier assignment and CMR document generated.', pri: 'high' },
    { name: 'Update Shipment', desc: 'Modify shipment details before dispatch', pre: 'Shipment in Planning status.', steps: ['Open shipment', 'Edit stop sequence', 'Update contact details', 'Save changes', 'Verify changes reflected'], exp: 'All changes saved and visible in shipment history.', pri: 'medium' },
    { name: 'Track Shipment', desc: 'Verify shipment tracking events', pre: 'Shipment in active transit.', steps: ['Open tracking view', 'Verify GPS events showing', 'Check milestone events', 'Verify ETA is updated'], exp: 'Tracking shows accurate location and ETA data.', pri: 'medium' },
  ].forEach(c => insertCase.run(deSM, 'germany', c.name, c.desc, c.pre, JSON.stringify(c.steps), c.exp, c.pri));

  // ── Brazil ────────────────────────────────────────────────────────────────
  const brOM = insertSuite.run('brazil', 'Order Management', 'Order management for Brazil region').lastInsertRowid;
  [
    { name: 'Create Order', desc: 'Create a new freight order for Brazil domestic lane', pre: 'User logged in. Brazil locations configured. NF-e document type active.', steps: ['Navigate to Order Management', 'Click New Order', 'Select Brazil origin and destination', 'Enter commodity details in Portuguese', 'Attach NF-e document reference', 'Submit order'], exp: 'Order created with Brazilian tax document reference and NF-e fields populated.', pri: 'high' },
    { name: 'Update Order', desc: 'Update order commodity and weight details', pre: 'Brazil order in New status.', steps: ['Open order', 'Click Edit', 'Update commodity weight', 'Add secondary commodity line', 'Recalculate volume', 'Save'], exp: 'Order updated with new commodity data.', pri: 'medium' },
    { name: 'Search Orders', desc: 'Search orders by NF-e number or date range', pre: 'Multiple Brazil orders exist.', steps: ['Go to Order Search', 'Enter NF-e reference number', 'Click Search', 'Verify matching orders returned', 'Check status and details'], exp: 'Search returns correct order linked to the NF-e reference.', pri: 'low' },
  ].forEach(c => insertCase.run(brOM, 'brazil', c.name, c.desc, c.pre, JSON.stringify(c.steps), c.exp, c.pri));
}

// ── Run functions ─────────────────────────────────────────────────────────
function createRun(triggerType, environment, region, regionLabel) {
  const r = db().prepare(
    `INSERT INTO runs (trigger_type, status, started_at, environment, region, region_label)
     VALUES (?, 'running', datetime('now'), ?, ?, ?)`
  ).run(triggerType || 'manual', environment || 'test', region || 'north-america', regionLabel || 'North America');
  return r.lastInsertRowid;
}

function updateRun(runId, data) {
  const keys = Object.keys(data);
  if (!keys.length) return;
  const set = keys.map(k => k + ' = ?').join(', ');
  db().prepare(`UPDATE runs SET ${set} WHERE id = ?`).run(...Object.values(data), runId);
}

function saveTestResult(runId, result) {
  const r = db().prepare(`
    INSERT INTO test_results
      (run_id,suite_name,test_name,status,duration_ms,error_message,screenshot_path,video_path,steps)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(runId, result.suite_name || '', result.test_name, result.status,
    result.duration_ms || 0, result.error_message || null,
    result.screenshot_path || null, result.video_path || null,
    JSON.stringify(result.steps || []));
  return r.lastInsertRowid;
}

function getRuns(limit)          { return db().prepare('SELECT * FROM runs ORDER BY id DESC LIMIT ?').all(limit || 50); }
function getRunById(runId)       { return db().prepare('SELECT * FROM runs WHERE id = ?').get(runId); }
function getTestsByRunId(runId)  { return db().prepare('SELECT * FROM test_results WHERE run_id = ? ORDER BY id').all(runId); }
function getTestById(testId)     { return db().prepare('SELECT * FROM test_results WHERE id = ?').get(testId); }

function getPassRateTrend() {
  return db().prepare(`
    SELECT id, started_at, total_tests, passed, failed, region, region_label,
           CASE WHEN total_tests > 0 THEN ROUND(100.0*passed/total_tests,1) ELSE 0 END AS pass_rate
    FROM runs WHERE status IN ('passed','failed') ORDER BY id DESC LIMIT 10
  `).all().reverse();
}

// ── Registry — Suite functions ────────────────────────────────────────────
function getSuitesByRegion(region) {
  const suites = db().prepare('SELECT * FROM test_suites WHERE region = ? ORDER BY name').all(region);
  return suites.map(s => ({
    ...s,
    case_count: db().prepare('SELECT COUNT(*) as n FROM test_cases WHERE suite_id = ?').get(s.id).n,
    active_count: db().prepare("SELECT COUNT(*) as n FROM test_cases WHERE suite_id = ? AND is_active = 1").get(s.id).n,
  }));
}

function createSuite(region, data) {
  const r = db().prepare(
    `INSERT INTO test_suites (region, name, description, is_active) VALUES (?, ?, ?, 1)`
  ).run(region, data.name, data.description || null);
  return r.lastInsertRowid;
}

function updateSuite(id, data) {
  const fields = [];
  const vals   = [];
  if (data.name        !== undefined) { fields.push('name = ?');        vals.push(data.name); }
  if (data.description !== undefined) { fields.push('description = ?'); vals.push(data.description); }
  if (data.is_active   !== undefined) { fields.push('is_active = ?');   vals.push(data.is_active); }
  if (!fields.length) return;
  fields.push("updated_at = datetime('now')");
  db().prepare(`UPDATE test_suites SET ${fields.join(', ')} WHERE id = ?`).run(...vals, id);
}

function deleteSuite(id) {
  db().prepare('DELETE FROM test_cases WHERE suite_id = ?').run(id);
  db().prepare('DELETE FROM test_suites WHERE id = ?').run(id);
}

// ── Registry — Case functions ─────────────────────────────────────────────
function getTestCasesBySuite(suiteId) {
  return db().prepare('SELECT * FROM test_cases WHERE suite_id = ? ORDER BY priority DESC, name').all(suiteId);
}

function getTestCasesByRegion(region) {
  return db().prepare('SELECT * FROM test_cases WHERE region = ? ORDER BY suite_id, name').all(region);
}

function getTestCaseById(id) {
  return db().prepare('SELECT * FROM test_cases WHERE id = ?').get(id);
}

function createTestCase(suiteId, region, data) {
  const r = db().prepare(`
    INSERT INTO test_cases (suite_id,region,name,description,preconditions,steps,expected_result,priority,is_active)
    VALUES (?,?,?,?,?,?,?,?,1)
  `).run(suiteId, region, data.name, data.description || null, data.preconditions || null,
    JSON.stringify(data.steps || []), data.expected_result || null, data.priority || 'medium');
  return r.lastInsertRowid;
}

function updateTestCase(id, data) {
  const fields = [];
  const vals   = [];
  const map = { name:1, description:1, preconditions:1, expected_result:1, priority:1, is_active:1 };
  Object.entries(data).forEach(([k, v]) => {
    if (map[k]) { fields.push(k + ' = ?'); vals.push(v); }
  });
  if (data.steps !== undefined) { fields.push('steps = ?'); vals.push(JSON.stringify(data.steps)); }
  if (!fields.length) return;
  fields.push("updated_at = datetime('now')");
  db().prepare(`UPDATE test_cases SET ${fields.join(', ')} WHERE id = ?`).run(...vals, id);
}

function deleteTestCase(id) {
  db().prepare('DELETE FROM test_cases WHERE id = ?').run(id);
}

module.exports = {
  createRun, updateRun, saveTestResult,
  getRuns, getRunById, getTestsByRunId, getTestById, getPassRateTrend,
  getSuitesByRegion, createSuite, updateSuite, deleteSuite,
  getTestCasesBySuite, getTestCasesByRegion, getTestCaseById,
  createTestCase, updateTestCase, deleteTestCase,
};
