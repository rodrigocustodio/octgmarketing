import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-octg.jpg";
import { usePublishedArticles } from "@/hooks/useArticles";
import { format } from "date-fns";
import { BreakingNewsRow } from "@/components/home/BreakingNewsRow";
import { IndustryFocusMasonry } from "@/components/home/IndustryFocusMasonry";
import { TopicRows } from "@/components/home/TopicRows";
import { QuickReadsGrid } from "@/components/home/QuickReadsGrid";

function formatArticleDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "MMMM d, yyyy");
  } catch {
    return "";
  }
}

const Index = () => {
  const { data: articles, isLoading } = usePublishedArticles();

  // Slice articles for different sections
  const featuredArticle = articles?.[0];
  const secondaryArticles = articles?.slice(1, 4) || [];
  const breakingNewsArticles = articles?.slice(4, 7) || [];
  const industryFocusArticles = articles?.slice(7, 12) || [];
  const quickReadsArticles = articles?.slice(12, 16) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: `url(${featuredArticle?.hero_image_url || heroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center right',
            }}
          />
          <div className="container relative z-20 py-16 sm:py-24">
            {isLoading ? (
              <div className="max-w-4xl space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-10 w-40" />
              </div>
            ) : featuredArticle ? (
              <div className="max-w-4xl animate-fade-in-up">
                <Badge variant="featured" className="mb-4">Featured Story</Badge>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
                  {featuredArticle.title}
                </h1>
                <p className="text-xl text-muted-foreground mb-6 max-w-2xl">
                  {featuredArticle.subtitle}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to={`/article/${featuredArticle.slug}`}>
                    <Button variant="hero">
                      Read Full Story <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/directory">
                    <Button variant="hero-outline">
                      Browse Directory
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl">
                <Badge variant="featured" className="mb-4">Coming Soon</Badge>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
                  OCTG Index Intelligence
                </h1>
                <p className="text-xl text-muted-foreground mb-6 max-w-2xl">
                  Your source for Oil Country Tubular Goods industry news and analysis
                </p>
                <Link to="/directory">
                  <Button variant="hero-outline">
                    Browse Directory
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Secondary Articles - 3 Cards */}
        {secondaryArticles.length > 0 && (
          <section className="container py-12">
            <div className="grid md:grid-cols-3 gap-6">
              {secondaryArticles.map((article, index) => {
                const placeholderImages = [
                  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
                  "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80",
                  "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80",
                ];
                const imageUrl = article.hero_image_url || placeholderImages[index % placeholderImages.length];
                
                return (
                  <div key={article.id} className={`animate-fade-in-up animation-delay-${(index + 1) * 100}`}>
                    <ArticleCard
                      title={article.title}
                      subtitle={article.subtitle || undefined}
                      imageUrl={imageUrl}
                      region={article.region?.name}
                      date={formatArticleDate(article.publish_date)}
                      slug={article.slug}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 1: Breaking News Row */}
        <BreakingNewsRow articles={breakingNewsArticles} />

        {/* SECTION 2: Industry Focus Masonry */}
        <IndustryFocusMasonry articles={industryFocusArticles} />

        {/* SECTION 3: By Topic Rows */}
        <TopicRows />

        {/* SECTION 4: Quick Reads Grid */}
        <QuickReadsGrid articles={quickReadsArticles} />

        {/* Newsletter CTA */}
        <section className="bg-card">
          <div className="container py-12 sm:py-16">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Stay Ahead of the Market
              </h2>
              <p className="text-muted-foreground mb-8">
                Subscribe to receive weekly insights on OCTG market trends, pricing analysis, and industry developments.
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
  );
};

export default Index;
