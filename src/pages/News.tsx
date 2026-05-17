import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { usePublishedArticles } from "@/hooks/useArticles";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Newspaper } from "lucide-react";
import { format } from "date-fns";
import { optimizeImageUrl } from "@/lib/utils";

const PAGE_SIZE = 18;

export default function News() {
  const { data: articles, isLoading } = usePublishedArticles(60);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Group only the visible slice by month
  const articlesByMonth = useMemo(() => {
    if (!articles) return {};
    return articles.slice(0, visibleCount).reduce((acc, article) => {
      const monthKey = article.publish_date
        ? format(new Date(article.publish_date), "MMMM yyyy")
        : "Undated";
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(article);
      return acc;
    }, {} as Record<string, typeof articles>);
  }, [articles, visibleCount]);

  const hasMore = (articles?.length || 0) > visibleCount;

  // Schema.org structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://octgindex.com"
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "News",
        item: "https://octgindex.com/news"
      }
    ]
  };

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://octgindex.com/news",
    name: "OCTG Industry News & Market Updates",
    description: "Breaking news, analysis, and market intelligence for the oil country tubular goods industry. Coverage spans mills, manufacturers, pricing trends, and global supply chain developments.",
    url: "https://octgindex.com/news",
    isPartOf: {
      "@type": "WebSite",
      name: "OCTG Index",
      url: "https://octgindex.com"
    },
    publisher: {
      "@type": "Organization",
      name: "OCTG Index",
      url: "https://octgindex.com"
    }
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Latest OCTG News Articles",
    numberOfItems: articles?.length || 0,
    itemListElement: articles?.slice(0, 20).map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://octgindex.com/article/${article.slug}`,
      name: article.title
    })) || []
  };

  return (
    <>
      <SEOHead
        title="OCTG Industry News & Market Updates | OCTG Index"
        description="Breaking news, analysis, and market intelligence for the oil country tubular goods industry. Coverage spans mills, manufacturers, pricing trends, and global supply chain developments."
        canonical="https://octgindex.com/news"
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify([breadcrumbSchema, collectionPageSchema, itemListSchema])}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main>
          {/* Hero Section */}
          <section className="bg-gradient-to-b from-primary/5 via-background to-background border-b border-border">
            <div className="container py-12 md:py-16">
              <Breadcrumb className="mb-6">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>News</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex items-center gap-3 mb-4">
                <Newspaper className="h-8 w-8 text-accent" />
                <Badge variant="secondary">Updated Daily</Badge>
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
                OCTG Industry News & Market Updates
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6">
                Your trusted source for breaking news and in-depth analysis across the global OCTG industry. 
                Our editorial team delivers comprehensive coverage of market trends, company developments, 
                pricing intelligence, mergers and acquisitions, regulatory changes, and technological innovations 
                shaping the oil country tubular goods sector. From Americas to Asia-Pacific, we cover every 
                major producing region with accuracy and insight.
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {articles?.length || 0}+ Articles Published
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent"></span>
                  6 Global Regions
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Daily Updates
                </span>
              </div>
            </div>
          </section>

          {/* News Content */}
          <section className="container py-12">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(articlesByMonth).map(([month, monthArticles]) => (
                  <div key={month}>
                    <h2 className="font-display text-xl font-bold text-muted-foreground mb-6 border-b border-border pb-2">
                      {month}
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {monthArticles.map((article) => (
                        <ArticleCard
                          key={article.id}
                          title={article.title}
                          subtitle={article.subtitle || undefined}
                          imageUrl={optimizeImageUrl(article.hero_image_url, { width: 600 }) || undefined}
                          region={article.region?.name}
                          date={article.publish_date ? format(new Date(article.publish_date), "MMM d, yyyy") : undefined}
                          slug={article.slug}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SEO Content Section */}
          <section className="container py-12 border-t border-border">
            <div className="max-w-3xl">
              <h2 className="font-display text-2xl font-bold mb-4">
                About OCTG Index News Coverage
              </h2>
              <div className="prose prose-sm dark:prose-invert text-muted-foreground space-y-4">
                <p>
                  OCTG Index provides independent, authoritative news coverage for professionals in the oil country 
                  tubular goods industry. Our editorial team monitors developments across steel mills, pipe manufacturers, 
                  threading yards, inspection services, and drilling contractors worldwide.
                </p>
                <p>
                  We cover critical market intelligence including steel pricing trends, supply chain disruptions, 
                  M&A activity, regulatory changes, and technological innovations. Our regional coverage spans 
                  the Americas, Europe, Middle East, Africa, Asia-Pacific, and Australia—ensuring comprehensive 
                  visibility into global OCTG markets.
                </p>
                <p>
                  For energy professionals, procurement specialists, and industry executives, OCTG Index delivers 
                  the actionable intelligence needed to navigate this dynamic sector. Subscribe to our newsletter 
                  for weekly market updates delivered directly to your inbox.
                </p>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
