import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";

export default function NewsletterTerms() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Newsletter Terms | OCTG Index"
        description="Terms and conditions for subscribing to the OCTG Index newsletter and email communications."
        canonical="https://octgindex.com/newsletter-terms"
      />
      <Header />
      
      <main className="container py-12">
        <article className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
          <h1 className="font-display text-4xl font-bold tracking-tight mb-4">Newsletter Subscription Terms</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 9, 2024</p>
          
          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">1. Subscription Agreement</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              By subscribing to the OCTG Index newsletter, you agree to these Newsletter Subscription Terms ("Terms"). These Terms are in addition to our general Terms and Conditions and Privacy Policy, which also apply to your use of our newsletter service.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              OCTG Index, operated by OCTG Marketing Group, provides a newsletter service delivering industry news, market analysis, and updates related to the oil country tubular goods (OCTG) sector.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">2. Subscription Process</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              To subscribe to our newsletter, you must provide a valid email address. By submitting your email address, you:
            </p>
            <ul className="list-disc pl-6 text-foreground/90">
              <li>Confirm that you are at least 16 years of age</li>
              <li>Consent to receive electronic communications from OCTG Index</li>
              <li>Agree to these Terms and our Privacy Policy</li>
              <li>Represent that the email address provided belongs to you or that you have authorization to use it</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">3. Email Communications</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              As a subscriber, you will receive:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground/90">
              <li><strong>Newsletter Emails:</strong> Regular updates containing OCTG industry news, market analysis, and featured content</li>
              <li><strong>Breaking News Alerts:</strong> Occasional notifications about significant industry developments</li>
              <li><strong>Special Announcements:</strong> Information about new features, services, or important updates to OCTG Index</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed">
              We aim to provide valuable, relevant content and will not overwhelm your inbox with excessive emails. Typical frequency is one to three emails per week, though this may vary based on industry activity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">4. Data Collection and Use</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              When you subscribe to our newsletter, we collect and process the following information:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground/90">
              <li>Your email address</li>
              <li>Subscription date and time</li>
              <li>Email engagement metrics (opens, clicks) to improve content relevance</li>
              <li>IP address for security and fraud prevention</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed">
              This data is used solely for delivering and improving our newsletter service. For complete details on how we handle your data, please refer to our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">5. Third-Party Email Service</h2>
            <p className="text-foreground/90 leading-relaxed">
              We use third-party email service providers to manage and deliver our newsletter. These providers are bound by data processing agreements and are required to protect your information in accordance with applicable data protection laws. Your email address may be stored on servers located outside your country of residence.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">6. Unsubscribe Process</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              You may unsubscribe from our newsletter at any time by:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground/90">
              <li>Clicking the "Unsubscribe" link at the bottom of any newsletter email</li>
              <li>Contacting us directly at info@octgindex.com</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed">
              Unsubscribe requests are processed immediately. You may continue to receive emails that were already in queue at the time of your request, but no new emails will be sent after processing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">7. Content Disclaimer</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Newsletter content is provided for informational purposes only. While we strive for accuracy, we make no representations or warranties about the completeness, reliability, or accuracy of the information provided.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              Any market data, stock prices, or financial information included in our newsletters should not be considered financial advice. Always consult with qualified professionals before making investment decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">8. Intellectual Property</h2>
            <p className="text-foreground/90 leading-relaxed">
              All content in our newsletters, including text, images, and design elements, is protected by copyright and other intellectual property rights owned by OCTG Marketing Group. You may share individual newsletter articles for personal, non-commercial purposes with proper attribution, but you may not reproduce, distribute, or republish our content without prior written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">9. Modifications to Service</h2>
            <p className="text-foreground/90 leading-relaxed">
              We reserve the right to modify, suspend, or discontinue the newsletter service at any time without prior notice. We may also change the frequency, format, or content of our newsletters. We will make reasonable efforts to notify subscribers of any significant changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">10. Changes to These Terms</h2>
            <p className="text-foreground/90 leading-relaxed">
              We may update these Newsletter Subscription Terms from time to time. If we make material changes, we will notify you via email or through a notice in our newsletter. Your continued subscription after such notice constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-foreground/90 leading-relaxed">
              If you have any questions about these Newsletter Terms or our subscription service, please contact us at:
            </p>
            <p className="text-foreground/90 leading-relaxed mt-4">
              <strong>OCTG Marketing Group</strong><br />
              Email: info@octgindex.com
            </p>
          </section>
        </article>
      </main>
      
      <Footer />
    </div>
  );
}
