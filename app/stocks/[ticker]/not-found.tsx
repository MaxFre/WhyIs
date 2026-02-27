import TickerSearch from "@/components/TickerSearch";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <p className="text-6xl mb-4">📉</p>
      <h1 className="text-3xl font-bold mb-2">Ticker not found</h1>
      <p className="text-gray-400 mb-8">
        We couldn&apos;t find data for that ticker symbol. Make sure it&apos;s a valid US
        stock symbol (e.g. AAPL, TSLA).
      </p>
      <TickerSearch />
      <a
        href="/"
        className="block mt-6 text-sm text-gray-500 hover:text-white transition-colors"
      >
        ← Back to home
      </a>
    </div>
  );
}
