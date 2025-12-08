import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useExecutiveBySlug } from "@/hooks/useExecutives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Building2,
  MapPin,
  ArrowLeft,
  Linkedin,
  ExternalLink,
} from "lucide-react";

const regionColors: Record<string, string> = {
  Americas: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Europe: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Asia-Pacific": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Australia: "bg-purple-500/20 text-purple-400 border-purple-500/30",
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
              <Skeleton className="aspect-[3/4] w-full" />
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

  // Schema.org structured data
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: executive.name,
    jobTitle: executive.title,
    worksFor: {
      "@type": "Organization",
      name: executive.company_name,
    },
    image: executive.photo_url,
    description: executive.bio?.slice(0, 200),
  };

  return (
    <>
      <SEOHead
        title={`${executive.name} | ${executive.company_name} CEO`}
        description={`${executive.name} is ${executive.title} of ${executive.company_name}. ${executive.bio?.slice(0, 120)}...`}
        canonical={`https://octgindex.com/ceo/${executive.slug}`}
        image={executive.photo_url || undefined}
      />

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 py-8 md:py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Breadcrumb */}
            <nav className="mb-8">
              <Link
                to="/ceo-directory"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to CEO Directory
              </Link>
            </nav>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Left Column - Photo & Quick Info */}
              <div className="space-y-6">
                {/* Photo */}
                <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                  {executive.photo_url ? (
                    <img
                      src={executive.photo_url}
                      alt={executive.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <User className="w-24 h-24 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Quick Info Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Company Info
                    </CardTitle>
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
              </div>

              {/* Right Column - Bio */}
              <div className="md:col-span-2">
                <Badge
                  variant="outline"
                  className={`mb-4 ${regionColors[executive.region] || ""}`}
                >
                  {executive.region}
                </Badge>

                <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  {executive.name}
                </h1>

                <p className="text-xl text-muted-foreground mb-2">
                  {executive.title}
                </p>

                <p className="text-lg text-accent mb-8">{executive.company_name}</p>

                {/* Biography */}
                <div className="prose prose-invert max-w-none">
                  <h2 className="text-xl font-semibold mb-4">Biography</h2>
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {executive.bio || "Biography not available."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
