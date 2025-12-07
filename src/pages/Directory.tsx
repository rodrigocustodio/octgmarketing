import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Search,
  Factory,
  Wrench,
  Truck,
  Package,
  ExternalLink,
  Building2,
  Globe,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { useAllCompanies, useDirectoryStats, useRegions, INDUSTRY_ROLES } from "@/hooks/useDirectory";

const getCategoryIcon = (role: string) => {
  switch (role) {
    case "mill": return <Factory className="h-4 w-4" />;
    case "yard": return <Wrench className="h-4 w-4" />;
    case "inspection": return <Search className="h-4 w-4" />;
    case "drilling": return <Building2 className="h-4 w-4" />;
    case "logistics": return <Truck className="h-4 w-4" />;
    case "software": return <Globe className="h-4 w-4" />;
    case "trading": return <Package className="h-4 w-4" />;
    default: return <Building2 className="h-4 w-4" />;
  }
};

const getCategoryLabel = (role: string) => {
  return INDUSTRY_ROLES.find(r => r.value === role)?.label || role;
};

export default function Directory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const { data: companies, isLoading: companiesLoading } = useAllCompanies();
  const { data: stats, isLoading: statsLoading } = useDirectoryStats();
  const { data: regions } = useRegions();

  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    
    return companies.filter((company) => {
      const matchesSearch = searchQuery === "" || 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.headquarters?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRegion = !selectedRegion || company.region?.slug === selectedRegion;
      const matchesCategory = !selectedCategory || company.industry_role === selectedCategory;
      
      return matchesSearch && matchesRegion && matchesCategory;
    });
  }, [companies, searchQuery, selectedRegion, selectedCategory]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRegion(null);
    setSelectedCategory(null);
  };

  const hasFilters = searchQuery || selectedRegion || selectedCategory;

  return (
    <>
      <Helmet>
        <title>OCTG Industry Directory | Global Companies & Suppliers | OCTG Index</title>
        <meta name="description" content="Comprehensive directory of 200+ OCTG companies worldwide. Find mills, manufacturers, distributors, inspection services, drilling contractors, and logistics providers across all regions." />
        <meta property="og:title" content="OCTG Industry Directory | Global Companies & Suppliers" />
        <meta property="og:description" content="The definitive guide to global OCTG companies. Search 200+ mills, distributors, and service providers." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/directory" />
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
                  <BreadcrumbPage>OCTG Directory</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              OCTG Industry Directory
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-8">
              The definitive guide to global OCTG companies. Search mills, manufacturers, 
              distributors, and service providers across all regions.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search companies by name, country, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b border-border bg-muted/20">
          <div className="container py-6">
            <div className="flex flex-wrap gap-6 md:gap-12 text-center md:text-left">
              {statsLoading ? (
                <>
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-32" />
                </>
              ) : (
                <>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-accent">{stats?.totalCompanies || 0}+</div>
                    <div className="text-sm text-muted-foreground">Companies</div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-accent">{stats?.regionsWithCompanies || 0}</div>
                    <div className="text-sm text-muted-foreground">Regions</div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-accent">{stats?.categoriesWithCompanies || 0}</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Filters and Content */}
        <section className="container py-8">
          <div className="grid lg:grid-cols-[280px,1fr] gap-8">
            {/* Sidebar Filters */}
            <aside className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </h2>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>


              {/* Category Filter */}
              <div>
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">By Category</h3>
                <div className="flex flex-col gap-1">
                  {INDUSTRY_ROLES.map((role) => (
                    <Button
                      key={role.value}
                      variant={selectedCategory === role.value ? "secondary" : "ghost"}
                      size="sm"
                      className="justify-start"
                      onClick={() => setSelectedCategory(selectedCategory === role.value ? null : role.value)}
                    >
                      {getCategoryIcon(role.value)}
                      <span className="ml-2">{role.label}</span>
                      {stats?.categoryCounts && (
                        <span className="ml-auto text-muted-foreground">
                          {stats.categoryCounts[role.value] || 0}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Browse by Region Links */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">Browse by Region</h3>
                <div className="flex flex-col gap-1">
                  {regions?.map((region) => (
                    <Link key={region.slug} to={`/directory/region/${region.slug}`}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        {region.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Browse by Category Links */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-3 text-muted-foreground">Browse by Category</h3>
                <div className="flex flex-col gap-1">
                  {INDUSTRY_ROLES.map((role) => (
                    <Link key={role.value} to={`/directory/category/${role.value}`}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        {getCategoryIcon(role.value)}
                        <span className="ml-2">{role.label}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredCompanies.length} {filteredCompanies.length === 1 ? "company" : "companies"}
                  {hasFilters && " (filtered)"}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {companiesLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : viewMode === "table" ? (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Company</TableHead>
                        <TableHead className="hidden md:table-cell">Category</TableHead>
                        <TableHead className="hidden sm:table-cell">Country</TableHead>
                        <TableHead className="hidden lg:table-cell">Region</TableHead>
                        <TableHead className="text-right">Website</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompanies.map((company) => (
                        <TableRow key={company.id} className="hover:bg-muted/30">
                          <TableCell>
                            <Link 
                              to={`/directory/company/${company.slug}`}
                              className="font-medium hover:text-accent transition-colors"
                            >
                              {company.name}
                            </Link>
                            <div className="text-xs text-muted-foreground md:hidden">
                              {getCategoryLabel(company.industry_role || "")}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="gap-1">
                              {getCategoryIcon(company.industry_role || "")}
                              {getCategoryLabel(company.industry_role || "")}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {company.country}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {company.region && (
                              <Link 
                                to={`/directory/region/${company.region.slug}`}
                                className="text-muted-foreground hover:text-accent transition-colors"
                              >
                                {company.region.name}
                              </Link>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {company.website && (
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:text-accent/80 transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCompanies.map((company) => (
                    <Link key={company.id} to={`/directory/company/${company.slug}`}>
                      <Card className="h-full hover:border-accent/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-medium line-clamp-1">{company.name}</h3>
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
                          <Badge variant="outline" className="gap-1 mb-2">
                            {getCategoryIcon(company.industry_role || "")}
                            {getCategoryLabel(company.industry_role || "")}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            <div>{company.country}</div>
                            {company.region && <div>{company.region.name}</div>}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {filteredCompanies.length === 0 && !companiesLoading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No companies found matching your criteria.</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
