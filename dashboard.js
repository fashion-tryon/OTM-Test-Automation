'use strict';

const http  = require('http');
const path  = require('path');
const fs    = require('fs');
const { exec } = require('child_process');

const PORT        = process.env.PORT || 3000;
const ROOT        = __dirname;
const REPORT_DIR  = path.join(ROOT, 'allure-report');

// ── run state ────────────────────────────────────────────────────────────
let state = {
  status: 'idle',   // idle | running | passed | failed
  lastRun: null,
  output: [],
};
let activeProc = null;

// ── HTML page ─────────────────────────────────────────────────────────────
function buildPage() {
  const statusColor = { idle:'#64748b', running:'#3b82f6', passed:'#22c55e', failed:'#ef4444' }[state.status] || '#64748b';
  const statusLabel = state.status.charAt(0).toUpperCase() + state.status.slice(1);
  const lastRun     = state.lastRun ? new Date(state.lastRun).toLocaleString() : 'Never';
  const outputHtml  = state.output.slice(-200).map(l =>
    '<div class="ol">' + l.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>'
  ).join('');
  const reportExists = fs.existsSync(path.join(REPORT_DIR, 'index.html'));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OTM Automation Dashboard</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f6fb;color:#1e293b;min-height:100vh}
.hdr{background:linear-gradient(135deg,#1e3a5f,#1e40af,#2563eb);padding:0 32px;height:64px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 20px rgba(30,58,95,.4)}
.hdr-left{display:flex;align-items:center;gap:14px}
.logo{width:38px;height:38px;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.35);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:12px;letter-spacing:.5px}
.hdr-title{font-size:18px;font-weight:700;color:#fff;letter-spacing:-.3px}
.hdr-sub{font-size:11px;color:rgba(255,255,255,.65)}
.wrap{max-width:900px;margin:32px auto;padding:0 24px 60px}
.card{background:#fff;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.08),0 4px 12px rgba(0,0,0,.05);border:1px solid #e2e8f0;margin-bottom:20px;overflow:hidden}
.card-title{font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.7px;padding:16px 22px 0}
.card-body{padding:20px 22px}
.status-row{display:flex;align-items:center;gap:14px;margin-bottom:18px}
.status-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;transition:background .3s}
.status-label{font-size:22px;font-weight:800;letter-spacing:-.5px;transition:color .3s}
.meta{font-size:12px;color:#94a3b8;margin-top:2px}
.actions{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:7px;padding:10px 20px;border:none;border-radius:9px;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;text-decoration:none}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn-run{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;box-shadow:0 2px 8px rgba(59,130,246,.4)}
.btn-run:not(:disabled):hover{box-shadow:0 4px 16px rgba(59,130,246,.5);transform:translateY(-1px)}
.btn-report{background:#fff;color:#3b82f6;border:2px solid #3b82f6}
.btn-report:hover{background:#eff6ff}
.btn-report.disabled{color:#94a3b8;border-color:#e2e8f0;cursor:not-allowed;pointer-events:none}
.output-box{background:#0f172a;border-radius:10px;padding:14px 16px;height:320px;overflow-y:auto;font-family:Consolas,Monaco,monospace;font-size:12px;line-height:1.7;color:#94a3b8}
.ol{white-space:pre-wrap;word-break:break-all;color:#cbd5e1}
.ol:empty::after{content:'—';color:#334155}
.hint{font-size:12px;color:#94a3b8;font-style:italic;padding:10px 0 0}
@keyframes spin{to{transform:rotate(360deg)}}
.spin{display:inline-block;animation:spin 1s linear infinite}
</style>
</head>
<body>
<div class="hdr">
  <div class="hdr-left">
    <div class="logo">OTM</div>
    <div>
      <div class="hdr-title">OTM Automation</div>
      <div class="hdr-sub">Playwright + Allure Test Runner</div>
    </div>
  </div>
</div>
<div class="wrap">

  <div class="card">
    <div class="card-title">Status</div>
    <div class="card-body">
      <div class="status-row">
        <div class="status-dot" style="background:${statusColor}"></div>
        <div>
          <div class="status-label" style="color:${statusColor}">${statusLabel}</div>
          <div class="meta">Last run: ${lastRun}</div>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-run" id="runBtn" onclick="runTest()" ${state.status === 'running' ? 'disabled' : ''}>
          ${state.status === 'running' ? '<span class="spin">&#9696;</span> Running...' : '&#9654;&nbsp; Run Login Test'}
        </button>
        <a href="/report" target="_blank" class="btn btn-report ${reportExists ? '' : 'disabled'}">
          &#128196;&nbsp; View Allure Report
        </a>
      </div>
      <p class="hint">Running the test will launch a Chrome browser window and execute the login scenario. The Allure report is generated automatically after the test finishes.</p>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Live Output</div>
    <div class="card-body">
      <div class="output-box" id="outputBox">${outputHtml || '<div style="color:#334155;font-style:italic">No output yet &mdash; click Run Login Test to start.</div>'}</div>
    </div>
  </div>

</div>
<script>
  function runTest() {
    document.getElementById('runBtn').disabled = true;
    document.getElementById('runBtn').innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite">&#9696;</span> Running...';
    fetch('/run', { method: 'POST' });
    setTimeout(pollStatus, 500);
  }

  var lastLen = 0;
  function pollStatus() {
    fetch('/status').then(function(r){ return r.json(); }).then(function(d) {
      if (d.output && d.output.length > lastLen) {
        var box = document.getElementById('outputBox');
        var newLines = d.output.slice(lastLen);
        lastLen = d.output.length;
        if (lastLen === newLines.length) box.innerHTML = '';
        newLines.forEach(function(l) {
          var div = document.createElement('div');
          div.className = 'ol';
          div.textContent = l;
          box.appendChild(div);
        });
        box.scrollTop = box.scrollHeight;
      }
      if (d.status === 'running') {
        setTimeout(pollStatus, 600);
      } else {
        location.reload();
      }
    }).catch(function() { setTimeout(pollStatus, 1000); });
  }
</script>
</body>
</html>`;
}

// ── run test ──────────────────────────────────────────────────────────────
function runTest(res) {
  if (state.status === 'running') {
    if (res) { res.writeHead(409); res.end('Already running'); }
    return;
  }

  state.status  = 'running';
  state.lastRun = Date.now();
  state.output  = ['[INFO] Starting: npm run test:login ...'];

  const cmd = 'npm run test:login && npm run report';
  activeProc = exec(cmd, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 }, (err) => {
    state.status = err ? 'failed' : 'passed';
    state.output.push('');
    state.output.push(err
      ? '[FAIL] Test run finished with errors (exit code ' + (err.code || 1) + ')'
      : '[PASS] Test run finished successfully. Allure report generated.');
    activeProc = null;
  });

  activeProc.stdout.on('data', d => {
    d.toString().split('\n').forEach(l => { if (l.trim()) state.output.push(l); });
  });
  activeProc.stderr.on('data', d => {
    d.toString().split('\n').forEach(l => { if (l.trim()) state.output.push(l); });
  });

  if (res) { res.writeHead(200); res.end('started'); }
}

// ── serve static files from allure-report ─────────────────────────────────
function serveReport(res, reqPath) {
  const filePath = reqPath === '/report' || reqPath === '/report/'
    ? path.join(REPORT_DIR, 'index.html')
    : path.join(REPORT_DIR, reqPath.replace(/^\/report\/?/, ''));

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h2 style="font-family:sans-serif;padding:40px">No Allure report found. Run a test first.</h2>');
    return;
  }

  const ext  = path.extname(filePath).toLowerCase();
  const mime = { '.html':'text/html','.js':'application/javascript','.css':'text/css',
                 '.json':'application/json','.png':'image/png','.svg':'image/svg+xml',
                 '.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf' }[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

// ── HTTP server ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const upath = req.url.split('?')[0];
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET' && upath === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(buildPage());
    return;
  }

  if (req.method === 'GET' && upath === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: state.status, lastRun: state.lastRun, output: state.output }));
    return;
  }

  if (req.method === 'POST' && upath === '/run') {
    runTest(res);
    return;
  }

  if (req.method === 'GET' && (upath === '/report' || upath.startsWith('/report/'))) {
    serveReport(res, upath);
    return;
  }

  res.writeHead(404); res.end();
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error('\nPort ' + PORT + ' already in use.\nKill it: Stop-Process -Id (Get-NetTCPConnection -LocalPort ' + PORT + ').OwningProcess -Force\n');
    process.exit(1);
  } else throw e;
});

server.listen(PORT, () => {
  console.log('\nOTM Automation Dashboard  →  http://localhost:' + PORT + '\n');
  if (process.platform === 'win32') require('child_process').exec('start http://localhost:' + PORT);
});
