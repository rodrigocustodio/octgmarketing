import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  ChevronRight,
  ChevronLeft,
  ArrowLeft, 
  Building2, 
  FileText, 
  Users, 
  Package,
  Wrench,
  CircleDot,
  ExternalLink,
  Images
} from "lucide-react";
import bannerCasing from "@/assets/banner-casing.jpg";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  useProductBySlug,
  useProductManufacturers,
  useProductArticles,
  useRelatedProducts,
  useProductExecutives,
} from "@/hooks/useProducts";
import { generateProductTitle, generateProductDescription } from "@/lib/seo-utils";
import { format } from "date-fns";
import { optimizeImageUrl } from "@/lib/utils";

const formatSpecKey = (key: string): string => {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const renderSpecValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
};

const ProductDetailSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-4 py-8">
      <Skeleton className="h-6 w-96 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default function ProductDetail() {
  const { categorySlug, productSlug } = useParams<{
    categorySlug: string;
    productSlug: string;
  }>();

  const { data: product, isLoading: productLoading } = useProductBySlug(productSlug);
  const { data: manufacturers } = useProductManufacturers(product?.id);
  const { data: articles } = useProductArticles(product?.id);
  const { data: relatedProducts } = useRelatedProducts(
    productSlug,
    product?.category_id,
    4
  );
  const { data: executives } = useProductExecutives(product?.id);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const galleryImages = (product?.gallery_images as string[]) || [];

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen || galleryImages.length === 0) return;
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, galleryImages.length]);

  if (productLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link to={categorySlug ? `/octg-directory/${categorySlug}` : "/octg-directory"}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Category
              </Link>
            </Button>
            <Button asChild>
              <Link to="/octg-directory">Browse All Products</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const category = product.category;
  const technicalSpecs = product.technical_specs as Record<string, unknown> | null;
  const applications = product.applications || [];

  // Generate SEO content
  const seoTitle = generateProductTitle(product.name, category?.name);
  const seoDescription = generateProductDescription(
    product.name,
    product.short_description,
    product.api_standard
  );
  const canonicalUrl = `https://octgindex.com/octg-directory/${categorySlug}/${productSlug}`;

  // Generate FAQs for structured data
  const faqs = [
    {
      question: `What is ${product.name}?`,
      answer: product.description || product.short_description || `${product.name} is a type of OCTG product used in oil and gas operations.`,
    },
    ...(applications.length > 0
      ? [
          {
            question: `What are the applications of ${product.name}?`,
            answer: `${product.name} is commonly used for: ${applications.join(", ")}.`,
          },
        ]
      : []),
    ...(manufacturers && manufacturers.length > 0
      ? [
          {
            question: `Who manufactures ${product.name}?`,
            answer: `Leading manufacturers of ${product.name} include: ${manufacturers.map((m) => m.name).join(", ")}.`,
          },
        ]
      : []),
    ...(product.api_standard
      ? [
          {
            question: `What API standard applies to ${product.name}?`,
            answer: `${product.name} is manufactured according to ${product.api_standard} specifications.`,
          },
        ]
      : []),
  ];

  // Schema.org structured data
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.short_description,
    category: category?.name,
    ...(manufacturers && manufacturers.length > 0 && {
      manufacturer: manufacturers.map((m) => ({
        "@type": "Organization",
        name: m.name,
        url: `https://octgindex.com/directory/company/${m.slug}`,
      })),
    }),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://octgindex.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "OCTG Products",
        item: "https://octgindex.com/octg-directory",
      },
      ...(category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: category.name,
              item: `https://octgindex.com/octg-directory/${category.slug}`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: product.name,
              item: canonicalUrl,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 3,
              name: product.name,
              item: canonicalUrl,
            },
          ]),
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: product.name,
    description: seoDescription,
    url: canonicalUrl,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".product-description", ".product-specs"],
    },
  };

  const structuredData = [productSchema, breadcrumbSchema, faqSchema, webPageSchema];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        image={product.hero_image_url || undefined}
        type="website"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Header />

      {/* Hero Section with Banner */}
      <section className="relative py-16 md:py-24 overflow-hidden border-b border-border">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0">
          <img 
            src={optimizeImageUrl(product.hero_image_url, { width: 1200, quality: 82 }) || bannerCasing} 
            alt="" 
            width={1200}
            height={600}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/40" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/octg-directory">OCTG Products</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {category && (
                <>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/octg-directory/${category.slug}`}>{category.name}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {product.api_standard && (
                <Badge variant="secondary" className="text-sm">
                  {product.api_standard}
                </Badge>
              )}
              {category && (
                <Link to={`/octg-directory/${category.slug}`}>
                  <Badge variant="outline">
                    {category.name}
                  </Badge>
                </Link>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{product.name}</h1>
            {product.short_description && (
              <p className="text-xl text-muted-foreground max-w-3xl">
                {product.short_description}
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            {product.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="product-description prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                    {product.description}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Technical Specifications */}
            {technicalSpecs && Object.keys(technicalSpecs).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    Technical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="product-specs grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(technicalSpecs).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-col p-3 rounded-lg bg-muted/50"
                      >
                        <span className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                          {formatSpecKey(key)}
                        </span>
                        <span className="font-medium">{renderSpecValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Applications */}
            {applications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CircleDot className="w-5 h-5 text-primary" />
                    Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {applications.map((app, index) => (
                      <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                        {app}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Articles */}
            {articles && articles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Related Articles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {articles.slice(0, 4).map((article) => (
                      <Link
                        key={article.id}
                        to={`/article/${article.slug}`}
                        className="block group"
                      >
                        <div className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                          <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h4>
                          {article.subtitle && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {article.subtitle}
                            </p>
                          )}
                          {article.publish_date && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(article.publish_date), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {faqs.map((faq, index) => (
                    <div key={index}>
                      <h4 className="font-medium mb-2">{faq.question}</h4>
                      <p className="text-muted-foreground text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Manufacturers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Manufacturers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {manufacturers && manufacturers.length > 0 ? (
                  <div className="space-y-3">
                    {manufacturers.map((company) => (
                      <Link
                        key={company.id}
                        to={`/directory/company/${company.slug}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          {company.logo_url ? (
                            <img
                              src={company.logo_url}
                              alt={company.name}
                              className="w-8 h-8 object-contain rounded-full"
                            />
                          ) : (
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                            {company.name}
                          </p>
                          {company.headquarters && (
                            <p className="text-xs text-muted-foreground truncate">
                              {company.headquarters}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No manufacturers linked yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Industry Executives */}
            {executives && executives.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Industry Leaders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {executives.slice(0, 4).map((exec) => (
                      <Link
                        key={exec.id}
                        to={`/ceo/${exec.slug}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                          {exec.photo_url ? (
                            <img
                              src={exec.photo_url}
                              alt={exec.name}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                            {exec.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {exec.company_name}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Products */}
            {relatedProducts && relatedProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Related Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {relatedProducts.map((relProduct) => (
                      <Link
                        key={relProduct.id}
                        to={`/octg-directory/${category?.slug || categorySlug}/${relProduct.slug}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">
                          {relProduct.name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {category && (
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link to={`/octg-directory/${category.slug}`}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to {category.name}
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link to="/octg-directory">
                      <Package className="w-4 h-4 mr-2" />
                      Browse All Products
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link to="/directory">
                      <Building2 className="w-4 h-4 mr-2" />
                      Company Directory
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Photo Gallery */}
            {galleryImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Images className="w-5 h-5 text-primary" />
                    Photo Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {galleryImages.slice(0, 4).map((imageUrl, index) => (
                      <div 
                        key={index} 
                        className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                        onClick={() => {
                          setLightboxIndex(index);
                          setLightboxOpen(true);
                        }}
                      >
                        <img 
                          src={imageUrl} 
                          alt={`${product.name} photo ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">{product.name} Gallery</DialogTitle>
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {/* Previous Button */}
            {galleryImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20"
                onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </Button>
            )}

            {/* Main Image */}
            <img
              src={galleryImages[lightboxIndex]}
              alt={`${product.name} - Image ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain"
            />

            {/* Next Button */}
            {galleryImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20"
                onClick={() => setLightboxIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </Button>
            )}

            {/* Image Counter */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                {lightboxIndex + 1} / {galleryImages.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
