import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useExecutiveBySlug } from "@/hooks/useExecutives";
import { markdownToHtml } from "@/lib/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Building2,
  MapPin,
  ArrowLeft,
  Linkedin,
  ExternalLink,
} from "lucide-react";
import { generateCEOTitle, generateCEODescription } from "@/lib/seo-utils";

const regionColors: Record<string, string> = {
  Americas: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Europe: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Asia-Pacific": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Australia: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

// Generate FAQ content for AI search optimization
const generateCEOFAQs = (executive: any) => {
  const faqs = [];
  
  faqs.push({
    "@type": "Question",
    name: `Who is the CEO of ${executive.company_name}?`,
    acceptedAnswer: {
      "@type": "Answer",
      text: `${executive.name} is the ${executive.title} of ${executive.company_name}.`
    }
  });

  faqs.push({
    "@type": "Question",
    name: `What is ${executive.name}'s role?`,
    acceptedAnswer: {
      "@type": "Answer",
      text: `${executive.name} serves as ${executive.title} at ${executive.company_name}, a company in the OCTG (Oil Country Tubular Goods) industry.`
    }
  });

  if (executive.bio) {
    faqs.push({
      "@type": "Question",
      name: `What is ${executive.name}'s background?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: executive.bio.slice(0, 300) + (executive.bio.length > 300 ? "..." : "")
      }
    });
  }

  faqs.push({
    "@type": "Question",
    name: `What company does ${executive.name} lead?`,
    acceptedAnswer: {
      "@type": "Answer",
      text: `${executive.name} leads ${executive.company_name}${executive.stock_symbol ? ` (${executive.stock_symbol})` : ""}, operating in the ${executive.region} region of the global OCTG industry.`
    }
  });

  return faqs;
};

export default function CEODetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: executive, isLoading, error } = useExecutiveBySlug(slug || "");

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid md:grid-cols-3 gap-8">
              <Skeleton className="h-48 w-full rounded-lg" />
              <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !executive) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Executive Not Found</h1>
            <Link to="/ceo-directory">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Directory
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Enhanced Person Schema
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `https://octgindex.com/ceo/${executive.slug}#person`,
    name: executive.name,
    jobTitle: executive.title,
    worksFor: {
      "@type": "Organization",
      name: executive.company_name,
      ...(executive.stock_symbol && { tickerSymbol: executive.stock_symbol })
    },
    description: executive.bio?.slice(0, 200),
    knowsAbout: ["OCTG", "Oil Country Tubular Goods", "Oil and Gas Industry", "Corporate Leadership", "Steel Manufacturing"],
    ...(executive.linkedin_url && { sameAs: [executive.linkedin_url] }),
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://octgindex.com"
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "CEO Directory",
        item: "https://octgindex.com/ceo-directory"
      },
      {
        "@type": "ListItem",
        position: 3,
        name: executive.name,
        item: `https://octgindex.com/ceo/${executive.slug}`
      }
    ]
  };

  // FAQPage Schema for AI search optimization
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: generateCEOFAQs(executive)
  };

  // WebPage Schema with speakable content
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `https://octgindex.com/ceo/${executive.slug}`,
    name: `${executive.name} - ${executive.title} at ${executive.company_name}`,
    description: `${executive.name} serves as ${executive.title} at ${executive.company_name} in the OCTG industry.`,
    url: `https://octgindex.com/ceo/${executive.slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "OCTG Index",
      url: "https://octgindex.com"
    },
    about: {
      "@id": `https://octgindex.com/ceo/${executive.slug}#person`
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".ceo-summary", ".ceo-biography"]
    }
  };

  // Combined structured data
  const structuredData = [
    personSchema,
    breadcrumbSchema,
    faqSchema,
    webPageSchema
  ];

  return (
    <>
      <SEOHead
        title={generateCEOTitle(executive.name, executive.title, executive.company_name)}
        description={generateCEODescription(executive.name, executive.title, executive.company_name, executive.bio)}
        canonical={`https://octgindex.com/ceo/${executive.slug}`}
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 py-8 md:py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-8">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/ceo-directory">CEO Directory</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{executive.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Left Column - Photo & Quick Info */}
              <div className="space-y-6">
                {/* Quick Info Card (photo intentionally removed for performance) */}
                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="text-sm font-medium text-muted-foreground">
                      Company Info
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{executive.company_name}</div>
                        {executive.stock_symbol && (
                          <div className="text-sm font-mono text-accent mt-0.5">
                            {executive.stock_symbol}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <Badge
                        variant="outline"
                        className={regionColors[executive.region] || ""}
                      >
                        {executive.region}
                      </Badge>
                    </div>

                    {executive.linkedin_url && (
                      <a
                        href={executive.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span>LinkedIn Profile</span>
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    )}
                  </CardContent>
                </Card>

                {/* Browse More */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <Link to="/ceo-directory">
                        <Button variant="outline" className="w-full justify-start">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to CEO Directory
                        </Button>
                      </Link>
                      <Link to="/directory">
                        <Button variant="outline" className="w-full justify-start">
                          Browse Companies
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Bio */}
              <div className="md:col-span-2">
                <Badge
                  variant="outline"
                  className={`mb-4 ${regionColors[executive.region] || ""}`}
                >
                  {executive.region}
                </Badge>

                {/* CEO Summary - speakable content */}
                <div className="ceo-summary">
                  <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    {executive.name}
                  </h1>

                  <p className="text-xl text-muted-foreground mb-2">
                    {executive.title}
                  </p>

                  <p className="text-lg text-accent mb-8">{executive.company_name}</p>
                </div>

                {/* Biography - speakable content */}
                {executive.bio ? (
                  <div 
                    className="ceo-biography prose dark:prose-invert prose-headings:text-foreground prose-headings:font-semibold prose-p:text-muted-foreground prose-strong:text-foreground max-w-none"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(executive.bio) }}
                  />
                ) : (
                  <p className="text-muted-foreground">Biography not available.</p>
                )}

                {/* FAQ Section for AI Search */}
                <Card className="mt-8">
                  <CardHeader>
                    <h2 className="font-display text-xl font-bold leading-none tracking-tight">Frequently Asked Questions</h2>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Who is the {executive.title} of {executive.company_name}?</h3>
                      <p className="text-muted-foreground text-sm">
                        {executive.name} is the {executive.title} of {executive.company_name}.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">What company does {executive.name} lead?</h3>
                      <p className="text-muted-foreground text-sm">
                        {executive.name} leads {executive.company_name}{executive.stock_symbol ? ` (${executive.stock_symbol})` : ""}, operating in the {executive.region} region of the global OCTG industry.
                      </p>
                    </div>
                    {executive.bio && (
                      <div>
                        <h3 className="font-medium mb-2">What is {executive.name}'s background?</h3>
                        <p className="text-muted-foreground text-sm">
                          {executive.bio.slice(0, 200)}...
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}