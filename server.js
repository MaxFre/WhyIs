/**
 * WhyIs — local dev server
 * - Serves static HTML/CSS/JS files
 * - Proxies Yahoo Finance API calls (bypasses browser CORS)
 *
 * Run:  node server.js
 * Open: http://localhost:3000
 *
 * Pure Node.js built-ins only — no npm install needed.
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT = 3000;

// ── MIME types ────────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
};

// ── Yahoo Finance endpoints ───────────────────────────────────────────────────
const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

function yfFetch(yfUrl) {
  return new Promise((resolve, reject) => {
    const req = https.get(yfUrl, { headers: YF_HEADERS }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON from Yahoo Finance')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Yahoo Finance timeout')); });
  });
}

// ── API route handlers ────────────────────────────────────────────────────────

async function handleQuote(ticker, res) {
  // Yahoo chart endpoint returns quote + candles in one call
  const data = await yfFetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=5m&range=1d`
  );
  sendJson(res, data);
}

async function handleNews(ticker, res) {
  const data = await yfFetch(
    `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=8&enableFuzzyQuery=false`
  );
  sendJson(res, data);
}

async function handleIndex(symbol, res) {
  const data = await yfFetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
  );
  sendJson(res, data);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sendJson(res, data) {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ error: message }));
}

// ── Request router ────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const parsed  = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const query   = parsed.query;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' });
    res.end();
    return;
  }

  // ── API routes ──
  if (pathname === '/api/quote') {
    const ticker = (query.ticker || '').trim().toUpperCase();
    if (!ticker) return sendError(res, 400, 'ticker is required');
    try { await handleQuote(ticker, res); }
    catch (e) { sendError(res, 502, e.message); }
    return;
  }

  if (pathname === '/api/news') {
    const ticker = (query.ticker || '').trim().toUpperCase();
    if (!ticker) return sendError(res, 400, 'ticker is required');
    try { await handleNews(ticker, res); }
    catch (e) { sendError(res, 502, e.message); }
    return;
  }

  if (pathname === '/api/index') {
    const symbol = (query.symbol || '').trim();
    if (!symbol) return sendError(res, 400, 'symbol is required');
    try { await handleIndex(symbol, res); }
    catch (e) { sendError(res, 502, e.message); }
    return;
  }

  // ── Static file serving ──
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Default to .html if no extension
  if (!path.extname(filePath)) filePath += '.html';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h2>404 — Not found</h2>');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`\n  ✅  WhyIs running at http://localhost:${PORT}`);
  console.log(`  📈  Try: http://localhost:${PORT}/stock.html?ticker=AAPL\n`);
});
