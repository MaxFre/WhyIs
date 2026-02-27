import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "WhyIs terms of service — rules and guidelines for using our website.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-extrabold mb-8">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using WhyIs (&quot;the Service&quot;), operated at{" "}
            <strong className="text-white">whyisstock.com</strong>, you agree to be bound by
            these Terms of Service. If you do not agree, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Description of Service</h2>
          <p>
            WhyIs provides real-time stock market data, news aggregation, and automated
            explanations of stock price movements. The Service is provided &quot;as is&quot; and
            is intended for informational and educational purposes only.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Not Financial Advice</h2>
          <p>
            <strong className="text-red-400">The content on WhyIs does not constitute financial,
            investment, trading, or any other form of professional advice.</strong> All information
            is provided for general informational purposes. You should consult a qualified
            financial advisor before making any investment decisions.
          </p>
          <p className="mt-2">
            We do not guarantee the accuracy, completeness, or timeliness of any data displayed.
            Stock prices, news, and AI-generated summaries may contain errors or delays.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. User Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to scrape, crawl, or bulk-download data from the Service</li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Impersonate any person or entity</li>
            <li>Use automated tools to access the Service beyond normal browsing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Intellectual Property</h2>
          <p>
            The WhyIs name, logo, design, and original content are the property of WhyIs Finance.
            Stock data is sourced from third-party providers and remains the property of those
            providers. You may not reproduce, distribute, or create derivative works without
            written permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Third-Party Content</h2>
          <p>
            The Service displays news headlines and links from third-party sources. We are not
            responsible for the accuracy or content of external websites. Links to third-party
            sites do not imply endorsement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, WhyIs and its operators shall not be liable
            for any indirect, incidental, special, consequential, or punitive damages, including
            but not limited to loss of profits, data, or financial losses arising from your use
            of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Disclaimer of Warranties</h2>
          <p>
            The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis
            without warranties of any kind, whether express or implied, including but not limited
            to implied warranties of merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">9. Modifications</h2>
          <p>
            We reserve the right to modify or discontinue the Service at any time without notice.
            We may also revise these Terms at any time. Continued use after changes constitutes
            acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">10. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of Sweden,
            without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mt-8 mb-3">11. Contact Us</h2>
          <p>
            If you have questions about these Terms, please contact us at{" "}
            <strong className="text-white">support@whyisstock.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
