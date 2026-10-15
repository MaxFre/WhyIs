import { AISummaryResult, IndexQuote, MarketContext, NewsArticle, StockQuote } from "@/types";
import { cacheGet, cacheSet, TTL } from "./cache";

interface Catalyst {
  article: NewsArticle;
  category: string;
  mechanism: string;
  tone: "positive" | "negative" | "neutral";
}

export async function generateAISummary(
  quote: StockQuote,
  news: NewsArticle[],
  marketCtx: MarketContext
): Promise<AISummaryResult> {
  const cacheKey = `summary:v2:${quote.ticker}`;
  const signature = JSON.stringify([quote, news, marketCtx]);
  const cached = cacheGet<{ signature: string; result: AISummaryResult }>(cacheKey);
  if (cached?.signature === signature) return { ...cached.result, cached: true };

  const quoteTime = Number.isFinite(quote.timestamp) && quote.timestamp > 0 ? quote.timestamp : Date.now();
  const sessionDate = new Date(quoteTime).toISOString().slice(0, 10);
  const seed = hashText(`${quote.ticker}:${sessionDate}:${quote.changePercent.toFixed(1)}:${news.map(article => article.headline).join("|")}`);
  const pick = (texts: string[], offset = 0) => choose(texts, seed, offset);
  const flat = Math.abs(quote.changePercent) < 0.1;
  const up = quote.changePercent > 0;
  const direction = flat ? "little changed" : up ? "higher" : "lower";
  const move = Math.abs(quote.changePercent).toFixed(2);
  const price = formatPrice(quote.price, quote.currency);
  const previousClose = formatPrice(quote.previousClose, quote.currency);
  const benchmark = getBenchmark(quote, marketCtx.indices);
  const relativeMove = benchmark ? quote.changePercent - benchmark.changePercent : null;
  const alignedMarket = !flat && benchmark && Math.abs(benchmark.changePercent) >= 0.2 && Math.sign(benchmark.changePercent) === Math.sign(quote.changePercent);
  const domesticSector = !quote.ticker.includes(".") || quote.ticker === "BRK.B";
  const sector = marketCtx.sectorPerf && Number.isFinite(marketCtx.sectorPerf.changePercent) ? marketCtx.sectorPerf : null;
  const alignedSector = !flat && domesticSector && sector && Math.abs(sector.changePercent) >= 0.2 && Math.sign(sector.changePercent) === Math.sign(quote.changePercent);

  const seen = new Set<string>();
  const recentNews = news.filter(article => {
    const published = Date.parse(article.publishedAt);
    const title = article.headline.trim().toLowerCase();
    if (!title || seen.has(title) || !Number.isFinite(published) || published > Math.min(Date.now(), quoteTime) || quoteTime - published > 72 * 60 * 60 * 1000) return false;
    seen.add(title);
    return true;
  }).sort((first, second) => Date.parse(second.publishedAt) - Date.parse(first.publishedAt));
  const catalysts = recentNews
    .filter(article => mentionsCompany(article.headline, quote))
    .map(getCatalyst)
    .filter((catalyst): catalyst is Catalyst => catalyst !== null);
  const expectedTone = up ? "positive" : "negative";
  const lead = catalysts[0];
  const opposing = !flat && catalysts.find(catalyst => catalyst !== lead && catalyst.tone !== "neutral" && catalyst.tone !== (lead?.tone === "neutral" ? expectedTone : lead?.tone));
  const leadMatches = !flat && lead?.tone === expectedTone;

  let headline: string;
  let explanation: string;
  const keyReasons: string[] = [];
  if (flat) {
    headline = pick([
      `${quote.name} is little changed: no decisive price move`,
      `${quote.ticker} holds near its previous close`,
      `A quiet session for ${quote.name}: price is near the prior close`,
      `${quote.name}: a small move, not a clear directional signal`,
    ]);
    explanation = pick([
      `The change is below 0.10%, so describing this as a meaningful rally or sell-off would overstate the move.`,
      `Price is close to the prior close; the available data does not show a strong directional reaction.`,
      `This is effectively flat trading. A headline may still matter, but the price move alone does not show that investors have reacted decisively.`,
    ], 1);
  } else if (lead) {
    headline = leadMatches ? pick([
      `${quote.name} ${up ? "gains" : "drops"} ${move}% with ${lead.category} in focus`,
      `${lead.category[0].toUpperCase()}${lead.category.slice(1)} offers a possible explanation for ${quote.ticker}'s ${move}% move`,
      `${quote.ticker} trades ${direction} with recent ${lead.category} in the picture`,
      `${quote.name}: ${lead.category} is a plausible driver of the ${up ? "advance" : "decline"}`,
    ]) : pick([
      `${quote.name} moves ${direction} ${move}%, but the news signal is inconclusive`,
      `${quote.ticker}'s ${move}% move is not fully explained by the latest headlines`,
      `${quote.name}: price and headline tone do not give a simple answer`,
      `What explains ${quote.ticker}'s ${move}% move? The evidence is mixed`,
    ]);
    const leadAge = quoteTime - Date.parse(lead.article.publishedAt);
    const evidence = `${lead.article.source} reported "${lead.article.headline}"${leadAge > 24 * 60 * 60 * 1000 ? " within the past three days, rather than this session" : " within the last 24 hours"}.`;
    const interpretation = leadMatches ? pick([
      `Its ${lead.tone} wording is consistent with the price direction, making it a plausible contributor, not a confirmed cause.`,
      `The headline points in the same direction as the stock; it is a candidate explanation rather than proof of what drove the trade.`,
      `This is the strongest matching event in the available feed, although timing and headline tone alone cannot establish causation.`,
      `The event could help explain the move, but the feed does not measure how much of the price change it accounts for.`,
    ], 2) : lead.tone === "neutral" ? pick([
      `The headline does not establish how this development compares with expectations, so it cannot explain the direction by itself.`,
      `Its effect is ambiguous: the feed lacks enough detail about expectations to attribute the move to this event.`,
      `This event is relevant context, but there is no clear directional signal in the available wording.`,
    ], 2) : pick([
      `Its ${lead.tone} wording runs against the stock's direction, so it is not a convincing explanation on its own.`,
      `The headline tone and price action disagree. Other information or the wider market may matter, but this feed cannot identify that with confidence.`,
      `This coverage is a counter-signal rather than a straightforward reason for the ${up ? "gain" : "decline"}.`,
    ], 2);
    explanation = `${evidence} ${lead.mechanism} ${interpretation}`;
    keyReasons.push(`${lead.category[0].toUpperCase()}${lead.category.slice(1)}: ${lead.article.headline} (${lead.article.source}); ${leadMatches ? "consistent with the move, not confirmed causation" : "directional impact is unclear or conflicting"}.`);
  } else if (alignedMarket || alignedSector) {
    const backdrop = alignedSector ? `${sector!.sector} sector` : benchmark!.name;
    headline = pick([
      `${quote.name} moves ${direction} with the ${backdrop}`,
      `${quote.ticker}'s ${move}% move tracks a wider ${up ? "advance" : "pullback"}`,
      `${quote.name}: the broader backdrop offers a possible explanation`,
      `A ${up ? "tailwind" : "headwind"} from the ${backdrop} for ${quote.ticker}`,
    ]);
    explanation = pick([
      `No fresh, identifiable company event stands out in the available headlines. The stock is moving in the same direction as the ${backdrop}, making shared market pressure a plausible contributor rather than a verified cause.`,
      `The available feed does not identify a company-specific catalyst. A move alongside the ${backdrop} points to a possible broader influence, although matching direction alone is not enough to explain the full change.`,
      `The clearest evidence is the shared direction with the ${backdrop}, not a confirmed company announcement. This supports a market-context explanation, with limited certainty about the actual driver.`,
    ], 3);
  } else {
    headline = pick([
      `${quote.name} moves ${direction} ${move}% without a clear catalyst`,
      `${quote.ticker}'s ${move}% move: the cause is not clear from this feed`,
      `${quote.name}: a price move with limited explanatory evidence`,
      `No clear news explanation for ${quote.ticker}'s ${up ? "gain" : "decline"}`,
    ]);
    explanation = pick([
      `The available headlines do not identify a fresh company event that explains the direction. It would be speculative to label this profit-taking, bargain buying, or a reaction to earnings without additional evidence.`,
      `There is no clear company-specific catalyst in the recent feed. Price action alone cannot tell us whether positioning, an unreported event, or another factor drove the move.`,
      `The data confirms the price change, not its cause. No fresh, identifiable event in this feed supports a confident explanation.`,
      `A move is visible, but a reliable reason is not. The latest coverage is insufficient to attribute it to a specific announcement or investor motive.`,
    ], 4);
  }

  const comparisons: string[] = [];
  if (benchmark && relativeMove !== null) {
    const comparison = Math.abs(relativeMove) < 0.3
      ? `That is close to the benchmark's move, consistent with a shared market influence.`
      : `The stock is ${relativeMove > 0 ? "outperforming" : "underperforming"} by ${Math.abs(relativeMove).toFixed(2)} percentage points. ${alignedMarket ? "The wider market may explain part of the direction, but not the full size of the move." : "The divergence argues against a simple market-only explanation; it does not identify a company catalyst."}`;
    const fact = `${benchmark.name} is ${signedPercent(benchmark.changePercent)} versus ${signedPercent(quote.changePercent)} for ${quote.ticker}.`;
    comparisons.push(pick([`${fact} ${comparison}`, `Against the local benchmark, ${fact} ${comparison}`, `${comparison} For context, ${fact}`], 5));
    keyReasons.push(`${benchmark.name}: ${signedPercent(benchmark.changePercent)}; stock ${relativeMove >= 0 ? "+" : ""}${relativeMove.toFixed(2)} percentage points relative to the index.`);
  } else {
    comparisons.push(`A suitable local benchmark is unavailable in this feed, so a broad-market explanation cannot be assessed reliably.`);
  }
  if (sector) {
    const fact = `${domesticSector ? "The" : "The US"} ${sector.sector} sector proxy is ${signedPercent(sector.changePercent)}.`;
    const relationship = !domesticSector ? `This is overseas context, not a direct measure of ${quote.ticker}'s local peers.`
      : flat || Math.abs(sector.changePercent) < 0.2 ? `There is no strong shared directional signal here.`
      : alignedSector ? `Its direction supports a possible sector-wide influence; it does not confirm a company-specific cause.`
      : `The stock is moving against this proxy, making sector direction alone an insufficient explanation.`;
    comparisons.push(`${fact} ${relationship}`);
    keyReasons.push(`${domesticSector ? "Sector" : "US sector proxy"}: ${sector.sector} ${signedPercent(sector.changePercent)}; ${relationship}`);
  }
  if (opposing) {
    const counter = `The feed also includes "${opposing.article.headline}" (${opposing.article.source}), with a contrasting ${opposing.tone} signal. The news evidence is therefore mixed.`;
    explanation += ` ${counter}`;
    keyReasons.push(counter);
  }
  const volumeKnown = Number.isFinite(quote.avgVolume) && quote.avgVolume > 0 && Number.isFinite(quote.volume) && quote.volume > 0;
  let volumeSentence: string;
  if (volumeKnown) {
    const ratio = quote.volume / quote.avgVolume;
    volumeSentence = pick([
      `Reported volume is ${ratio.toFixed(2)}x the full-day average.`,
      `Trading volume so far equals ${ratio.toFixed(2)}x an average full day.`,
      `${quote.ticker}'s reported share turnover is ${ratio.toFixed(2)}x average daily volume.`,
    ], 6) + (ratio > 1.3
      ? ` Activity is elevated, but volume does not reveal why investors traded or prove the move will last.`
      : ` An unfinished session can look light against a full-day average; this is not a time-adjusted activity measure.`);
    if (ratio > 1.3) keyReasons.push(`Participation: ${ratio.toFixed(2)}x average daily volume; elevated activity, not proof of a cause.`);
  } else {
    volumeSentence = `Reliable volume comparisons are unavailable, so participation cannot be used to strengthen this explanation.`;
  }
  const priceSentence = pick([
    `${quote.name} (${quote.ticker}) is ${direction} at ${price}, ${signedPercent(quote.changePercent)} from the previous close of ${previousClose}.`,
    `At ${price}, ${quote.ticker} has changed ${signedPercent(quote.changePercent)} versus its previous close of ${previousClose}.`,
    `${quote.ticker} is trading at ${price}, compared with ${previousClose} at the prior close: a ${signedPercent(quote.changePercent)} change.`,
    `The latest quote puts ${quote.name} at ${price}, ${direction} by ${move}% from ${previousClose}.`,
  ], 7);
  const coverage = catalysts.length === 0 && recentNews.length > 0
    ? ` Recent coverage exists, but it is not a clear, identifiable company event; a price-only or general-market headline is not proof of a catalyst.` : "";
  const paragraphs = [priceSentence, `${explanation}${coverage}`, comparisons.join(" "), volumeSentence];
  if (seed % 2 === 0 && !lead) [paragraphs[1], paragraphs[2]] = [paragraphs[2], paragraphs[1]];
  const result: AISummaryResult = {
    headline,
    summary: paragraphs.join("\n\n"),
    keyReasons: keyReasons.length ? keyReasons.slice(0, 6) : [flat ? "Price is effectively flat; no strong directional reaction." : "No clear cause established by the available news and benchmark data."],
    generatedAt: new Date().toISOString(),
    cached: false,
  };
  cacheSet(cacheKey, { signature, result }, TTL.AI_SUMMARY);
  return result;
}

