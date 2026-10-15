const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadGenerator() {
  const cache = new Map();
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "aiSummary.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, {
    exports: module.exports,
    module,
    require: name => {
      assert.equal(name, "./cache");
      return { cacheGet: key => cache.get(key), cacheSet: (key, value) => cache.set(key, value), TTL: { AI_SUMMARY: 900 } };
    },
    Date,
    Intl,
  });
  return module.exports.generateAISummary;
}

const now = Date.now();
const quote = {
  ticker: "NVDA", name: "NVIDIA Corporation", price: 103, previousClose: 100,
  change: 3, changePercent: 3, volume: 500000, avgVolume: 1000000,
  marketCap: 1e12, high52w: 150, low52w: 50, sector: "Technology",
  exchange: "NMS", currency: "USD", timestamp: now,
};
const context = {
  indices: [{ name: "Nasdaq", symbol: "^IXIC", changePercent: 1 }, { name: "OMX Stockholm", symbol: "^OMX", changePercent: -2 }],
  sectorPerf: { sector: "Technology", changePercent: 0.8 }, marketSentiment: "risk-off",
};
function article(headline, hours = 1, overrides = {}) {
  return {
    id: headline, headline, source: "Example News", summary: "", url: "https://example.com/news",
    publishedAt: new Date(now - hours * 3600000).toISOString(), sentiment: "neutral", sentimentScore: 0,
    ...overrides,
  };
}

test("explains an earnings catalyst and separates it from benchmark performance", async () => {
  const result = await loadGenerator()(quote, [article("NVIDIA beats earnings expectations")], context);
  assert.match(result.headline, /earnings/i);
  assert.match(result.summary, /future profits/);
  assert.match(result.summary, /outperforming by 2\.00 percentage points/);
  assert.match(result.summary, /plausible|candidate|cannot establish|could help/);
  assert.doesNotMatch(result.headline, /Example News/);
});

test("downward earnings revision supports a decline", async () => {
  const result = await loadGenerator()({ ...quote, changePercent: -4 }, [article("NVIDIA cuts guidance after earnings miss")], context);
  assert.match(result.headline, /earnings/i);
  assert.match(result.summary, /negative wording|same direction|strongest matching|could help/);
  assert.match(result.summary, /underperforming by 5\.00 percentage points/);
});

test("does not turn positive news into an explanation for a decline", async () => {
  const result = await loadGenerator()({ ...quote, changePercent: -3 }, [article("NVIDIA beats earnings expectations")], context);
  assert.match(result.summary, /runs against|disagree|counter-signal/);
  assert.match(result.summary, /against this proxy/);
});

test("ignores stale, future, duplicate, unrelated and price-only headlines as catalysts", async () => {
  const generate = loadGenerator();
  for (const news of [
    [article("NVIDIA beats earnings expectations", 80)],
    [article("NVIDIA beats earnings expectations", -1)],
    [article("Apple beats earnings expectations")],
    [article("NVIDIA shares rise 3%")],
    [article("NVIDIA beats earnings expectations", 1, { publishedAt: "invalid" })],
  ]) {
    const result = await generate(quote, news, context);
    assert.doesNotMatch(result.headline, /earnings/);
    assert.match(result.summary, /not a confirmed|rather than a verified|limited certainty|matching direction alone/);
  }
  const repeated = article("NVIDIA beats earnings expectations");
  const result = await generate(quote, [repeated, repeated], context);
  assert.equal(result.keyReasons.filter(reason => reason.startsWith("Earnings")).length, 1);
});

test("uses the local benchmark and labels foreign sector data as a proxy", async () => {
  const result = await loadGenerator()({ ...quote, ticker: "VOLV-B.ST", name: "Volvo AB", currency: "SEK", changePercent: -3 }, [], context);
  assert.match(result.summary, /OMX Stockholm/);
  assert.doesNotMatch(result.summary, /Nasdaq/);
  assert.match(result.summary, /US Technology sector proxy/);
  assert.match(result.summary, /overseas context/);
});

test("does not substitute a US benchmark for an unsupported market", async () => {
  const result = await loadGenerator()({ ...quote, ticker: "SHOP.TO" }, [], context);
  assert.match(result.summary, /suitable local benchmark is unavailable/);
  assert.match(result.headline, /without a clear|not clear|limited explanatory|No clear/);
});

