import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import ShareButtons from "@/components/articles/ShareButtons";
import RelatedArticles from "@/components/articles/RelatedArticles";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Calendar, Clock } from "lucide-react";
import { useArticleBySlug, useRelatedArticles } from "@/hooks/useArticles";
import { markdownToHtml } from "@/lib/markdown";
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

function estimateReadingTime(text: string): string {
  const wordsPerMinute = 200;
  const words = text.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

const Article = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useArticleBySlug(slug || "");
  const { data: relatedArticles } = useRelatedArticles(
    slug || "",
    article?.region?.id,
    3
  );

  const canonicalUrl = `https://octgindex.com/article/${slug}`;

  // Convert markdown body to HTML
  const bodyHtml = article?.body ? markdownToHtml(article.body) : "";
  const readingTime = article?.body ? estimateReadingTime(article.body) : "5 min read";

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The article you're looking for doesn't exist or has been removed.
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
        <title>{article.title} | OCTG Index</title>
        <meta name="description" content={article.subtitle || ""} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.subtitle || ""} />
        <meta property="og:image" content={article.hero_image_url || "https://octgindex.com/og-default.png"} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="OCTG Index" />
        <meta property="article:published_time" content={article.publish_date || ""} />
        {article.region && <meta property="article:section" content={article.region.name} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.subtitle || ""} />
        <meta name="twitter:image" content={article.hero_image_url || "https://octgindex.com/og-default.png"} />
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
                backgroundImage: `url(${article.hero_image_url || heroImage})`,
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
                  {article.region && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link 
                            to={`/region/${article.region.slug}`} 
                            className="text-muted-foreground hover:text-accent"
                          >
                            {article.region.name}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>

              {/* Badges */}
              <div className="flex gap-2 mb-4">
                {article.region && (
                  <Badge variant="default" className="bg-accent text-accent-foreground">
                    {article.region.name}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 max-w-4xl">
                {article.title}
              </h1>

              {/* Subtitle */}
              {article.subtitle && (
                <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mb-6">
                  {article.subtitle}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatArticleDate(article.publish_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{readingTime}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="container py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Article Body */}
              <div className="lg:col-span-2">
                <article 
                  className="article-content max-w-none"
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              </div>

              {/* Sidebar */}
              <aside className="space-y-6">
                {/* Related Articles */}
                {relatedArticles && relatedArticles.length > 0 && (
                  <RelatedArticles 
                    articles={relatedArticles.map((a) => ({
                      title: a.title,
                      region: a.region?.name || "",
                      date: formatArticleDate(a.publish_date),
                      slug: a.slug,
                    }))}
                    currentRegion={article.region?.name}
                  />
                )}

                {/* Newsletter - Stay Informed */}
                <div className="hidden lg:block">
                  <NewsletterSignup />
                </div>

                {/* Share Buttons - below newsletter, sticky for visibility */}
                <div className="sticky top-24">
                  <ShareButtons 
                    url={canonicalUrl}
                    title={article.title}
                    subtitle={article.subtitle || ""}
                    slug={article.slug}
                  />
                </div>
              </aside>
            </div>
          </section>

          {/* More from Region */}
          {relatedArticles && relatedArticles.length > 0 && article.region && (
            <section className="border-t border-border">
              <div className="container py-12">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-8">
                  More from {article.region.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedArticles.map((relatedArticle) => (
                    <ArticleCard 
                      key={relatedArticle.id}
                      title={relatedArticle.title}
                      subtitle={relatedArticle.subtitle || undefined}
                      imageUrl={relatedArticle.hero_image_url || undefined}
                      region={relatedArticle.region?.name}
                      date={formatArticleDate(relatedArticle.publish_date)}
                      slug={relatedArticle.slug}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Newsletter CTA */}
          <section className="bg-card border-t border-border">
            <div className="container py-12 sm:py-16">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-4">
                  Stay Informed
                </h2>
                <p className="text-muted-foreground mb-8">
                  Get the latest OCTG industry news and analysis delivered to your inbox weekly.
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

export default Article;