function getBenchmark(quote: StockQuote, indices: IndexQuote[]): IndexQuote | undefined {
  const suffix = quote.ticker.includes(".") ? quote.ticker.split(".").pop()! : "";
  const symbols: Record<string, string> = { ST: "^OMX", T: "^N225", L: "^FTSE", HK: "^HSI", SS: "000001.SS", NS: "^NSEI", BO: "^NSEI", DE: "^GDAXI" };
  const usBenchmark = quote.sector === "Technology" || /^(NMS|NGM|NCM|NASDAQ)$/i.test(quote.exchange) ? "^IXIC" : "^GSPC";
  const symbol = symbols[suffix] ?? ((!suffix || quote.ticker === "BRK.B") ? usBenchmark : undefined);
  return indices.find(index => index.symbol === symbol && Number.isFinite(index.changePercent));
}

function mentionsCompany(headline: string, quote: StockQuote): boolean {
  const aliases: Record<string, string> = { GOOGL: "Google", GOOG: "Google", META: "Facebook" };
  const companyName = quote.name.replace(/\s+(inc\.?|corp\.?|corporation|company|limited|holdings?|group|plc|class.*)$/i, "").trim();
  const firstName = companyName.split(/\s+/)[0];
  const names = [quote.ticker, quote.ticker.split(".")[0], aliases[quote.ticker], companyName, firstName].filter((name): name is string => Boolean(name));
  return names.some(name => {
    if (/^(the|advanced|international|global|united|general|first)$/i.test(name)) return false;
    const flags = name.length <= 3 ? "" : "i";
    return new RegExp(`(^|[^a-zA-Z0-9])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-zA-Z0-9]|$)`, flags).test(headline);
  });
}

