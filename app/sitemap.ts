import { MetadataRoute } from "next";

// Top US tickers
const US_TICKERS = [
  "AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","BRK.B","JPM","V",
  "UNH","XOM","JNJ","WMT","MA","PG","HD","CVX","MRK","ABBV",
  "ORCL","AVGO","KO","PEP","BAC","COST","LLY","MCD","TMO","ACN",
  "AMD","NKE","TXN","INTC","DIS","CRM","NFLX","VZ","PM","ABT",
  "UPS","HON","CAT","DE","BA","GE","GS","MS","AXP","BLK",
];

// Top international tickers by market
const INTL_TICKERS = [
  // UK (London)
  "SHEL.L","AZN.L","HSBA.L","ULVR.L","BP.L","GSK.L","RIO.L","DGE.L",
  // Germany (XETRA)
  "SAP.DE","SIE.DE","ALV.DE","DTE.DE","BAS.DE","MBG.DE","BMW.DE","MUV2.DE",
  // Japan (Tokyo)
  "7203.T","6758.T","9984.T","8306.T","6861.T","7974.T","6501.T","9432.T",
  // China / Hong Kong
  "9988.HK","0700.HK","1299.HK","3690.HK","9618.HK","0005.HK",
  // India (NSE)
  "RELIANCE.NS","TCS.NS","INFY.NS","HDFCBANK.NS","ICICIBANK.NS","HINDUNILVR.NS",
  // Sweden (Nasdaq Stockholm)
  "ERIC-B.ST","VOLV-B.ST","ASSA-B.ST","SAND.ST","ATCO-A.ST","SEB-A.ST","INVE-B.ST","SHB-A.ST",
];

const ALL_TICKERS = [...US_TICKERS, ...INTL_TICKERS];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.whyisstock.com";
  const now = new Date();

  const stockEntries: MetadataRoute.Sitemap = ALL_TICKERS.map((ticker) => ({
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
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/markets`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.7,
    },
    ...stockEntries,
  ];
}
