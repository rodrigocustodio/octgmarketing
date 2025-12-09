import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Terms and Conditions | OCTG Index"
        description="Terms and conditions governing your use of the OCTG Index website and services."
        canonical="https://octgindex.com/terms"
      />
      <Header />
      
      <main className="container py-12">
        <article className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
          <h1 className="font-display text-4xl font-bold tracking-tight mb-4">Terms and Conditions</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 9, 2024</p>
          
          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Welcome to OCTG Index, operated by OCTG Marketing Group. By accessing and using our website at octgindex.com ("Site"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use our Site.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              We reserve the right to modify these Terms at any time. Your continued use of the Site following any changes constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">2. Description of Services</h2>
            <p className="text-foreground/90 leading-relaxed">
              OCTG Index provides news, analysis, and information related to the oil country tubular goods (OCTG) industry, including market updates, company directories, executive profiles, and industry insights. Our content is intended for informational purposes only and should not be construed as professional advice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">3. Intellectual Property Rights</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              All content on this Site, including but not limited to text, graphics, logos, images, data compilations, and software, is the property of OCTG Marketing Group or its content suppliers and is protected by international copyright laws.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              You may not reproduce, distribute, modify, create derivative works from, publicly display, or exploit any content from this Site without our prior written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">4. User Conduct</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              When using our Site, you agree not to:
            </p>
            <ul className="list-disc pl-6 text-foreground/90">
              <li>Use the Site for any unlawful purpose or in violation of any applicable laws</li>
              <li>Attempt to gain unauthorized access to any portion of the Site or any systems or networks connected to the Site</li>
              <li>Interfere with or disrupt the operation of the Site or servers or networks connected to the Site</li>
              <li>Use any robot, spider, or other automated device to access the Site</li>
              <li>Collect or harvest any personally identifiable information from the Site</li>
              <li>Transmit any viruses, malware, or other harmful code</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">5. Disclaimer of Warranties</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              THE SITE AND ALL CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              We do not warrant that the Site will be uninterrupted, error-free, or free of viruses or other harmful components. We make no representations about the accuracy, reliability, completeness, or timeliness of any content on the Site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              TO THE FULLEST EXTENT PERMITTED BY LAW, OCTG MARKETING GROUP AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SITE.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              Our total liability for any claims arising from your use of the Site shall not exceed the amount you paid to us, if any, for accessing the Site during the twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">7. Investment and Financial Disclaimer</h2>
            <p className="text-foreground/90 leading-relaxed mb-4">
              The information provided on OCTG Index, including stock prices, market data, and industry analysis, is for informational purposes only and does not constitute financial, investment, or trading advice.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              We are not a registered investment advisor, broker-dealer, or financial planner. Always consult with qualified financial professionals before making any investment decisions. Past performance is not indicative of future results.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">8. Third-Party Links</h2>
            <p className="text-foreground/90 leading-relaxed">
              Our Site may contain links to third-party websites. These links are provided for your convenience only. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites. Your use of third-party websites is at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">9. Indemnification</h2>
            <p className="text-foreground/90 leading-relaxed">
              You agree to indemnify, defend, and hold harmless OCTG Marketing Group and its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or related to your use of the Site or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">10. Governing Law</h2>
            <p className="text-foreground/90 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the courts located in the United States.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">11. Severability</h2>
            <p className="text-foreground/90 leading-relaxed">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">12. Contact Information</h2>
            <p className="text-foreground/90 leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-foreground/90 leading-relaxed mt-4">
              <strong>OCTG Marketing Group</strong><br />
              Email: legal@octgindex.com
            </p>
          </section>
        </article>
      </main>
      
      <Footer />
    </div>
  );
}
