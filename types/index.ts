// ─── Stock Data ────────────────────────────────────────────────────────────────

export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;          // absolute
  changePercent: number;   // e.g. -3.27
  volume: number;
  avgVolume: number;
  marketCap: number;
  high52w: number;
  low52w: number;
  sector: string;
  exchange: string;
  currency: string;
  timestamp: number;       // unix ms
}

export interface Candle {
  time: number;   // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── News ──────────────────────────────────────────────────────────────────────

export type Sentiment = "positive" | "negative" | "neutral";

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;     // ISO
  sentiment: Sentiment;
  sentimentScore: number;  // -1 to 1
  image?: string;
}

// ─── Market Context ────────────────────────────────────────────────────────────

export interface IndexQuote {
  name: string;
  symbol: string;
  changePercent: number;
}

export interface SectorPerformance {
  sector: string;
  changePercent: number;
}

export interface MarketContext {
  indices: IndexQuote[];
  sectorPerf: SectorPerformance | null;
  marketSentiment: "risk-on" | "risk-off" | "neutral";
}

// ─── AI Summary ────────────────────────────────────────────────────────────────

export interface AISummaryResult {
  headline: string;           // 10-word punchy headline
  summary: string;            // 100-150 word plain-English explanation
  keyReasons: string[];       // 3-5 bullet points
  generatedAt: string;        // ISO
  cached: boolean;
}

// ─── Full Page Payload ─────────────────────────────────────────────────────────

export interface StockPageData {
  quote: StockQuote;
  candles: Candle[];
  news: NewsArticle[];
  marketContext: MarketContext;
  aiSummary: AISummaryResult;
  generatedAt: string;
}
