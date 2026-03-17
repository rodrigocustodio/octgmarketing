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
import { Helmet } from "react-helmet-async";
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
            <div className="flex flex-col md:flex-row gap-6 lg:gap-8 md:min-h-[320px] md:max-h-[520px]">
              <Skeleton className="w-full md:w-[45%] lg:w-1/2 rounded-lg min-h-[260px]" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Separator className="mt-6" />
          </section>
          <section className="container py-8">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8">
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
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
      
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Breadcrumbs */}
          <section className="container pt-8 sm:pt-12">
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

            {/* Hero Section — flex row, text left, image right */}
            <div className={`flex gap-6 lg:gap-8 ${hasHeroImage ? 'flex-col md:flex-row md:items-stretch md:min-h-[320px] md:max-h-[520px]' : 'flex-col'}`}>
              {/* Left: Article Header Text */}
              <div className={`flex flex-col justify-center gap-4 ${hasHeroImage ? 'md:w-[55%] lg:w-1/2' : 'w-full'}`}>
                {article.region && (
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-accent text-accent-foreground">
                      {article.region.name}
                    </Badge>
                  </div>
                )}

                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                  {article.title}
                </h1>

                {article.subtitle && (
                  <p className="text-lg sm:text-xl text-muted-foreground">
                    {article.subtitle}
                  </p>
                )}

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

                <ShareButtons 
                  url={canonicalUrl}
                  title={article.title}
                  subtitle={article.subtitle || ""}
                  slug={article.slug}
                />
              </div>

              {/* Right: Hero Image */}
              {hasHeroImage && (
                <div className="w-full md:w-[45%] lg:w-1/2 overflow-hidden rounded-lg shrink-0 order-first md:order-last">
                  <img
                    src={optimizeImageUrl(article.hero_image_url, { width: 960, quality: 85 })}
                    alt={article.title}
                    className="w-full h-full max-h-[260px] md:max-h-none object-cover object-center"
                  />
                </div>
              )}
            </div>

            <Separator className="mt-8" />
          </section>

          {/* Body Section with Sidebar */}
          <section className="container py-8 sm:py-12">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_380px] gap-8">
              {/* Left: Article Body */}
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

              {/* Right: Sidebar */}
              <aside className="space-y-6">
                <div className="sticky top-24 space-y-6">
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
                  <UpcomingEventCard />
                  <OctgMarketingPromo />
                </div>
              </aside>
            </div>
          </section>

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
