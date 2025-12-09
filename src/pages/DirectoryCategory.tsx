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
  Calendar,
} from "lucide-react";
import { useCompaniesByCategory, INDUSTRY_ROLES } from "@/hooks/useDirectory";
import { useRegions } from "@/hooks/useArticles";
import { generateCategoryTitle, generateCategoryDescription } from "@/lib/seo-utils";

const getCategoryIcon = (role: string) => {
  switch (role) {
    case "mill": return <Factory className="h-6 w-6" />;
    case "yard": return <Wrench className="h-6 w-6" />;
    case "inspection": return <Search className="h-6 w-6" />;
    case "drilling": return <Building2 className="h-6 w-6" />;
    case "logistics": return <Truck className="h-6 w-6" />;
    case "software": return <Globe className="h-6 w-6" />;
    case "trading": return <Package className="h-6 w-6" />;
    default: return <Building2 className="h-6 w-6" />;
  }
};

const getCategoryLabel = (role: string) => {
  return INDUSTRY_ROLES.find(r => r.value === role)?.label || role;
};

const getCategoryDescriptionText = (role: string) => {
  switch (role) {
    case "mill": return "Seamless and welded OCTG manufacturers producing casing, tubing, and drill pipe.";
    case "yard": return "Threading facilities, repair shops, and coupling manufacturers.";
    case "inspection": return "Non-destructive testing, quality assurance, and certification services.";
    case "drilling": return "Land and offshore drilling contractors operating rigs worldwide.";
    case "logistics": return "Transportation, warehousing, and supply chain management for tubulars.";
    case "software": return "Digital platforms, inventory management, and supply chain software.";
    case "trading": return "Distributors, stockists, and trading companies for OCTG products.";
    default: return "";
  }
};

export default function DirectoryCategory() {
  const { slug } = useParams<{ slug: string }>();
  const { data: companies, isLoading } = useCompaniesByCategory(slug || "");
  const { data: regions } = useRegions();

  const categoryLabel = getCategoryLabel(slug || "");
  const categoryDescription = getCategoryDescriptionText(slug || "");
  const companyCount = companies?.length || 0;

  // Group companies by region
  const groupedByRegion = (companies || []).reduce((acc, company) => {
    const regionId = company.region_id || "other";
    if (!acc[regionId]) acc[regionId] = [];
    acc[regionId].push(company);
    return acc;
  }, {} as Record<string, typeof companies>);

  const getRegionName = (regionId: string) => {
    return regions?.find(r => r.id === regionId)?.name || "Global";
  };

  const getRegionSlug = (regionId: string) => {
    return regions?.find(r => r.id === regionId)?.slug || "";
  };

  // WebPage Schema
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `https://octgindex.com/directory/category/${slug}`,
    name: `${categoryLabel} Companies - OCTG Directory`,
    description: `${categoryDescription} ${companyCount} companies listed globally.`,
    url: `https://octgindex.com/directory/category/${slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "OCTG Index",
      url: "https://octgindex.com"
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".category-hero", ".category-description"]
    }
  };

  // ItemList Schema
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${categoryLabel} Companies`,
    description: `${categoryDescription}`,
    numberOfItems: companyCount,
    itemListElement: companies?.slice(0, 20).map((company, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://octgindex.com/directory/company/${company.slug}`,
      name: company.name
    })) || []
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
        name: "OCTG Directory",
        item: "https://octgindex.com/directory"
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryLabel,
        item: `https://octgindex.com/directory/category/${slug}`
      }
    ]
  };

  // FAQPage Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What are OCTG ${categoryLabel}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: categoryDescription
        }
      },
      {
        "@type": "Question",
        name: `How many ${categoryLabel.toLowerCase()} companies are listed?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The OCTG Index directory lists ${companyCount} ${categoryLabel.toLowerCase()} companies operating across multiple global regions.`
        }
      }
    ]
  };

  const structuredData = [webPageSchema, itemListSchema, breadcrumbSchema, faqSchema];

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

  const validCategory = INDUSTRY_ROLES.some(r => r.value === slug);

  if (!validCategory) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
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
        title={generateCategoryTitle(categoryLabel)}
        description={generateCategoryDescription(categoryLabel, categoryDescription, companyCount)}
        canonical={`https://octgindex.com/directory/category/${slug}`}
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Header />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="category-hero bg-gradient-to-br from-background via-muted/30 to-background border-b border-border">
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
                  <BreadcrumbPage>{categoryLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-accent/10 text-accent">
                {getCategoryIcon(slug || "")}
              </div>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold">
                {categoryLabel}
              </h1>
            </div>
            <p className="category-description text-lg text-muted-foreground max-w-2xl">
              {categoryDescription} {companyCount} companies listed globally.
            </p>
          </div>
        </section>

        {/* Companies by Region */}
        <section className="container py-12">
          <div className="space-y-12">
            {Object.entries(groupedByRegion).map(([regionId, regionCompanies]) => (
              <div key={regionId}>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="font-display text-xl md:text-2xl font-bold">
                    {getRegionName(regionId)}
                  </h2>
                  <Badge variant="secondary">{regionCompanies.length}</Badge>
                  <Link 
                    to={`/directory/region/${getRegionSlug(regionId)}`}
                    className="text-sm text-accent hover:underline ml-auto"
                  >
                    View all in region →
                  </Link>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regionCompanies.map((company) => (
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
                          {company.year_founded && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs">Est. {company.year_founded}</span>
                            </div>
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

          {!companies || companies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No companies found in this category yet.</p>
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
            {INDUSTRY_ROLES.filter(r => r.value !== slug).slice(0, 3).map((role) => (
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