import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useProductCategoryBySlug, useProductsByCategory, useProductCategories } from "@/hooks/useProducts";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, ArrowRight, ChevronRight, Home,
  Cylinder, Layers, Link as LinkIcon, Wrench, Factory, 
  Search as SearchIcon, Warehouse, Cpu, Flame, Package
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const getCategoryIcon = (iconName: string | null): LucideIcon => {
  const icons: Record<string, LucideIcon> = {
    Cylinder, Layers, Link: LinkIcon, Wrench, Factory,
    Search: SearchIcon, Warehouse, Cpu, Flame, Package
  };
  return icons[iconName || ""] || Package;
};

const OctgCategory = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const { data: category, isLoading: categoryLoading } = useProductCategoryBySlug(categorySlug);
  const { data: products, isLoading: productsLoading } = useProductsByCategory(categorySlug);
  const { data: allCategories } = useProductCategories();

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortBy) {
      case "a-z":
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "z-a":
        filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        filtered = [...filtered].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }

    return filtered;
  }, [products, searchQuery, sortBy]);

  const relatedCategories = useMemo(() => {
    if (!allCategories || !category) return [];
    return allCategories
      .filter(c => c.id !== category.id)
      .slice(0, 4);
  }, [allCategories, category]);

  const CategoryIcon = getCategoryIcon(category?.icon);

  if (categoryLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-12 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-6">The product category you're looking for doesn't exist.</p>
          <Link to="/octg-directory" className="text-primary hover:underline">
            ← Back to Product Directory
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const seoTitle = `${category.name} | OCTG Products | OCTG Index`;
  const seoDescription = category.description 
    ? category.description.slice(0, 155) 
    : `Browse ${products?.length || 0} ${category.name.toLowerCase()} products including specifications, standards, and manufacturers.`;
  const canonicalUrl = `https://octgindex.com/octg-directory/${categorySlug}`;

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": canonicalUrl,
        url: canonicalUrl,
        name: seoTitle,
        description: seoDescription,
        isPartOf: { "@id": "https://octgindex.com/#website" },
        breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: ["h1", ".category-description"]
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://octgindex.com" },
          { "@type": "ListItem", position: 2, name: "OCTG Product Directory", item: "https://octgindex.com/octg-directory" },
          { "@type": "ListItem", position: 3, name: category.name, item: canonicalUrl }
        ]
      },
      {
        "@type": "ItemList",
        "@id": `${canonicalUrl}#products`,
        name: `${category.name} Products`,
        numberOfItems: products?.length || 0,
        itemListElement: filteredProducts.slice(0, 20).map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.name,
          url: `https://octgindex.com/octg-directory/${categorySlug}/${product.slug}`
        }))
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What is ${category.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: category.description || `${category.name} are essential components in oil country tubular goods operations.`
            }
          },
          {
            "@type": "Question",
            name: `How many ${category.name.toLowerCase()} products are listed?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `The OCTG Index directory lists ${products?.length || 0} ${category.name.toLowerCase()} products with complete technical specifications.`
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>

      <Header />

      <main className="flex-1">
        {/* Breadcrumbs */}
        <div className="border-b border-border/50 bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to="/octg-directory" className="hover:text-foreground transition-colors">
                OCTG Products
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">{category.name}</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative py-12 md:py-16 bg-gradient-to-b from-muted/50 to-background border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex items-start gap-6">
              <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <CategoryIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{category.name}</h1>
                  <Badge variant="secondary" className="text-sm">
                    {products?.length || 0} products
                  </Badge>
                </div>
                {category.description && (
                  <p className="category-description text-lg text-muted-foreground max-w-3xl">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Order</SelectItem>
                  <SelectItem value="a-z">Name (A-Z)</SelectItem>
                  <SelectItem value="z-a">Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `No products found matching "${searchQuery}"`
                    : "No products in this category yet."
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/octg-directory/${categorySlug}/${product.slug}`}
                    className="group block p-5 rounded-lg border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                    </div>
                    
                    {product.short_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {product.short_description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {product.api_standard && (
                        <Badge variant="outline" className="text-xs">
                          {product.api_standard}
                        </Badge>
                      )}
                      {product.applications?.slice(0, 2).map((app, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Related Categories */}
        {relatedCategories.length > 0 && (
          <section className="py-8 md:py-12 border-t border-border/50 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-xl font-semibold mb-6">Related Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedCategories.map((cat) => {
                  const CatIcon = getCategoryIcon(cat.icon);
                  return (
                    <Link
                      key={cat.id}
                      to={`/octg-directory/${cat.slug}`}
                      className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-card hover:border-primary/50 transition-colors"
                    >
                      <CatIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium text-sm">{cat.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Back to Directory */}
        <section className="py-8 border-t border-border/50">
          <div className="container mx-auto px-4 text-center">
            <Link
              to="/octg-directory"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              ← Back to OCTG Product Directory
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default OctgCategory;