function getCatalyst(article: NewsArticle): Catalyst | null {
  const text = article.headline;
  const categories = [
    { pattern: /\b(earnings|guidance|results|eps|revenue|profits?)\b/i, category: "earnings and outlook", mechanism: "Earnings and guidance can change expectations for future profits and the valuation investors are willing to pay." },
    { pattern: /\b(upgrade[ds]?|downgrade[ds]?|price target|analyst|rating)\b/i, category: "analyst coverage", mechanism: "Rating and target changes can influence valuation expectations, although they are opinions rather than changes to reported earnings." },
    { pattern: /\b(acquisition|acquire[ds]?|merger|takeover|buyout)\b/i, category: "deal news", mechanism: "A deal can change expected growth, financing needs, and execution risk; the terms matter more than the announcement alone." },
    { pattern: /\b(launch(?:es|ed)?|approval|approved|contract|partnership|orders?|product)\b/i, category: "business developments", mechanism: "Products, approvals, and commercial agreements can alter future sales expectations, but their financial scale still needs to be established." },
    { pattern: /\b(dividend|buyback|repurchase|offering|dilution|stock split)\b/i, category: "capital decisions", mechanism: "Capital decisions can affect share supply, cash returns, or the quoted price; a mechanical adjustment need not reflect a change in business value." },
    { pattern: /\b(lawsuit|investigation|recall|regulator|regulatory|fine[ds]?)\b/i, category: "legal and regulatory news", mechanism: "Legal or regulatory developments can change expected costs and business risk, depending on their outcome and scope." },
    { pattern: /\b(inflation|interest rates?|bond yields?|federal reserve|fed rate|rate cuts?|rate hikes?)\b/i, category: "inflation and rates", mechanism: "Inflation and interest-rate news can affect financing costs and the discount rates applied to future profits. Growth-stock valuations can be sensitive to these changes, but the headline alone does not quantify the effect." },
    { pattern: /\b(tariffs?|export (?:ban|restrictions?|controls?)|sanctions?)\b/i, category: "trade policy", mechanism: "Trade restrictions can change access to customers, supply-chain costs, and expected revenue. Exposure depends on the company's business and the actual policy terms." },
  ];
  const event = categories.find(category => category.pattern.test(text));
  if (!event) return null;
  const positive = /\b(beat[s]?|topped|raises? (?:guidance|outlook|forecast|price target)|raised (?:guidance|outlook|forecast|price target)|upgrade[ds]?|approved|approval|wins?|secures?|record (?:revenue|profit)|cool(?:er|ing) inflation)\b/i.test(text);
  const negative = /\b(miss(?:es|ed)?|cuts? (?:guidance|outlook|forecast|price target)|lower(?:s|ed)? (?:guidance|outlook|forecast|price target)|downgrade[ds]?|lawsuit|investigation|recall|dilution|hot(?:ter)? inflation|inflation (?:rises|accelerates))\b/i.test(text);
  const uncertain = /\b(could|may|might|expected to|set to|preview|ahead of|will|forecast to|no|not|avoids?|without|denies?|dismiss(?:es|ed)?|settles?|settled)\b|\?/i.test(text);
  const tone = uncertain || positive === negative ? "neutral" : positive ? "positive" : "negative";
  return { article, category: event.category, mechanism: event.mechanism, tone };
}

function formatPrice(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function signedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function choose<T>(items: T[], seed: number, offset = 0): T {
  return items[hashText(`${seed}:${offset}`) % items.length];
}

function hashText(text: string): number {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) | 0;
  return hash >>> 0;
}
