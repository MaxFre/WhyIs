import { MetadataRoute } from "next";

// Top 50 US tickers — extend this list or pull from a DB for full scale
const TOP_TICKERS = [
  "AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","BRK.B","JPM","V",
  "UNH","XOM","JNJ","WMT","MA","PG","HD","CVX","MRK","ABBV",
  "ORCL","AVGO","KO","PEP","BAC","COST","LLY","MCD","TMO","ACN",
  "AMD","NKE","TXN","INTC","DIS","CRM","NFLX","VZ","PM","ABT",
  "UPS","HON","CAT","DE","BA","GE","GS","MS","AXP","BLK",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://whyis.finance";
  const now = new Date();

  const stockEntries: MetadataRoute.Sitemap = TOP_TICKERS.map((ticker) => ({
    url: `${base}/stocks/${ticker}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    ...stockEntries,
  ];
}
