import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { SEOHead } from "@/components/SEOHead";
import { Footer } from "@/components/layout/Footer";
import ShareButtons from "@/components/articles/ShareButtons";
import RelatedArticles from "@/components/articles/RelatedArticles";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { OctgMarketingPromo } from "@/components/articles/OctgMarketingPromo";
import { ArticleAuthorBox } from "@/components/articles/ArticleAuthorBox";
import { CompanySpotlightCard } from "@/components/articles/CompanySpotlightCard";
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
import { markdownToHtml, splitMarkdownAtMiddle } from "@/lib/markdown";
import { format } from "date-fns";
import heroImage from "@/assets/hero-octg.jpg";
import { generateArticleTitle, generateArticleDescription } from "@/lib/seo-utils";
import { optimizeImageUrl } from "@/lib/utils";

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

  // Get primary company for inline card (first associated company)
  const primaryCompany = article?.companies?.[0] || null;

  // Split markdown at middle for inline company card insertion
  const [firstHalf, secondHalf] = article?.body 
    ? splitMarkdownAtMiddle(article.body) 
    : ['', ''];
  
  // Convert markdown to HTML
  const firstHalfHtml = firstHalf ? markdownToHtml(firstHalf) : '';
  const secondHalfHtml = secondHalf ? markdownToHtml(secondHalf) : '';
  const fullBodyHtml = article?.body ? markdownToHtml(article.body) : '';
  
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

  // NewsArticle Schema for SEO (with company mentions if available)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.subtitle || "",
    "image": article.hero_image_url || "https://octgindex.com/og-default.png",
    "datePublished": article.publish_date || article.created_at,
    "dateModified": article.publish_date || article.created_at,
    "author": article.author ? {
      "@type": "Person",
      "name": article.author.name,
      "jobTitle": article.author.title
    } : {
      "@type": "Organization",
      "name": "OCTG Index Editorial Team"
    },
    "publisher": {
      "@type": "Organization",
      "@id": "https://octgindex.com/#organization",
      "name": "OCTG Index",
      "logo": {
        "@type": "ImageObject",
        "url": "https://octgindex.com/favicon.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    // Add company mentions for SEO
    ...(primaryCompany && {
      "mentions": {
        "@type": "Organization",
        "name": primaryCompany.name,
        "url": `https://octgindex.com/directory/company/${primaryCompany.slug}`
      }
    })
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://octgindex.com"
      },
      ...(article.region ? [{
        "@type": "ListItem",
        "position": 2,
        "name": article.region.name,
        "item": `https://octgindex.com/region/${article.region.slug}`
      }] : []),
      {
        "@type": "ListItem",
        "position": article.region ? 3 : 2,
        "name": article.title,
        "item": canonicalUrl
      }
    ]
  };

  return (
    <>
      <SEOHead
        title={generateArticleTitle(article.title)}
        description={generateArticleDescription(article.subtitle, article.body)}
        canonical={canonicalUrl}
        image={article.hero_image_url || undefined}
        type="article"
        publishedTime={article.publish_date || undefined}
        section={article.region?.name}
      />
      
      {/* Inject Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent z-10" />
            <img
              src={optimizeImageUrl(article.hero_image_url, { width: 1200, quality: 85 }) || heroImage}
              alt=""
              width={1200}
              height={600}
              className="absolute inset-0 w-full h-full object-cover object-right opacity-40 dark:opacity-50"
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
                {/* If we have a company and enough content to split, render split content with card */}
                {primaryCompany && secondHalfHtml ? (
                  <article className="article-content max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: firstHalfHtml }} />
                    
                    <CompanySpotlightCard
                      name={primaryCompany.name}
                      slug={primaryCompany.slug}
                      headquarters={primaryCompany.headquarters}
                      website={primaryCompany.website}
                    />
                    
                    <div dangerouslySetInnerHTML={{ __html: secondHalfHtml }} />
                  </article>
                ) : (
                  <article 
                    className="article-content max-w-none"
                    dangerouslySetInnerHTML={{ __html: fullBodyHtml }}
                  />
                )}

                {/* Author Box with CTA */}
                {article.author && (
                  <ArticleAuthorBox author={article.author} />
                )}
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

                {/* OCTG Marketing Promo */}
                <div className="hidden lg:block">
                  <OctgMarketingPromo />
                </div>

                {/* Newsletter - Stay Informed */}
                <div className="hidden lg:block">
                  <NewsletterSignup variant="compact" />
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
