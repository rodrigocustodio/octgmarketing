import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { SEOHead } from "@/components/SEOHead";
import { Footer } from "@/components/layout/Footer";
import ShareButtons from "@/components/articles/ShareButtons";
import RelatedArticles from "@/components/articles/RelatedArticles";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { OctgMarketingPromo } from "@/components/articles/OctgMarketingPromo";
import { UpcomingEventCard } from "@/components/articles/UpcomingEventCard";
import { ArticleAuthorBox } from "@/components/articles/ArticleAuthorBox";
import { CompanySpotlightCard } from "@/components/articles/CompanySpotlightCard";
import { ArticleBody } from "@/components/articles/ArticleBody";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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

  const primaryCompany = article?.companies?.[0] || null;

  const [firstHalf, secondHalf] = article?.body 
    ? splitMarkdownAtMiddle(article.body) 
    : ['', ''];
  
  const firstHalfHtml = firstHalf ? markdownToHtml(firstHalf) : '';
  const secondHalfHtml = secondHalf ? markdownToHtml(secondHalf) : '';
  const fullBodyHtml = article?.body ? markdownToHtml(article.body) : '';
  
  const readingTime = article?.body ? estimateReadingTime(article.body) : "5 min read";

  const hasHeroImage = !!article?.hero_image_url;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <section className="container pt-8 sm:pt-12">
            <Skeleton className="h-5 w-48 mb-4" />
            <Skeleton className="h-6 w-20 mb-4" />
            <Skeleton className="h-10 w-3/4 mb-3" />
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-4 w-64 mb-6" />
            <Separator />
          </section>
          <section className="container py-8">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
              <div className="space-y-4">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
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
    ...(primaryCompany && {
      "mentions": {
        "@type": "Organization",
        "name": primaryCompany.name,
        "url": `https://octgindex.com/directory/company/${primaryCompany.slug}`
      }
    })
  };

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

  /* Sidebar widgets — shared between two-column and single-column layouts */
  const sidebarWidgets = (
    <>
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
      <div className="hidden lg:block">
        <UpcomingEventCard />
      </div>
      <div className="hidden lg:block">
        <OctgMarketingPromo />
      </div>
      <div className="hidden lg:block">
        <NewsletterSignup variant="compact" />
      </div>
      <div className="sticky top-24">
        <ShareButtons 
          url={canonicalUrl}
          title={article.title}
          subtitle={article.subtitle || ""}
          slug={article.slug}
        />
      </div>
    </>
  );

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
          {/* Editorial Header */}
          <section className="container pt-8 sm:pt-12">
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

            {/* Badge */}
            <div className="flex gap-2 mb-4">
              {article.region && (
                <Badge variant="default" className="bg-accent text-accent-foreground">
                  {article.region.name}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 max-w-3xl text-foreground">
              {article.title}
            </h1>

            {/* Subtitle */}
            {article.subtitle && (
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-6">
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

            <Separator className="mt-6" />
          </section>

          {/* Mobile hero image (above body, only on small screens) */}
          {hasHeroImage && (
            <div className="container pt-6 md:hidden">
              <img
                src={optimizeImageUrl(article.hero_image_url, { width: 800, quality: 85 })}
                alt={article.title}
                className="w-full max-h-[240px] object-cover rounded-lg"
              />
            </div>
          )}

          {/* Main Content */}
          <section className="container py-8 sm:py-12">
            {hasHeroImage ? (
              /* Two-column layout when hero image exists */
              <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
                {/* Article Body — left column */}
                <div>
                  {primaryCompany && secondHalfHtml ? (
                    <ArticleBody 
                      slots={[
                        { type: 'prose', content: firstHalfHtml },
                        { 
                          type: 'component', 
                          component: (
                            <CompanySpotlightCard
                              name={primaryCompany.name}
                              slug={primaryCompany.slug}
                              headquarters={primaryCompany.headquarters}
                              website={primaryCompany.website}
                            />
                          )
                        },
                        { type: 'prose', content: secondHalfHtml },
                      ]}
                    />
                  ) : (
                    <ArticleBody 
                      slots={[
                        { type: 'prose', content: fullBodyHtml }
                      ]}
                    />
                  )}

                  {article.author && (
                    <ArticleAuthorBox author={article.author} />
                  )}
                </div>

                {/* Sidebar — right column */}
                <aside className="space-y-6">
                  {/* Desktop/tablet hero image */}
                  <div className="hidden md:block">
                    <img
                      src={optimizeImageUrl(article.hero_image_url, { width: 760, quality: 85 })}
                      alt={article.title}
                      width={760}
                      height={570}
                      className="w-full rounded-lg object-cover aspect-[4/3]"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {article.title}
                    </p>
                  </div>

                  {sidebarWidgets}
                </aside>
              </div>
            ) : (
              /* Single-column layout when no hero image */
              <div>
                <div className="max-w-3xl">
                  {primaryCompany && secondHalfHtml ? (
                    <ArticleBody 
                      slots={[
                        { type: 'prose', content: firstHalfHtml },
                        { 
                          type: 'component', 
                          component: (
                            <CompanySpotlightCard
                              name={primaryCompany.name}
                              slug={primaryCompany.slug}
                              headquarters={primaryCompany.headquarters}
                              website={primaryCompany.website}
                            />
                          )
                        },
                        { type: 'prose', content: secondHalfHtml },
                      ]}
                    />
                  ) : (
                    <ArticleBody 
                      slots={[
                        { type: 'prose', content: fullBodyHtml }
                      ]}
                    />
                  )}

                  {article.author && (
                    <ArticleAuthorBox author={article.author} />
                  )}
                </div>

                {/* Sidebar widgets stacked below content */}
                <div className="mt-12 max-w-md space-y-6">
                  {sidebarWidgets}
                </div>
              </div>
            )}
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

          {/* Newsletter CTA with Background Image */}
          <section className="relative overflow-hidden border-t border-border">
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url('/images/newsletter-bg.jpg')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/60" />
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

export default Article;
