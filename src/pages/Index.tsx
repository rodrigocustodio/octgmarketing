import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, TrendingUp, Factory, Anchor, Flame, Globe, FileText } from "lucide-react";
import { useState } from "react";
import heroImage from "@/assets/hero-octg.jpg";
import { usePublishedArticles, useRegions, ArticleWithRegion } from "@/hooks/useArticles";
import { format } from "date-fns";

const topics = [
  { name: "Mills & Manufacturing", slug: "mills-manufacturing", icon: Factory },
  { name: "Yards & Supply Chain", slug: "yards-supply-chain", icon: Anchor },
  { name: "Pricing & Market", slug: "pricing-market", icon: TrendingUp },
  { name: "Projects & Contracts", slug: "projects-contracts", icon: MapPin },
];

function formatArticleDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "MMMM d, yyyy");
  } catch {
    return "";
  }
}

const Index = () => {
  const [activeRegion, setActiveRegion] = useState<string>("americas");
  const { data: articles, isLoading } = usePublishedArticles();
  const { data: regions } = useRegions();

  // Slice articles for different sections
  const featuredArticle = articles?.[0];
  const secondaryArticles = articles?.slice(1, 4) || [];
  const trendingFeatured = articles?.[4];
  const trendingList = articles?.slice(5, 8) || [];
  const analysisArticles = articles?.slice(8, 13) || [];

  // Filter articles by active region
  const regionalArticles = articles?.filter(
    (a) => a.region?.slug === activeRegion
  ).slice(0, 2) || [];

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
                  <Link to="/map">
                    <Button variant="hero-outline">
                      Explore Asset Map
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl">
                <Badge variant="featured" className="mb-4">Coming Soon</Badge>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
                  OCTG Marketing Intelligence
                </h1>
                <p className="text-xl text-muted-foreground mb-6 max-w-2xl">
                  Your source for Oil Country Tubular Goods industry news and analysis
                </p>
                <Link to="/map">
                  <Button variant="hero-outline">
                    Explore Asset Map
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Secondary Articles */}
        {secondaryArticles.length > 0 && (
          <section className="container py-12">
            <div className="grid md:grid-cols-3 gap-6">
              {secondaryArticles.map((article, index) => (
                <div key={article.id} className={`animate-fade-in-up animation-delay-${(index + 1) * 100}`}>
                  <ArticleCard
                    title={article.title}
                    subtitle={article.subtitle || undefined}
                    imageUrl={article.hero_image_url || undefined}
                    region={article.region?.name}
                    date={formatArticleDate(article.publish_date)}
                    slug={article.slug}
                  />
                </div>
              ))}
            </div>
          </section>
        )}


        {/* SECTION 1: Trending This Week */}
        {trendingFeatured && (
          <>
            <section className="container py-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Flame className="h-5 w-5 text-accent" />
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight">Trending This Week</h2>
              </div>
              
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Featured Large Card */}
                <div className="lg:col-span-3">
                  <Link to={`/article/${trendingFeatured.slug}`}>
                    <Card variant="article" className="h-full overflow-hidden group">
                      <div className="relative h-64 lg:h-full min-h-[300px]">
                        <img 
                          src={trendingFeatured.hero_image_url || heroImage} 
                          alt={trendingFeatured.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <div className="flex gap-2 mb-3">
                            {trendingFeatured.region && (
                              <Badge variant="region">{trendingFeatured.region.name}</Badge>
                            )}
                          </div>
                          <h3 className="font-display text-xl lg:text-2xl font-bold mb-2 group-hover:text-accent transition-colors">
                            {trendingFeatured.title}
                          </h3>
                          <p className="text-muted-foreground line-clamp-2">
                            {trendingFeatured.subtitle}
                          </p>
                          <p className="text-sm text-muted-foreground/70 mt-3">
                            {formatArticleDate(trendingFeatured.publish_date)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </div>

                {/* Stacked List */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  {trendingList.map((article, index) => (
                    <Link key={article.id} to={`/article/${article.slug}`}>
                      <Card variant="interactive" className="p-4 h-full">
                        <CardContent className="p-0">
                          {article.region && (
                            <Badge variant="topic" className="mb-2 text-xs">{article.region.name}</Badge>
                          )}
                          <h4 className="font-display font-semibold mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                            {article.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {formatArticleDate(article.publish_date)}
                          </p>
                        </CardContent>
                        {index < trendingList.length - 1 && (
                          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                        )}
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

          </>
        )}

        {/* Topics Grid */}
        <section className="container py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-bold tracking-tight">Browse by Topic</h2>
            <Link to="/topics">
              <Button variant="ghost">View All <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topics.map((topic) => (
              <Link key={topic.slug} to={`/topic/${topic.slug}`}>
                <Card variant="interactive" className="p-6">
                  <CardContent className="p-0 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-accent/10">
                      <topic.icon className="h-6 w-6 text-accent" />
                    </div>
                    <span className="font-display text-base font-semibold tracking-tight">{topic.name}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>


        {/* SECTION 2: Regional Spotlight */}
        {regions && regions.length > 0 && (
          <>
            <section className="container py-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight">Regional Spotlight</h2>
              </div>

              {/* Region Tabs */}
              <div className="flex flex-wrap gap-2 mb-8">
                {regions.map((region) => (
                  <Button
                    key={region.id}
                    variant={activeRegion === region.slug ? "steel" : "outline"}
                    size="sm"
                    onClick={() => setActiveRegion(region.slug)}
                    className="transition-all duration-200"
                  >
                    {region.name}
                  </Button>
                ))}
              </div>

              {/* Regional Cards */}
              {regionalArticles.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {regionalArticles.map((article) => (
                    <Link key={article.id} to={`/article/${article.slug}`}>
                      <Card 
                        variant="interactive" 
                        className="overflow-hidden group h-full animate-fade-in"
                      >
                        <div className="flex flex-col sm:flex-row h-full">
                          <div className="sm:w-2/5 h-48 sm:h-auto relative overflow-hidden">
                            <img 
                              src={article.hero_image_url || heroImage} 
                              alt={article.title}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="sm:w-3/5 p-5 flex flex-col justify-center">
                            {article.region && (
                              <Badge variant="topic" className="w-fit mb-3">{article.region.name}</Badge>
                            )}
                            <h3 className="font-display text-lg font-bold mb-2 group-hover:text-accent transition-colors line-clamp-2">
                              {article.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {article.subtitle}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              {formatArticleDate(article.publish_date)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No articles available for this region yet.
                </div>
              )}
            </section>

          </>
        )}

        {/* Data & Indices Teaser */}
        <section className="container py-12">
          <Card variant="elevated" className="p-8 sm:p-12 octg-texture">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Badge variant="asset" className="mb-4">Data & Analytics</Badge>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                  Interactive Asset Map
                </h2>
                <p className="text-muted-foreground mb-6">
                  Explore global OCTG infrastructure including mills, pipe yards, rigs, and port facilities. 
                  Filter by region, asset type, and operator.
                </p>
                <Link to="/map">
                  <Button variant="steel" size="lg">
                    Explore Map <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 animate-pulse" />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-accent/30 to-primary/30" />
                  <div className="absolute inset-8 rounded-full bg-gradient-to-br from-accent/40 to-primary/40 flex items-center justify-center">
                    <Globe className="h-16 w-16 text-accent" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* SECTION 3: Analysis & Reports */}
        {analysisArticles.length > 0 && (
          <>

            <section className="container py-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileText className="h-5 w-5 text-foreground" />
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">Analysis & Reports</h2>
                </div>
                <Link to="/analysis">
                  <Button variant="ghost">View All <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Featured Analysis */}
                {analysisArticles[0] && (
                  <div className="lg:col-span-2 lg:row-span-2">
                    <Link to={`/article/${analysisArticles[0].slug}`}>
                      <Card variant="article" className="h-full overflow-hidden group">
                        <div className="relative h-full min-h-[400px]">
                          <img 
                            src={analysisArticles[0].hero_image_url || heroImage} 
                            alt={analysisArticles[0].title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                            {analysisArticles[0].region && (
                              <Badge variant="topic" className="mb-3">{analysisArticles[0].region.name}</Badge>
                            )}
                            <h3 className="font-display text-xl sm:text-2xl font-bold mb-3 group-hover:text-accent transition-colors">
                              {analysisArticles[0].title}
                            </h3>
                            <p className="text-muted-foreground line-clamp-2 mb-3">
                              {analysisArticles[0].subtitle}
                            </p>
                            <p className="text-sm text-muted-foreground/70">
                              {formatArticleDate(analysisArticles[0].publish_date)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </div>
                )}

                {/* Analysis Grid */}
                <div className="space-y-4">
                  {analysisArticles.slice(1, 5).map((article) => (
                    <Link key={article.id} to={`/article/${article.slug}`}>
                      <Card variant="interactive" className="p-4">
                        <CardContent className="p-0">
                          {article.region && (
                            <Badge variant="outline" className="mb-2 text-xs">{article.region.name}</Badge>
                          )}
                          <h4 className="font-display font-semibold text-sm mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                            {article.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {article.subtitle}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            {formatArticleDate(article.publish_date)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* Newsletter CTA */}
        <section className="bg-card border-t border-b border-border">
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
