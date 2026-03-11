import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import CookieConsent from "@/components/CookieConsent";
import AdSenseLoader from "@/components/AdSenseLoader";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | WhyIs — Stock Movement Explained",
    default: "WhyIs — Why Is Your Stock Up or Down Today?",
  },
  description:
    "Real-time AI-powered explanations for daily stock price movements. Find out why any stock is up or down today — US, Europe, and Asian markets.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.whyisstock.com"
  ),
  openGraph: {
    siteName: "WhyIs",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhyIs — Why Is Your Stock Up or Down Today?",
    description:
      "AI-powered explanations for daily stock movements. Search any ticker.",
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
      <head>
        <meta name="google-adsense-account" content={process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-3379757990050247"} />
      </head>
      <body>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <CookieConsent />
        <AdSenseLoader />
        <Analytics />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-green-400">Why</span>
          <span className="text-white">Is</span>
          <span className="text-xs font-normal text-gray-500 hidden sm:block">
            — stock movements explained
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/markets" className="hover:text-white transition-colors">
            Markets
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
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
      <nav className="mt-4 flex flex-wrap justify-center gap-4 text-gray-500">
        <Link href="/about" className="hover:text-white transition-colors">About</Link>
        <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
      </nav>
      <p className="mt-4">&copy; {new Date().getFullYear()} WhyIs Finance</p>
    </footer>
  );
}
