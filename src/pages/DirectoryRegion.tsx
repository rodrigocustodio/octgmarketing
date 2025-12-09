import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
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
  Factory,
  Wrench,
  Search,
  Truck,
  Package,
  ExternalLink,
  Building2,
  Globe,
  MapPin,
  Phone,
} from "lucide-react";
import { useCompaniesByRegion, INDUSTRY_ROLES } from "@/hooks/useDirectory";
import { generateRegionTitle, generateRegionDescription } from "@/lib/seo-utils";

const getCategoryIcon = (role: string) => {
  switch (role) {
    case "mill": return <Factory className="h-5 w-5" />;
    case "yard": return <Wrench className="h-5 w-5" />;
    case "inspection": return <Search className="h-5 w-5" />;
    case "drilling": return <Building2 className="h-5 w-5" />;
    case "logistics": return <Truck className="h-5 w-5" />;
    case "software": return <Globe className="h-5 w-5" />;
    case "trading": return <Package className="h-5 w-5" />;
    default: return <Building2 className="h-5 w-5" />;
  }
};

const getCategoryLabel = (role: string) => {
  return INDUSTRY_ROLES.find(r => r.value === role)?.label || role;
};

export default function DirectoryRegion() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useCompaniesByRegion(slug || "");

  const companies = data?.companies || [];
  const region = data?.region;
  const companyCount = companies.length;

  // Group companies by industry role
  const groupedCompanies = companies.reduce((acc, company) => {
    const role = company.industry_role || "other";
    if (!acc[role]) acc[role] = [];
    acc[role].push(company);
    return acc;
  }, {} as Record<string, typeof companies>);

  // Sort categories by the predefined order
  const sortedCategories = INDUSTRY_ROLES
    .map(role => role.value)
    .filter(role => groupedCompanies[role]?.length > 0);

  // WebPage Schema
  const webPageSchema = region ? {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `https://octgindex.com/directory/region/${slug}`,
    name: `OCTG Companies in ${region.name}`,
    description: `${companyCount} OCTG companies across ${sortedCategories.length} categories serving the ${region.name} market.`,
    url: `https://octgindex.com/directory/region/${slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "OCTG Index",
      url: "https://octgindex.com"
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".region-hero", ".region-description"]
    }
  } : null;

  // ItemList Schema
  const itemListSchema = region ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `OCTG Companies in ${region.name}`,
    description: `Complete listing of OCTG companies in the ${region.name} region`,
    numberOfItems: companyCount,
    itemListElement: companies.slice(0, 20).map((company, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://octgindex.com/directory/company/${company.slug}`,
      name: company.name
    }))
  } : null;

  // BreadcrumbList Schema
  const breadcrumbSchema = region ? {
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
        name: "OCTG Directory",
        item: "https://octgindex.com/directory"
      },
      {
        "@type": "ListItem",
        position: 3,
        name: region.name,
        item: `https://octgindex.com/directory/region/${slug}`
      }
    ]
  } : null;

  // FAQPage Schema
  const faqSchema = region ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How many OCTG companies operate in ${region.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `There are ${companyCount} OCTG companies operating in the ${region.name} region, spanning ${sortedCategories.length} industry categories.`
        }
      },
      {
        "@type": "Question",
        name: `What types of OCTG companies are in ${region.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `OCTG companies in ${region.name} include ${sortedCategories.map(cat => getCategoryLabel(cat).toLowerCase()).join(", ")}.`
        }
      }
    ]
  } : null;

  const structuredData = [webPageSchema, itemListSchema, breadcrumbSchema, faqSchema].filter(Boolean);

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <div className="container py-12">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-12 w-96 mb-8" />
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!region) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Region Not Found</h1>
            <Link to="/directory" className="text-accent hover:underline">
              Return to Directory
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={generateRegionTitle(region.name, "directory")}
        description={generateRegionDescription(region.name, "directory", companyCount)}
        canonical={`https://octgindex.com/directory/region/${slug}`}
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Header />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="region-hero bg-gradient-to-br from-background via-muted/30 to-background border-b border-border">
          <div className="container py-12 md:py-16">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/directory">OCTG Directory</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{region.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              OCTG Companies in {region.name}
            </h1>
            <p className="region-description text-lg text-muted-foreground max-w-2xl">
              {companyCount} companies across {sortedCategories.length} categories serving the {region.name} OCTG market.
            </p>
          </div>
        </section>

        {/* Companies by Category */}
        <section className="container py-12">
          <div className="space-y-12">
            {sortedCategories.map((category) => (
              <div key={category}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent">
                    {getCategoryIcon(category)}
                  </div>
                  <h2 className="font-display text-xl md:text-2xl font-bold">
                    {getCategoryLabel(category)}
                  </h2>
                  <Badge variant="secondary">{groupedCompanies[category].length}</Badge>
                  <Link 
                    to={`/directory/category/${category}`}
                    className="text-sm text-accent hover:underline ml-auto"
                  >
                    View all {getCategoryLabel(category).toLowerCase()} →
                  </Link>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedCompanies[category].map((company) => (
                    <Link key={company.id} to={`/directory/company/${company.slug}`}>
                      <Card className="h-full hover:border-accent/50 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base line-clamp-1">{company.name}</CardTitle>
                            {company.website && (
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-accent hover:text-accent/80 shrink-0"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1 mb-1">
                            <MapPin className="h-3 w-3" />
                            <span>{company.country}</span>
                          </div>
                          {company.headquarters && (
                            <div className="line-clamp-1 text-xs">{company.headquarters}</div>
                          )}
                          {company.phone && (
                            <div className="flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs">{company.phone}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {companies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No companies found in this region yet.</p>
              <Link to="/directory" className="text-accent hover:underline">
                Browse all companies
              </Link>
            </div>
          )}
        </section>

        {/* Internal Linking Section */}
        <section className="container py-12 border-t border-border">
          <h2 className="font-display text-xl font-bold mb-6">Explore More</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/directory" className="p-4 rounded-lg border border-border hover:border-accent/50 transition-colors">
              <h3 className="font-medium mb-1">All Companies</h3>
              <p className="text-sm text-muted-foreground">Browse the complete OCTG directory</p>
            </Link>
            <Link to={`/region/${slug}`} className="p-4 rounded-lg border border-border hover:border-accent/50 transition-colors">
              <h3 className="font-medium mb-1">{region.name} News</h3>
              <p className="text-sm text-muted-foreground">Latest articles from this region</p>
            </Link>
            {INDUSTRY_ROLES.slice(0, 2).map((role) => (
              <Link 
                key={role.value}
                to={`/directory/category/${role.value}`} 
                className="p-4 rounded-lg border border-border hover:border-accent/50 transition-colors"
              >
                <h3 className="font-medium mb-1">{role.label}</h3>
                <p className="text-sm text-muted-foreground">View {role.label.toLowerCase()} companies</p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}