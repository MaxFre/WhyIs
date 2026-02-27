import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "WhyIs privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-extrabold mb-8">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Introduction</h2>
          <p>
            WhyIs (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the website{" "}
            <strong className="text-white">whyisstock.com</strong>. This Privacy Policy explains
            how we collect, use, disclose, and safeguard your information when you visit our website.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              <strong className="text-white">Usage Data:</strong> Pages visited, time spent, referral
              source, browser type, device type, and IP address — collected automatically via{" "}
              <strong className="text-white">Vercel Analytics</strong>.
            </li>
            <li>
              <strong className="text-white">Search Queries:</strong> Stock tickers and company names
              you search on our site. These are not linked to your identity.
            </li>
            <li>
              <strong className="text-white">Cookies:</strong> We use essential cookies and may use
              third-party cookies from Google AdSense to serve relevant ads.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and maintain our service</li>
            <li>To analyze usage patterns and improve the website</li>
            <li>To serve relevant advertisements through Google AdSense</li>
            <li>To detect and prevent technical issues</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              <strong className="text-white">Vercel Analytics</strong> — privacy-friendly website
              analytics that does not use cookies for tracking.
            </li>
            <li>
              <strong className="text-white">Google AdSense</strong> — may use cookies to serve ads
              based on your interests. You can opt out at{" "}
              <a href="https://www.google.com/settings/ads" className="text-green-400 underline" target="_blank" rel="noopener noreferrer">
                Google&apos;s Ads Settings
              </a>.
            </li>
            <li>
              <strong className="text-white">Yahoo Finance</strong> — we fetch publicly available
              stock data. No personal data is shared with Yahoo.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Cookies</h2>
          <p>
            Cookies are small files stored on your device. We use:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong className="text-white">Essential cookies</strong> — required for the website to function.</li>
            <li><strong className="text-white">Analytics cookies</strong> — help us understand how visitors use the site.</li>
            <li><strong className="text-white">Advertising cookies</strong> — used by Google AdSense to serve relevant ads.</li>
          </ul>
          <p className="mt-2">
            You can control cookies through your browser settings. Disabling cookies may affect
            your experience on the site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Data Retention</h2>
          <p>
            We do not store personal data on our servers. Analytics data is retained by Vercel
            in accordance with their privacy policy. Ad-related data is managed by Google.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Access the personal data we hold about you</li>
            <li>Request correction or deletion of your data</li>
            <li>Object to or restrict processing</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Children&apos;s Privacy</h2>
          <p>
            Our service is not directed to anyone under the age of 13. We do not knowingly
            collect personal information from children.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this
            page with an updated &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at{" "}
            <strong className="text-white">support@whyisstock.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
