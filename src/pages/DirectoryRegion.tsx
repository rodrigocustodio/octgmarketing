import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
      <Helmet>
        <title>OCTG Companies in {region.name} | Industry Directory | OCTG Index</title>
        <meta name="description" content={`Discover ${companies.length}+ OCTG companies in ${region.name}. Find mills, manufacturers, distributors, inspection services, and drilling contractors.`} />
        <meta property="og:title" content={`OCTG Companies in ${region.name} | Industry Directory`} />
        <meta property="og:description" content={`Complete directory of OCTG companies in ${region.name}. Mills, distributors, and service providers.`} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`/directory/region/${slug}`} />
      </Helmet>

      <Header />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-background via-muted/30 to-background border-b border-border">
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
            <p className="text-lg text-muted-foreground max-w-2xl">
              {companies.length} companies across {sortedCategories.length} categories serving the {region.name} OCTG market.
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
      </main>

      <Footer />
    </>
  );
}
