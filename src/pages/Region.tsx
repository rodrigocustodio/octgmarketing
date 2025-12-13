import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { SEOHead } from "@/components/SEOHead";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { useArticlesByRegion, useRegions } from "@/hooks/useArticles";
import { format } from "date-fns";
import heroImage from "@/assets/hero-octg.jpg";
import { generateRegionTitle, generateRegionDescription } from "@/lib/seo-utils";

function formatArticleDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "MMMM d, yyyy");
  } catch {
    return "";
  }
}

const regionDescriptions: Record<string, string> = {
  "americas": "Coverage of OCTG markets across North America, South America, and Latin America including the Permian Basin, Gulf of Mexico, and Vaca Muerta.",
  "europe": "Analysis of European OCTG markets including the North Sea, Norway, UK, and emerging Eastern European opportunities.",
  "africa": "Insights on African oil & gas developments across Nigeria, Angola, Libya, and emerging frontiers like Mozambique and Senegal.",
  "middle-east": "Comprehensive coverage of Middle Eastern OCTG markets including Saudi Arabia, UAE, Qatar, Kuwait, and Iraq.",
  "asia-pacific": "Market intelligence on Asia-Pacific OCTG demand from China, India, Indonesia, and Southeast Asia.",
  "australia": "Comprehensive coverage of Australia's oil and gas sector, including major LNG projects, offshore developments, and OCTG supply chain dynamics across the continent.",
};

const Region = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: regions, isLoading: regionsLoading } = useRegions();
  const { data: articles, isLoading: articlesLoading } = useArticlesByRegion(slug || "");

  const region = regions?.find((r) => r.slug === slug);
  const description = slug ? regionDescriptions[slug] || `Latest OCTG news and analysis from ${region?.name || slug}.` : "";
  const canonicalUrl = `https://octgindex.com/region/${slug}`;

  const isLoading = regionsLoading || articlesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <section className="relative overflow-hidden py-12 sm:py-20">
            <div className="container">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-12 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          </section>
          <section className="container py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (!region) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Region Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The region you're looking for doesn't exist.
            </p>
            <Link to="/" className="text-accent hover:underline">
              Return to Homepage
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={generateRegionTitle(region.name, "news")}
        description={generateRegionDescription(region.name, "news")}
        canonical={canonicalUrl}
      />

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero Section - 50/50 Split Layout */}
          <section className="relative overflow-hidden min-h-[280px] sm:min-h-[350px]">
            {/* Left half gradient - solid coverage for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background to-background/80 lg:to-transparent lg:via-50% z-10" />
            {/* Right half image - sharp and visible */}
            <img 
              src={heroImage}
              alt=""
              className="absolute right-0 top-0 w-full lg:w-[55%] h-full object-cover object-left"
            />
            
            <div className="container relative z-20 py-12 sm:py-20">
              {/* Breadcrumbs */}
              <Breadcrumb className="mb-6">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/" className="text-muted-foreground hover:text-accent">
                        Home
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink className="text-foreground">
                      {region.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {/* Title */}
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 max-w-xl lg:max-w-[45%]">
                {region.name}
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl lg:max-w-[40%]">
                {description}
              </p>
            </div>
          </section>

          {/* Articles Grid */}
          <section className="container py-12">
            {articles && articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <ArticleCard 
                    key={article.id}
                    title={article.title}
                    subtitle={article.subtitle || undefined}
                    imageUrl={article.hero_image_url || undefined}
                    region={article.region?.name}
                    date={formatArticleDate(article.publish_date)}
                    slug={article.slug}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">
                  No articles available for this region yet.
                </p>
                <Link to="/" className="text-accent hover:underline mt-4 inline-block">
                  Browse all articles
                </Link>
              </div>
            )}
          </section>

          {/* Newsletter CTA with Background Image */}
          <section className="relative overflow-hidden border-t border-border">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url('/images/newsletter-bg.jpg')` }}
            />
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/60" />
            {/* Content Container */}
            <div className="relative z-10 container py-12 sm:py-16">
              <div className="max-w-2xl mx-auto">
                <NewsletterSignup />
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Region;
