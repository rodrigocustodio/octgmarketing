import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-octg.jpg";
import { useHomepageArticles, ArticleWithTopics } from "@/hooks/useArticles";
import { optimizeImageUrl } from "@/lib/utils";
import { format } from "date-fns";
import { BreakingNewsRow } from "@/components/home/BreakingNewsRow";
import { IndustryFocusMasonry } from "@/components/home/IndustryFocusMasonry";
import { TopicRows } from "@/components/home/TopicRows";
import { QuickReadsGrid } from "@/components/home/QuickReadsGrid";
import { AnalysisReportsSection } from "@/components/home/AnalysisReportsSection";
import { UpcomingEventsSection } from "@/components/home/UpcomingEventsSection";
import { FeaturedEventSpotlight } from "@/components/home/FeaturedEventSpotlight";
import { MarketIntelligenceStrip } from "@/components/home/MarketIntelligenceStrip";
function formatArticleDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "MMMM d, yyyy");
  } catch {
    return "";
  }
}

// Helper to get next N unused articles
function getUnusedArticles(
  articles: ArticleWithTopics[],
  usedIds: Set<string>,
  count: number
): ArticleWithTopics[] {
  const result: ArticleWithTopics[] = [];
  for (const article of articles) {
    if (usedIds.has(article.id)) continue;
    result.push(article);
    usedIds.add(article.id);
    if (result.length >= count) break;
  }
  return result;
}

