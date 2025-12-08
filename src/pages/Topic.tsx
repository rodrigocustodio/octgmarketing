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
import { useArticlesByTopic, useTopics } from "@/hooks/useArticles";
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

const topicDescriptions: Record<string, string> = {
  "mills-manufacturing": "Coverage of OCTG mills, manufacturing facilities, production capacity, and steelmaking technology across the global supply chain.",
  "yards-supply-chain": "Analysis of pipe yards, inventory management, logistics, and supply chain dynamics in the OCTG industry.",
  "pricing-market": "Market intelligence on OCTG pricing trends, trade flows, tariffs, and competitive landscape analysis.",
  "projects-contracts": "Breaking news on major drilling projects, contract awards, and procurement decisions across oil & gas operators.",
};

const Topic = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: topics, isLoading: topicsLoading } = useTopics();
  const { data: articles, isLoading: articlesLoading } = useArticlesByTopic(slug || "");

  const topic = topics?.find((t) => t.slug === slug);
  const description = slug ? topicDescriptions[slug] || `Latest OCTG news and analysis about ${topic?.name || slug}.` : "";
  const canonicalUrl = `https://octgindex.com/topic/${slug}`;

  const isLoading = topicsLoading || articlesLoading;

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

  if (!topic) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Topic Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The topic you're looking for doesn't exist.
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
        <title>{topic.name} | OCTG Index</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${topic.name} | OCTG Index`} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={heroImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="OCTG Index" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={topic.name} />
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
                      {topic.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {/* Title */}
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
                {topic.name}
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
                  No articles available for this topic yet.
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
                  Stay Updated on {topic.name}
                </h2>
                <p className="text-muted-foreground mb-8">
                  Get the latest {topic.name} news and analysis delivered to your inbox weekly.
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

export default Topic;
