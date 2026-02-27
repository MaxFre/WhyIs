import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About WhyIs",
  description:
    "Learn about WhyIs — a free tool that explains why stocks are moving up or down today using real-time data and AI analysis.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-extrabold mb-8">About WhyIs</h1>

      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">What is WhyIs?</h2>
          <p>
            <strong className="text-white">WhyIs</strong> is a free stock analysis tool that
            answers one simple question:{" "}
            <em className="text-green-400">&quot;Why is this stock up or down today?&quot;</em>
          </p>
          <p className="mt-2">
            We combine real-time price data, the latest news, market context, and AI-powered
            analysis to give you a clear, plain-English explanation of what&apos;s driving any
            stock&apos;s movement — in seconds.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">How It Works</h2>
          <ol className="list-decimal pl-6 space-y-3 mt-2">
            <li>
              <strong className="text-white">Search any stock</strong> — type a ticker symbol or
              company name (e.g. &quot;AAPL&quot;, &quot;Tesla&quot;, &quot;Volvo&quot;).
            </li>
            <li>
              <strong className="text-white">Real-time data</strong> — we fetch the latest price,
              volume, and intraday chart from financial data providers.
            </li>
            <li>
              <strong className="text-white">News aggregation</strong> — recent headlines about the
              company are gathered and analyzed for sentiment.
            </li>
            <li>
              <strong className="text-white">AI summary</strong> — all data is combined into a
              concise explanation of why the stock is moving.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">Markets We Cover</h2>
          <p>
            WhyIs supports stocks from the world&apos;s largest exchanges:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong className="text-white">United States</strong> — NYSE, NASDAQ</li>
            <li><strong className="text-white">China</strong> — Shanghai Stock Exchange, Hong Kong</li>
            <li><strong className="text-white">Japan</strong> — Tokyo Stock Exchange</li>
            <li><strong className="text-white">United Kingdom</strong> — London Stock Exchange</li>
            <li><strong className="text-white">India</strong> — NSE, BSE</li>
            <li><strong className="text-white">Germany</strong> — XETRA, Frankfurt</li>
            <li><strong className="text-white">Sweden</strong> — Nasdaq Stockholm</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">Our Mission</h2>
          <p>
            Financial markets can be confusing. Every day, millions of investors wonder why their
            stocks are going up or down. Most financial sites show you the numbers but don&apos;t
            explain <em>why</em>.
          </p>
          <p className="mt-2">
            WhyIs bridges that gap. We believe everyone deserves a quick, understandable
            explanation of market movements — free, no sign-up required.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">Important Disclaimer</h2>
          <p>
            WhyIs is for <strong className="text-white">informational and educational purposes
            only</strong>. Nothing on this site constitutes financial advice. Always consult a
            qualified financial advisor before making investment decisions. We do not guarantee
            the accuracy of any data or analysis presented.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">Contact</h2>
          <p>
            Have questions, feedback, or partnership inquiries?{" "}
            <a href="/contact" className="text-green-400 underline hover:text-green-300">
              Send us a message
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