const Index = () => {
  const { data: articles, isLoading } = useHomepageArticles();

  // Memoize article distribution with deduplication
  const { 
    featuredArticle, 
    secondaryArticles, 
    breakingNewsArticles, 
    industryFocusArticles,
    topicRowsArticles,
    analysisArticles,
    quickReadsArticles,
    usedIds 
  } = useMemo(() => {
    if (!articles || articles.length === 0) {
      return {
        featuredArticle: null,
        secondaryArticles: [],
        breakingNewsArticles: [],
        industryFocusArticles: [],
        topicRowsArticles: [],
        analysisArticles: [],
        quickReadsArticles: [],
        usedIds: new Set<string>(),
      };
    }

    const usedIds = new Set<string>();

    // Hero: 1 article
    const featuredArticle = articles[0];
    usedIds.add(featuredArticle.id);

    // Secondary: 3 articles
    const secondaryArticles = getUnusedArticles(articles, usedIds, 3);

    // Breaking News: 3 articles
    const breakingNewsArticles = getUnusedArticles(articles, usedIds, 3);

    // Industry Focus: 5 articles
    const industryFocusArticles = getUnusedArticles(articles, usedIds, 5);

    // Topic Rows will handle its own deduplication using usedIds
    // Pass all remaining articles to TopicRows
    const topicRowsArticles = articles.filter(a => !usedIds.has(a.id));

    // Analysis & Reports: 7 articles (will be taken after TopicRows marks its usage)
    // We'll calculate this after TopicRows, but for now reserve what's left
    // TopicRows typically uses ~6 articles (3 topics x 2 each)
    
    // For initial calculation, assume TopicRows will use up to 6
    const estimatedTopicUsage = Math.min(6, topicRowsArticles.length);
    const remainingAfterTopics = articles.length - usedIds.size - estimatedTopicUsage;
    
    // We need to pass usedIds to TopicRows, so analysis will be calculated after
    // For now, set empty - actual slicing happens in component based on remaining
    const analysisArticles: ArticleWithTopics[] = [];
    const quickReadsArticles: ArticleWithTopics[] = [];

    return {
      featuredArticle,
      secondaryArticles,
      breakingNewsArticles,
      industryFocusArticles,
      topicRowsArticles,
      analysisArticles,
      quickReadsArticles,
      usedIds,
    };
  }, [articles]);

  // Calculate Analysis and QuickReads after TopicRows renders
  // Since TopicRows mutates usedIds, we need these as separate calculations
  const { finalAnalysisArticles, finalQuickReadsArticles } = useMemo(() => {
    if (!articles) return { finalAnalysisArticles: [], finalQuickReadsArticles: [] };
    
    // Get remaining articles not used by any section including TopicRows
    // TopicRows modifies usedIds directly, so we get fresh unused articles
    const remaining = articles.filter(a => !usedIds.has(a.id));
    
    // Analysis: up to 7 articles
    const analysisCount = Math.min(7, remaining.length);
    const finalAnalysisArticles = remaining.slice(0, analysisCount);
    finalAnalysisArticles.forEach(a => usedIds.add(a.id));
    
    // Quick Reads: up to 4 of remaining
    const afterAnalysis = remaining.slice(analysisCount);
    const finalQuickReadsArticles = afterAnalysis.slice(0, 4);
    
    return { finalAnalysisArticles, finalQuickReadsArticles };
  }, [articles, usedIds]);

  // Organization + WebSite Schema for SEO - NewsMediaOrganization for news-first positioning
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "NewsMediaOrganization"],
    "@id": "https://octgindex.com/#organization",
    "name": "OCTG Index",
    "url": "https://octgindex.com",
    "logo": "https://octgindex.com/favicon.svg",
    "description": "OCTG Index is a global energy industry news platform covering OCTG markets, supply chains, pricing intelligence, and major energy events worldwide.",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Houston",
      "addressRegion": "Texas",
      "addressCountry": "USA"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "info@octgindex.com",
      "contactType": "customer service"
    },
    "publishingPrinciples": "https://octgindex.com/editorial-policy",
    "sameAs": [
      "https://twitter.com/OCTGMarketing"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://octgindex.com/#website",
    "name": "OCTG Index",
    "url": "https://octgindex.com",
    "description": "OCTG Index is a global energy industry news platform covering OCTG markets, supply chains, pricing intelligence, and major energy events worldwide.",
    "publisher": {
      "@id": "https://octgindex.com/#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://octgindex.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <SEOHead
        title="OCTG Index | Energy Industry News & Market Intelligence"
        description="OCTG Index is a global energy industry news platform covering OCTG markets, supply chains, pricing intelligence, and major energy events worldwide."
        canonical="https://octgindex.com"
      />
      
      {/* Inject Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      
      <div className="min-h-screen bg-background">
        <Header />
      
      <main>
        {/* Hero Section - Optimized for LCP */}
        <section className="relative overflow-hidden h-[400px] sm:h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
          {/* Use img tag for LCP optimization instead of background-image */}
          <img
            src={optimizeImageUrl(featuredArticle?.hero_image_url, { width: 1200, quality: 85 }) || heroImage}
            alt=""
            width={1920}
            height={1080}
            fetchPriority="high"
            loading="eager"
            decoding="sync"
            className="absolute inset-0 w-full h-full object-cover object-right opacity-60"
          />
          <div className="container relative z-20 py-16 sm:py-24">
            {isLoading ? (
              <div className="max-w-4xl space-y-4 min-h-[200px]">
                <Skeleton className="h-8 w-32 bg-white/10" />
                <Skeleton className="h-12 w-3/4 bg-white/10" />
                <Skeleton className="h-6 w-1/2 bg-white/10" />
                <Skeleton className="h-10 w-40 bg-white/10" />
              </div>
            ) : featuredArticle ? (
              <div className="max-w-4xl animate-fade-in-up">
                <Badge variant="featured" className="mb-4">Featured Story</Badge>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white">
                  {featuredArticle.title}
                </h1>
                <p className="text-xl text-white/80 mb-6 max-w-2xl">
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
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white">
                  OCTG Index Intelligence
                </h1>
                <p className="text-xl text-white/80 mb-6 max-w-2xl">
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

        {/* Entity Declaration Strip - SEO identity statement */}
        <section className="bg-muted/50 border-y border-border/30 py-3">
          <div className="container">
            <p className="text-center text-muted-foreground text-sm sm:whitespace-nowrap">
              OCTG Index is a global energy industry news platform covering OCTG markets, supply chains, pricing intelligence, and major energy events worldwide.
            </p>
          </div>
        </section>

        {/* Market Intelligence Strip - Commodities + Cost Pressure Index */}
        <MarketIntelligenceStrip />
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

        {/* Featured Event Spotlight - 70/30 Video/Info Layout */}
        <FeaturedEventSpotlight />

        {/* SECTION 3: Upcoming Events - 6 Cards */}
        <UpcomingEventsSection />

        {/* SECTION 4: By Topic Rows */}
        <TopicRows articles={topicRowsArticles} usedIds={usedIds} />

        {/* SECTION 4: Analysis & Reports */}
        <AnalysisReportsSection articles={finalAnalysisArticles} />

        {/* SECTION 5: Quick Reads Grid */}
        <QuickReadsGrid articles={finalQuickReadsArticles} />

        {/* Newsletter CTA with Background Image */}
        <section className="relative overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('/images/newsletter-bg.jpg')` }}
          />
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/60" />
          {/* Content Container */}
          <div className="relative z-10 container py-12 sm:py-16">
            <NewsletterSignup />
          </div>
        </section>
      </main>

        <Footer />
      </div>
    </>
  );
};

export default Index;