test("zero moves are flat and incomplete volume is not claimed to be unusually light", async () => {
  const result = await loadGenerator()({ ...quote, changePercent: 0 }, [], context);
  assert.match(result.summary, /flat trading|below 0\.10%|close to the prior close/);
  assert.match(result.summary, /unfinished session/);
  assert.doesNotMatch(result.summary, /surging|tumbling|thin participation/);
  const missing = await loadGenerator()({ ...quote, volume: 0, avgVolume: 0 }, [], context);
  assert.match(missing.summary, /volume comparisons are unavailable/);
});

test("mixed events preserve the counter-evidence", async () => {
  const result = await loadGenerator()(quote, [article("NVIDIA beats earnings expectations"), article("NVIDIA faces investigation")], context);
  assert.match(result.summary, /news evidence is therefore mixed/);
});

test("changing evidence refreshes the cache while repeated inputs stay stable", async () => {
  const generate = loadGenerator();
  const news = [article("NVIDIA beats earnings expectations")];
  const first = await generate(quote, news, context);
  const repeated = await generate(quote, news, context);
  assert.equal(repeated.cached, true);
  assert.equal(repeated.summary, first.summary);
  for (const args of [
    [{ ...quote, changePercent: -3 }, news, context],
    [quote, [article("NVIDIA faces investigation")], context],
    [quote, news, { ...context, indices: [{ name: "Nasdaq", symbol: "^IXIC", changePercent: -1 }] }],
  ]) assert.equal((await generate(...args)).cached, false);
});

test("different tickers produce varied, deterministic wording", async () => {
  const generate = loadGenerator();
  const openings = new Set();
  const headlines = new Set();
  for (const ticker of ["NVDA", "AMD", "MSFT", "AAPL", "AMZN", "META", "TSLA", "GOOGL"]) {
    const result = await generate({ ...quote, ticker, name: "Example Corporation" }, [], context);
    openings.add(result.summary.split("\n")[0].replaceAll(ticker, "TICKER"));
    headlines.add(result.headline.replaceAll(ticker, "TICKER"));
  }
  assert.ok(openings.size >= 3);
  assert.ok(headlines.size >= 3);
});

test("reported inflation has a mechanism without claiming a proven cause", async () => {
  const result = await loadGenerator()({ ...quote, changePercent: -3 }, [article("NVIDIA sinks as hot inflation data hits chip stocks")], context);
  assert.match(result.headline, /inflation and rates/);
  assert.match(result.summary, /discount rates/);
  assert.match(result.summary, /plausible|candidate|cannot establish|could help/);
});

test("previews, questions, and negated outcomes do not become directional catalysts", async () => {
  for (const headline of ["NVIDIA could beat earnings expectations", "Will NVIDIA beat earnings?", "NVIDIA avoids earnings miss", "NVIDIA settles lawsuit"]) {
    const result = await loadGenerator()(quote, [article(headline)], context);
    assert.match(result.summary, /cannot explain the direction|effect is ambiguous|no clear directional signal/);
    assert.doesNotMatch(result.summary, /strongest matching event|positive wording is consistent|negative wording is consistent/);
  }
});

test("the latest relevant event is not displaced by older news that matches the price", async () => {
  const result = await loadGenerator()(quote, [article("NVIDIA beats earnings expectations", 48), article("NVIDIA faces investigation", 1)], context);
  assert.match(result.summary.split("\n\n")[1], /^Example News reported "NVIDIA faces investigation"/);
  assert.match(result.summary, /news evidence is therefore mixed/);
});

test("short ticker symbols and generic name fragments do not match ordinary words", async () => {
  const result = await loadGenerator()({ ...quote, ticker: "T", name: "AT&T Inc." }, [article("Investors can't wait for Apple earnings beat")], context);
  assert.doesNotMatch(result.headline, /earnings/);
  const amd = await loadGenerator()({ ...quote, ticker: "AMD", name: "Advanced Micro Devices" }, [article("Micro-cap company wins product approval")], context);
  assert.doesNotMatch(amd.headline, /business developments/);
});

test("Nasdaq listings use Nasdaq even when the sector profile is missing", async () => {
  const result = await loadGenerator()({ ...quote, sector: "", exchange: "NMS" }, [], { ...context, sectorPerf: null });
  assert.match(result.summary, /Nasdaq/);
  assert.doesNotMatch(result.summary, /benchmark is unavailable/);
});