import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useProductCategories, useProductStats } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Cylinder,
  Layers,
  Link2,
  Wrench,
  Factory,
  Search,
  Warehouse,
  Cpu,
  Flame,
  Package,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Cylinder,
  Layers,
  Link: Link2,
  Link2,
  Wrench,
  Factory,
  Search,
  Warehouse,
  Cpu,
  Flame,
  Package,
};

const getCategoryIcon = (iconName: string | null): LucideIcon => {
  if (!iconName) return Package;
  return iconMap[iconName] || Package;
};

export default function OctgDirectory() {
  const { data: categories, isLoading: categoriesLoading } = useProductCategories();
  const { data: stats, isLoading: statsLoading } = useProductStats();

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://octgindex.com/octg-directory",
        url: "https://octgindex.com/octg-directory",
        name: "OCTG Product Directory | Pipes, Grades & Connections",
        description: "Browse 68+ OCTG products including pipe types, material grades, premium connections, and accessories. Complete technical specifications and manufacturer information.",
        isPartOf: { "@id": "https://octgindex.com/#website" },
        breadcrumb: { "@id": "https://octgindex.com/octg-directory#breadcrumb" },
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: ["h1", ".category-description"],
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://octgindex.com/octg-directory#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://octgindex.com" },
          { "@type": "ListItem", position: 2, name: "OCTG Product Directory" },
        ],
      },
      {
        "@type": "ItemList",
        "@id": "https://octgindex.com/octg-directory#categories",
        name: "OCTG Product Categories",
        numberOfItems: categories?.length || 9,
        itemListElement: categories?.map((cat, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: cat.name,
          url: `https://octgindex.com/octg-directory/${cat.slug}`,
        })) || [],
      },
      {
        "@type": "FAQPage",
        "@id": "https://octgindex.com/octg-directory#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is OCTG?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "OCTG (Oil Country Tubular Goods) refers to steel tubular products used in the oil and gas industry for drilling and completing wells. This includes casing, tubing, drill pipe, and related accessories.",
            },
          },
          {
            "@type": "Question",
            name: "What products are in the OCTG directory?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The OCTG Product Directory includes pipe types (casing, tubing, drill pipe), material grades (API and proprietary), premium connections, threading types, accessories, coatings, inspection equipment, and digital solutions for the oil and gas tubular industry.",
            },
          },
          {
            "@type": "Question",
            name: "How many OCTG product categories are there?",
            acceptedAnswer: {
              "@type": "Answer",
              text: `The directory contains ${categories?.length || 9} product categories covering all aspects of oil country tubular goods from pipe types to digital solutions.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <SEOHead
        title="OCTG Product Directory | Pipes, Grades & Connections"
        description="Browse 68+ OCTG products including pipe types, material grades, premium connections, and accessories. Complete technical specifications and manufacturer information."
        canonical="https://octgindex.com/octg-directory"
        type="website"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>

      <Header />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-background via-background to-accent/5 border-b border-border">
          <div className="container py-12 md:py-16">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>OCTG Product Directory</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
              OCTG Product Directory
            </h1>
            <p className="category-description text-lg text-muted-foreground max-w-3xl mb-8">
              The definitive technical reference for oil country tubular goods. Browse pipe types, 
              material grades, premium connections, and accessories with complete specifications 
              and manufacturer information.
            </p>

            {/* Stats Bar */}
            <div className="flex flex-wrap gap-6">
              {statsLoading ? (
                <>
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20">
                    <Package className="h-5 w-5 text-accent" />
                    <span className="font-semibold text-accent">{stats?.totalProducts || 0}+</span>
                    <span className="text-muted-foreground">Products</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20">
                    <Layers className="h-5 w-5 text-accent" />
                    <span className="font-semibold text-accent">{stats?.totalCategories || 0}</span>
                    <span className="text-muted-foreground">Categories</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Category Grid */}
        <section className="container py-12 md:py-16">
          <h2 className="font-display text-2xl font-bold tracking-tight mb-8">
            Browse by Category
          </h2>

          {categoriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories?.map((category) => {
                const Icon = getCategoryIcon(category.icon);
                const productCount = stats?.productsByCategory?.[category.id] || 0;

                return (
                  <Link
                    key={category.id}
                    to={`/octg-directory/${category.slug}`}
                    className="group relative flex flex-col p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {productCount} products
                      </Badge>
                    </div>

                    <h3 className="font-display text-lg font-semibold mb-2 group-hover:text-accent transition-colors">
                      {category.name}
                    </h3>

                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
                        {category.description}
                      </p>
                    )}

                    <div className="flex items-center text-sm text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Explore products</span>
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Related Resources */}
        <section className="border-t border-border bg-muted/30">
          <div className="container py-12">
            <h2 className="font-display text-xl font-semibold mb-6">Related Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/directory"
                className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-accent/50 transition-colors"
              >
                <Factory className="h-8 w-8 text-accent" />
                <div>
                  <h3 className="font-semibold">Company Directory</h3>
                  <p className="text-sm text-muted-foreground">200+ OCTG manufacturers & suppliers</p>
                </div>
              </Link>
              <Link
                to="/ceo-directory"
                className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-accent/50 transition-colors"
              >
                <Warehouse className="h-8 w-8 text-accent" />
                <div>
                  <h3 className="font-semibold">CEO Directory</h3>
                  <p className="text-sm text-muted-foreground">Industry leadership profiles</p>
                </div>
              </Link>
              <Link
                to="/topics"
                className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-accent/50 transition-colors"
              >
                <Layers className="h-8 w-8 text-accent" />
                <div>
                  <h3 className="font-semibold">Industry Topics</h3>
                  <p className="text-sm text-muted-foreground">News by category</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
