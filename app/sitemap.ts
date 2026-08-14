import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.whyisstock.com";

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "hourly", priority: 1.0 },
  { path: "/markets", changeFrequency: "hourly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

// Top US tickers (expanded)
const US_TICKERS = [
  "AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","BRK.B","JPM","V",
  "UNH","XOM","JNJ","WMT","MA","PG","HD","CVX","MRK","ABBV",
  "ORCL","AVGO","KO","PEP","BAC","COST","LLY","MCD","TMO","ACN",
  "AMD","NKE","TXN","INTC","DIS","CRM","NFLX","VZ","PM","ABT",
  "UPS","HON","CAT","DE","BA","GE","GS","MS","AXP","BLK",
  "SPY","QQQ","IWM","DIA","VOO","VTI","ARKK","XLF","XLE","XLK",
  "PLTR","RIVN","SOFI","COIN","SNAP","UBER","LYFT","SQ","SHOP","ROKU",
  "PYPL","ABNB","RBLX","DKNG","HOOD","MARA","RIOT","SMCI","ARM","CRWD",
];

// Top international tickers by market (expanded)
const INTL_TICKERS = [
  // UK (London)
  "SHEL.L","AZN.L","HSBA.L","ULVR.L","BP.L","GSK.L","RIO.L","DGE.L","LSEG.L","BARC.L",
  // Germany (XETRA)
  "SAP.DE","SIE.DE","ALV.DE","DTE.DE","BAS.DE","MBG.DE","BMW.DE","MUV2.DE","ADS.DE","IFX.DE",
  // Japan (Tokyo)
  "7203.T","6758.T","9984.T","8306.T","6861.T","7974.T","6501.T","9432.T","6902.T","4063.T",
  // China / Hong Kong
  "9988.HK","0700.HK","1299.HK","3690.HK","9618.HK","0005.HK","1810.HK","2318.HK","0941.HK",
  // India (NSE)
  "RELIANCE.NS","TCS.NS","INFY.NS","HDFCBANK.NS","ICICIBANK.NS","HINDUNILVR.NS","ITC.NS","SBIN.NS",
  // Sweden (Nasdaq Stockholm)
  "ERIC-B.ST","VOLV-B.ST","ASSA-B.ST","SAND.ST","ATCO-A.ST","SEB-A.ST","INVE-B.ST","SHB-A.ST",
  "ABB.ST","HEXA-B.ST","ALFA.ST","SINCH.ST","EVO.ST","SWED-A.ST",
];

const ALL_TICKERS = [...US_TICKERS, ...INTL_TICKERS];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const stockEntries: MetadataRoute.Sitemap = ALL_TICKERS.map((ticker) => ({
    url: `${BASE_URL}/stocks/${ticker}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${BASE_URL}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...stockEntries,
  ];
}
