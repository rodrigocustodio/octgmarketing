import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
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
      <Helmet>
        <title>{region.name} OCTG News & Analysis | OCTG Index</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${region.name} OCTG News & Analysis | OCTG Index`} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={heroImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="OCTG Index" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${region.name} OCTG News & Analysis`} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={heroImage} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent z-10" />
            <div 
              className="absolute inset-0 opacity-40 dark:opacity-50"
              style={{
                backgroundImage: `url(${heroImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center right',
              }}
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
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
                {region.name}
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl">
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

          {/* Newsletter CTA */}
          <section className="bg-card border-t border-border">
            <div className="container py-12 sm:py-16">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-4">
                  Stay Updated on {region.name}
                </h2>
                <p className="text-muted-foreground mb-8">
                  Get the latest {region.name} OCTG news and analysis delivered to your inbox weekly.
                </p>
                <div className="max-w-md mx-auto">
                  <NewsletterSignup />
                </div>
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
