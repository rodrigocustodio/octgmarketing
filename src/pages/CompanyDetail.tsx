import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { SEOHead } from "@/components/SEOHead";
import { Footer } from "@/components/layout/Footer";
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
  Mail,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { useCompanyBySlug, useSimilarCompanies, INDUSTRY_ROLES } from "@/hooks/useDirectory";

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

export default function CompanyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: company, isLoading } = useCompanyBySlug(slug || "");
  const { data: similarCompanies } = useSimilarCompanies(
    slug || "",
    company?.region_id,
    company?.industry_role
  );

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <div className="container py-12">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-16 w-96 mb-8" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!company) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Company Not Found</h1>
            <Link to="/directory" className="text-accent hover:underline">
              Return to Directory
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Schema.org structured data for Organization
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: company.website || undefined,
    telephone: company.phone || undefined,
    email: company.email || undefined,
    foundingDate: company.year_founded ? String(company.year_founded) : undefined,
    address: company.headquarters ? {
      "@type": "PostalAddress",
      addressLocality: company.headquarters,
      addressCountry: company.country || undefined,
    } : undefined,
    description: company.notes || company.description || undefined,
  };

  return (
    <>
      <SEOHead
        title={`${company.name} | ${getCategoryLabel(company.industry_role || "")} | OCTG Index`}
        description={`${company.name} - ${getCategoryLabel(company.industry_role || "")} based in ${company.country}. ${company.notes || company.description || ""}`}
        canonical={`https://octgindex.com/directory/company/${slug}`}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
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
                {company.region && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href={`/directory/region/${company.region.slug}`}>
                        {company.region.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{company.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Logo placeholder */}
              <div className="w-20 h-20 rounded-lg bg-muted/50 border border-border flex items-center justify-center shrink-0">
                {getCategoryIcon(company.industry_role || "")}
              </div>

              <div className="flex-1">
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  {company.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge className="gap-1">
                    {getCategoryIcon(company.industry_role || "")}
                    {getCategoryLabel(company.industry_role || "")}
                  </Badge>
                  {company.country && (
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {company.country}
                    </Badge>
                  )}
                  {company.region && (
                    <Link to={`/directory/region/${company.region.slug}`}>
                      <Badge variant="outline" className="gap-1 hover:bg-muted">
                        {company.region.name}
                      </Badge>
                    </Link>
                  )}
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Key Facts */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {company.year_founded && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Founded</div>
                          <div className="font-medium">{company.year_founded}</div>
                        </div>
                      </div>
                    )}
                    {company.headquarters && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Headquarters</div>
                          <div className="font-medium">{company.headquarters}</div>
                        </div>
                      </div>
                    )}
                    {company.industry_role && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getCategoryIcon(company.industry_role)}
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Industry Role</div>
                          <Link 
                            to={`/directory/category/${company.industry_role}`}
                            className="font-medium hover:text-accent transition-colors"
                          >
                            {getCategoryLabel(company.industry_role)}
                          </Link>
                        </div>
                      </div>
                    )}
                    {company.region && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Region</div>
                          <Link 
                            to={`/directory/region/${company.region.slug}`}
                            className="font-medium hover:text-accent transition-colors"
                          >
                            {company.region.name}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* About */}
              {(company.notes || company.description) && (
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {company.notes || company.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company.phone && (
                    <a
                      href={`tel:${company.phone}`}
                      className="flex items-center gap-3 text-sm hover:text-accent transition-colors"
                    >
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{company.phone}</span>
                    </a>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-accent transition-colors"
                    >
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{company.website.replace(/^https?:\/\//, "")}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  )}
                  {company.email && (
                    <a
                      href={`mailto:${company.email}`}
                      className="flex items-center gap-3 text-sm hover:text-accent transition-colors"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{company.email}</span>
                    </a>
                  )}
                  {!company.website && !company.phone && !company.email && (
                    <p className="text-sm text-muted-foreground">No contact information available.</p>
                  )}
                </CardContent>
              </Card>

              {/* Similar Companies */}
              {similarCompanies && similarCompanies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Similar Companies</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {similarCompanies.map((similar) => (
                      <Link
                        key={similar.id}
                        to={`/directory/company/${similar.slug}`}
                        className="flex items-center justify-between py-2 hover:text-accent transition-colors group"
                      >
                        <div>
                          <div className="font-medium text-sm">{similar.name}</div>
                          <div className="text-xs text-muted-foreground">{similar.country}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Browse More */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Link to="/directory">
                      <Button variant="outline" className="w-full justify-start">
                        Browse All Companies
                      </Button>
                    </Link>
                    {company.industry_role && (
                      <Link to={`/directory/category/${company.industry_role}`}>
                        <Button variant="outline" className="w-full justify-start">
                          More {getCategoryLabel(company.industry_role)}
                        </Button>
                      </Link>
                    )}
                    {company.region && (
                      <Link to={`/directory/region/${company.region.slug}`}>
                        <Button variant="outline" className="w-full justify-start">
                          More in {company.region.name}
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
