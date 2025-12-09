import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Privacy Policy | OCTG Index"
        description="OCTG Index privacy policy explains how we collect, use, and protect your personal information when you use our website and services."
        canonical="https://octgindex.com/privacy"
      />
      <Header />
      
      <main className="container py-12">
        <article className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
          <h1 className="font-display text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 9, 2024</p>
          
          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              OCTG Index ("we," "our," or "us"), operated by OCTG Marketing Group, is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website octgindex.com and use our services.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              Please read this privacy policy carefully. By using our website, you consent to the practices described in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="font-display text-xl font-medium mb-3">Personal Information</h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We may collect personal information that you voluntarily provide to us when you:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground/90">
              <li>Subscribe to our newsletter</li>
              <li>Contact us through our website</li>
              <li>Create an account (for authorized personnel only)</li>
              <li>Submit inquiries or feedback</li>
            </ul>
            <p className="text-foreground/90 leading-relaxed mb-4">
              This information may include your name, email address, company name, and any other information you choose to provide.
            </p>
            
            <h3 className="font-display text-xl font-medium mb-3">Automatically Collected Information</h3>
            <p className="text-foreground/90 leading-relaxed">
              When you visit our website, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies installed on your device. We also collect information about the pages you view, the websites that referred you, and how you interact with our site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-foreground/90">
              <li>Send you our newsletter and industry updates (with your consent)</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Improve and optimize our website and services</li>
              <li>Analyze usage patterns and trends</li>
              <li>Protect against fraudulent or unauthorized activity</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">4. Cookies and Tracking Technologies</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to collect and track information about your browsing activities. Cookies are small data files stored on your device that help us improve your experience on our website.
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We use Google Analytics to analyze website traffic and usage patterns. Google Analytics uses cookies to collect anonymous information about how visitors use our site.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-foreground/90">
              <li><strong>Service Providers:</strong> We may share information with third-party service providers who assist us in operating our website and delivering our services (e.g., email service providers, analytics providers).</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid legal requests.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-foreground/90 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-foreground/90">
              <li>The right to access your personal information</li>
              <li>The right to correct inaccurate information</li>
              <li>The right to request deletion of your information</li>
              <li>The right to opt-out of marketing communications</li>
              <li>The right to data portability</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">8. Third-Party Links</h2>
            <p className="text-foreground/90 leading-relaxed">
              Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-foreground/90 leading-relaxed">
              Our website is not intended for children under the age of 16. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-foreground/90 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-foreground/90 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-foreground/90 leading-relaxed mt-4">
              <strong>OCTG Marketing Group</strong><br />
              Email: privacy@octgindex.com
            </p>
          </section>
        </article>
      </main>
      
      <Footer />
    </div>
  );
}
