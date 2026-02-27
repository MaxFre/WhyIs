# WhyIs — Why Is Your Stock Up or Down Today?

A scalable, automated SEO website that explains daily stock price movements for any ticker using real-time data + AI summaries.

---

## Features

| Feature | Details |
|---|---|
| **Dynamic ticker pages** | `/stocks/AAPL`, `/stocks/TSLA`, etc. — any valid US ticker |
| **Real-time quotes** | Price, % change, volume, market cap via Finnhub API |
| **Intraday chart** | 5-min candles rendered with lightweight-charts |
| **AI summary** | GPT-4o-mini generates a 100–150 word plain-English explanation |
| **News aggregation** | Latest 8 headlines via Finnhub, auto-tagged with sentiment |
| **Market context** | S&P 500, Nasdaq, DJIA + sector ETF performance |
| **ISR caching** | Pages revalidate every 15 min; quotes cached 1 min |
| **SEO-optimised** | Dynamic meta titles, OG tags, JSON-LD, sitemap, robots.txt |
| **Ad slots** | Placeholder components ready for AdSense integration |
| **Affiliate slots** | Broker link placeholder in sidebar |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/yourname/whyis.git
cd whyis
npm install
```

### 2. Configure API keys

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
FINNHUB_API_KEY=your_key     # https://finnhub.io  (free tier: 60 req/min)
OPENAI_API_KEY=your_key      # https://platform.openai.com (gpt-4o-mini: ~$0.0002/summary)
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Try: [http://localhost:3000/stocks/AAPL](http://localhost:3000/stocks/AAPL)

---

## Project Structure

```
whyis/
├── app/
│   ├── layout.tsx              # Root layout + header/footer
│   ├── page.tsx                # Home page with search
│   ├── markets/page.tsx        # Market overview
│   ├── stocks/[ticker]/
│   │   ├── page.tsx            # ← Core stock explanation page
│   │   ├── loading.tsx         # Skeleton loading state
│   │   └── not-found.tsx       # 404 for invalid tickers
│   ├── api/stock/[ticker]/
│   │   └── route.ts            # REST API endpoint (for CSR refresh)
│   ├── sitemap.ts              # Auto-generated sitemap
│   └── robots.ts               # robots.txt
│
├── components/
│   ├── TickerSearch.tsx        # Search bar (client)
│   ├── PriceHeader.tsx         # Price + stats card
│   ├── StockChart.tsx          # Intraday chart (client, lightweight-charts)
│   ├── AISummaryCard.tsx       # AI-generated summary
│   ├── NewsList.tsx            # News with sentiment badges
│   ├── MarketContextCard.tsx   # Index + sector performance
│   ├── DisclaimerBanner.tsx    # Legal disclaimer
│   ├── AdSlot.tsx              # Ad placeholder / AdSense slot
│   └── RefreshButton.tsx       # Manual refresh (client)
│
├── lib/
│   ├── stockApi.ts             # Finnhub quote + candles
│   ├── newsApi.ts              # Finnhub company news
│   ├── marketContext.ts        # Index + sector quotes
│   ├── aiSummary.ts            # OpenAI GPT-4o-mini summary
│   ├── sentiment.ts            # Rule-based sentiment scorer
│   └── cache.ts                # In-process TTL cache (swap for Redis)
│
└── types/index.ts              # All TypeScript interfaces
```

---

## URL Structure

| URL | Description |
|---|---|
| `/` | Home + search |
| `/stocks/AAPL` | Apple explanation page |
| `/stocks/TSLA` | Tesla explanation page |
| `/markets` | Market overview |
| `/api/stock/AAPL` | JSON API for any ticker |
| `/sitemap.xml` | Auto-generated sitemap |

---

## Caching Strategy

| Data | TTL | Notes |
|---|---|---|
| Stock quote | 1 min | Near real-time |
| Candles | 5 min | Intraday chart data |
| News | 10 min | Avoids rate limits |
| Market context | 2 min | Indices + sectors |
| AI summary | 15 min | Regenerates if price moves >0.5% |
| ISR pages | 15 min | Next.js edge cache |

For production, replace the in-process cache in `lib/cache.ts` with **Redis** or **Vercel KV**.

---

## SEO Strategy

- Meta title pattern: `"Why Is {Company} Stock Down Today? (February 27, 2026)"`
- JSON-LD `Article` schema on every ticker page
- Auto-generated `sitemap.xml` covering top 50 tickers
- Canonical URLs to avoid duplicate content
- ISR ensures crawlers always get fresh, server-rendered HTML

---

## Monetisation

1. **Display ads** — Swap `AdSlot` components with real AdSense `<ins>` tags
2. **Affiliate brokers** — Update the broker link in the sidebar (`stocks/[ticker]/page.tsx`)
3. **Premium tier** — Add auth + gate the AI summary behind a subscription

---

## Production Deployment

### Vercel (recommended)

```bash
npm i -g vercel
vercel --prod
```

Add environment variables in the Vercel dashboard.

### Self-hosted

```bash
npm run build
npm start
```

---

## Extending to Swedish Stocks

To add Swedish stocks (OMX), update `lib/stockApi.ts` to handle `.ST` suffixes (e.g. `ERIC-B.ST`) and add them to the sitemap and trending lists. Finnhub supports OMX via the same API.

---

## License

MIT
