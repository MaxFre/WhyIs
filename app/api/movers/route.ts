import { NextResponse, NextRequest } from "next/server";

const YF = "https://query2.finance.yahoo.com";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://finance.yahoo.com",
  "Origin": "https://finance.yahoo.com",
};

// Ticker pools per market — key is the `market` query param
const MARKET_TICKERS: Record<string, Record<string, string>> = {
  us: {
    AAPL: "Apple", NVDA: "NVIDIA", TSLA: "Tesla", MSFT: "Microsoft",
    AMZN: "Amazon", META: "Meta", GOOGL: "Alphabet", AMD: "AMD",
    NFLX: "Netflix", SPY: "S&P 500 ETF", QQQ: "Nasdaq ETF",
    JPM: "JPMorgan", BAC: "Bank of America", V: "Visa", MA: "Mastercard",
    DIS: "Disney", UBER: "Uber", SHOP: "Shopify",
    PLTR: "Palantir", COIN: "Coinbase", INTC: "Intel", PYPL: "PayPal",
    SNAP: "Snap Inc", RBLX: "Roblox",
  },
  se: {
    "ERIC-B.ST": "Ericsson", "VOLV-B.ST": "Volvo", "ABB.ST": "ABB",
    "INVE-B.ST": "Investor", "ASSA-B.ST": "Assa Abloy", "HEXA-B.ST": "Hexagon",
    "SAND.ST": "Sandvik", "ATCO-A.ST": "Atlas Copco", "SEB-A.ST": "SEB",
    "SHB-A.ST": "Handelsbanken", "SWED-A.ST": "Swedbank", "ESSITY-B.ST": "Essity",
    "ALFA.ST": "Alfa Laval", "SKF-B.ST": "SKF", "TELIA.ST": "Telia",
    "BOLI.ST": "Boliden", "HM-B.ST": "H&M", "KINV-B.ST": "Kinnevik",
    "SINCH.ST": "Sinch", "SAAB-B.ST": "Saab", "NIBE-B.ST": "NIBE",
    "ELUX-B.ST": "Electrolux", "SWMA.ST": "Swedish Match", "TEL2-B.ST": "Tele2",
  },
  cn: {
    "BABA": "Alibaba", "JD": "JD.com", "PDD": "PDD Holdings",
    "BIDU": "Baidu", "NIO": "NIO", "LI": "Li Auto", "XPEV": "XPeng",
    "BILI": "Bilibili", "TME": "Tencent Music", "ZTO": "ZTO Express",
  },
  jp: {
    "7203.T": "Toyota", "6758.T": "Sony", "6902.T": "Denso",
    "9984.T": "SoftBank", "6861.T": "Keyence", "8306.T": "MUFJ",
    "7741.T": "HOYA", "6367.T": "Daikin", "4063.T": "Shin-Etsu",
    "8035.T": "Tokyo Electron",
  },
  uk: {
    "SHEL.L": "Shell", "AZN.L": "AstraZeneca", "HSBA.L": "HSBC",
    "ULVR.L": "Unilever", "BP.L": "BP", "RIO.L": "Rio Tinto",
    "GSK.L": "GSK", "DGE.L": "Diageo", "LSEG.L": "LSEG",
    "BATS.L": "BAT",
  },
  de: {
    "SAP.DE": "SAP", "SIE.DE": "Siemens", "ALV.DE": "Allianz",
    "DTE.DE": "Deutsche Telekom", "MBG.DE": "Mercedes-Benz",
    "BMW.DE": "BMW", "BAS.DE": "BASF", "MUV2.DE": "Munich Re",
    "ADS.DE": "Adidas", "IFX.DE": "Infineon",
  },
  in: {
    "RELIANCE.NS": "Reliance", "TCS.NS": "TCS", "INFY.NS": "Infosys",
    "HDFCBANK.NS": "HDFC Bank", "ICICIBANK.NS": "ICICI Bank",
    "BHARTIARTL.NS": "Bharti Airtel", "ITC.NS": "ITC",
    "SBIN.NS": "SBI", "LT.NS": "L&T", "WIPRO.NS": "Wipro",
  },
};

// Map exchange strings / ticker suffixes to a market key
function resolveMarket(exchange: string, ticker: string): string {
  const ex = exchange.toLowerCase();
  const t = ticker.toUpperCase();

  if (t.endsWith(".ST")) return "se";
  if (t.endsWith(".T")) return "jp";
  if (t.endsWith(".L")) return "uk";
  if (t.endsWith(".DE")) return "de";
  if (t.endsWith(".NS") || t.endsWith(".BO")) return "in";
  if (t.endsWith(".SS") || t.endsWith(".SZ")) return "cn";

  if (ex.includes("stockholm") || ex.includes("omx")) return "se";
  if (ex.includes("london") || ex.includes("lse")) return "uk";
  if (ex.includes("xetra") || ex.includes("frankfurt") || ex.includes("fse")) return "de";
  if (ex.includes("tokyo") || ex.includes("tse")) return "jp";
  if (ex.includes("shanghai") || ex.includes("shenzhen") || ex.includes("hong kong")) return "cn";
  if (ex.includes("nse") || ex.includes("bse") || ex.includes("bombay") || ex.includes("india")) return "in";

  return "us";
}

export const revalidate = 300;

interface MoverResult {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
}

async function fetchTicker(ticker: string, nameMap: Record<string, string>): Promise<MoverResult | null> {
  try {
    const res = await fetch(
      `${YF}/v8/finance/chart/${ticker}?interval=1d&range=1d&includePrePost=false`,
      { headers: HEADERS, next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta ?? {};
    const price: number = meta.regularMarketPrice ?? 0;
    const prev: number = meta.chartPreviousClose ?? meta.previousClose ?? 0;
    if (!price || !prev) return null;
    return {
      ticker,
      name: nameMap[ticker] ?? ticker,
      price,
      changePercent: ((price - prev) / prev) * 100,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const marketParam = searchParams.get("market") ?? "";
    const exchange = searchParams.get("exchange") ?? "";
    const ticker = searchParams.get("ticker") ?? "";

    // Determine which market pool to use
    let market = marketParam.toLowerCase();
    if (!market || !MARKET_TICKERS[market]) {
      market = resolveMarket(exchange, ticker);
    }

    const pool = MARKET_TICKERS[market] ?? MARKET_TICKERS.us;
    const results = await Promise.all(
      Object.keys(pool).map((t) => fetchTicker(t, pool))
    );

    const movers = results
      .filter((r): r is MoverResult => r !== null)
      .sort((a, b) => b.changePercent - a.changePercent);

    const gainers = movers.slice(0, 5);
    const losers = [...movers].reverse().slice(0, 5);

    return NextResponse.json({ gainers, losers, market });
  } catch (err) {
    console.error("[/api/movers]", err);
    return NextResponse.json({ gainers: [], losers: [], market: "us" }, { status: 500 });
  }
}
