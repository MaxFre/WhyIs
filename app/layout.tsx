import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    template: "%s | WhyIs — Stock Movement Explained",
    default: "WhyIs — Why Is Your Stock Up or Down Today?",
  },
  description:
    "Real-time AI-powered explanations for daily stock price movements. Find out why any stock is up or down today.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://whyis.finance"
  ),
  openGraph: {
    siteName: "WhyIs",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-green-400">Why</span>
          <span className="text-white">Is</span>
          <span className="text-xs font-normal text-gray-500 hidden sm:block">
            — stock movements explained
          </span>
        </a>
        <nav className="flex items-center gap-6 text-sm text-gray-400">
          <a href="/" className="hover:text-white transition-colors">
            Home
          </a>
          <a href="/markets" className="hover:text-white transition-colors">
            Markets
          </a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-20 py-10 text-center text-xs text-gray-600">
      <p className="max-w-xl mx-auto">
        WhyIs is for informational purposes only.{" "}
        <strong className="text-gray-500">Not financial advice.</strong>{" "}
        Always do your own research before making investment decisions.
      </p>
      <p className="mt-2">© {new Date().getFullYear()} WhyIs Finance</p>
    </footer>
  );
}
