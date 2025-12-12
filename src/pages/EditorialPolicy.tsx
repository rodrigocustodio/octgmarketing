import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator,
  BreadcrumbPage
} from "@/components/ui/breadcrumb";
import { Shield, CheckCircle, AlertCircle, RefreshCw, Users, FileText } from "lucide-react";

const EditorialPolicy = () => {
  return (
    <>
      <SEOHead
        title="Editorial Policy | OCTG Index Content Standards"
        description="Learn about OCTG Index's editorial standards, fact-checking process, corrections policy, and commitment to accurate, unbiased industry coverage."
        canonical="https://octgindex.com/editorial-policy"
      />

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-background via-background to-accent/5 py-16 sm:py-20">
            <div className="container">
              {/* Breadcrumbs */}
              <Breadcrumb className="mb-8">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/" className="text-muted-foreground hover:text-accent">
                        Home
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Editorial Policy</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex items-center gap-4 mb-6">
                <Shield className="h-12 w-12 text-accent" />
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                  Editorial Policy
                </h1>
              </div>
              
              <p className="text-xl text-muted-foreground max-w-3xl">
                Our commitment to accuracy, transparency, and journalistic integrity in covering 
                the global OCTG industry.
              </p>
            </div>
          </section>

          {/* Main Content */}
          <section className="container py-12">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                
                {/* Mission Statement */}
                <div className="bg-card border border-border rounded-xl p-8 mb-12">
                  <h2 className="font-display text-2xl font-bold tracking-tight mb-4 flex items-center gap-3">
                    <FileText className="h-6 w-6 text-accent" />
                    Our Editorial Mission
                  </h2>
                  <p className="text-muted-foreground mb-0">
                    OCTG Index is committed to providing accurate, timely, and comprehensive coverage of 
                    the Oil Country Tubular Goods industry. Our editorial team works to deliver news and 
                    analysis that helps industry professionals make informed decisions. We maintain strict 
                    editorial independence and do not allow commercial interests to influence our coverage.
                  </p>
                </div>

                {/* Content Standards */}
                <div className="mb-12">
                  <h2 className="font-display text-2xl font-bold tracking-tight mb-6 flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-accent" />
                    Content Standards
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      All content published on OCTG Index adheres to the following standards:
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="text-accent font-bold">•</span>
                        <span><strong>Accuracy:</strong> We verify facts through multiple sources before publication. Data points, statistics, and quotes are cross-referenced with official sources whenever possible.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-accent font-bold">•</span>
                        <span><strong>Balance:</strong> We present multiple perspectives on industry issues, giving fair representation to different stakeholders including manufacturers, distributors, and end-users.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-accent font-bold">•</span>
                        <span><strong>Timeliness:</strong> Breaking news is published promptly, with updates added as new information becomes available.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-accent font-bold">•</span>
                        <span><strong>Context:</strong> We provide relevant background and analysis to help readers understand the significance of industry developments.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-accent font-bold">•</span>
                        <span><strong>Transparency:</strong> We clearly distinguish between news reporting and analysis/opinion content.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Fact-Checking Process */}
                <div className="mb-12">
                  <h2 className="font-display text-2xl font-bold tracking-tight mb-6 flex items-center gap-3">
                    <Shield className="h-6 w-6 text-accent" />
                    Fact-Checking Process
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Our fact-checking process includes:
                    </p>
                    <ol className="space-y-3 list-decimal list-inside">
                      <li><strong>Source Verification:</strong> Information is traced back to primary sources including company announcements, regulatory filings, and official statements.</li>
                      <li><strong>Expert Review:</strong> Technical content is reviewed by editors with OCTG industry expertise.</li>
                      <li><strong>Data Validation:</strong> Statistics and market data are verified against industry reports and official publications.</li>
                      <li><strong>Multiple Source Confirmation:</strong> Significant claims are confirmed through at least two independent sources when possible.</li>
                    </ol>
                  </div>
                </div>

                {/* Corrections Policy */}
                <div className="mb-12">
                  <h2 className="font-display text-2xl font-bold tracking-tight mb-6 flex items-center gap-3">
                    <RefreshCw className="h-6 w-6 text-accent" />
                    Corrections Policy
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      We take accuracy seriously and promptly correct errors when they are identified:
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="text-accent font-bold">•</span>
                        <span><strong>Minor Corrections:</strong> Typographical errors and minor factual corrections are made directly to the article with an "Updated" timestamp.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-accent font-bold">•</span>
                        <span><strong>Significant Corrections:</strong> Material errors that affect the meaning or accuracy of an article are noted with a correction notice at the top of the article.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-accent font-bold">•</span>
                        <span><strong>Retractions:</strong> In rare cases where an article contains fundamental errors, we will retract the article and publish an explanation.</span>
                      </li>
                    </ul>
                    <p className="mt-4">
                      To report an error or request a correction, please contact us at{" "}
                      <a href="mailto:info@octgindex.com" className="text-accent hover:underline">
                        info@octgindex.com
                      </a>.
                    </p>
                  </div>
                </div>

                {/* Author Qualifications */}
                <div className="mb-12">
                  <h2 className="font-display text-2xl font-bold tracking-tight mb-6 flex items-center gap-3">
                    <Users className="h-6 w-6 text-accent" />
                    Author Qualifications
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Our editorial team consists of professionals with:
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <span className="text-accent font-bold">•</span>
                        <span>Direct experience in the OCTG, energy, or manufacturing sectors</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-accent font-bold">•</span>
                        <span>Background in trade journalism, market analysis, or technical writing</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-accent font-bold">•</span>
                        <span>Regional expertise covering specific geographic markets</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-accent font-bold">•</span>
                        <span>Ongoing professional development in industry trends and technologies</span>
                      </li>
                    </ul>
                    <p className="mt-4">
                      Each published article includes author attribution. Learn more about our team on our{" "}
                      <Link to="/about" className="text-accent hover:underline">
                        About page
                      </Link>.
                    </p>
                  </div>
                </div>

                {/* Independence Statement */}
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-8">
                  <h2 className="font-display text-2xl font-bold tracking-tight mb-4 flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-accent" />
                    Editorial Independence
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      OCTG Index maintains strict separation between editorial content and commercial activities:
                    </p>
                    <ul className="space-y-2">
                      <li>• Advertising and sponsorship do not influence editorial decisions</li>
                      <li>• Sponsored content is clearly labeled as such</li>
                      <li>• Our editorial team operates independently from sales and marketing</li>
                      <li>• We disclose any potential conflicts of interest</li>
                    </ul>
                  </div>
                </div>

                {/* Contact */}
                <div className="mt-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    Questions about our editorial standards? Contact our editorial team:
                  </p>
                  <a 
                    href="mailto:info@octgindex.com" 
                    className="text-accent hover:underline font-medium"
                  >
                    info@octgindex.com
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default EditorialPolicy;