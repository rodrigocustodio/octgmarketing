import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { optimizeImageUrl } from "@/lib/utils";

interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  publish_date: string | null;
  hero_image_url: string | null;
  body?: string | null;
  region?: { name: string; slug: string } | null;
}

interface AnalysisReportsSectionProps {
  articles: Article[];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch {
    return "";
  }
}

export function AnalysisReportsSection({ articles }: AnalysisReportsSectionProps) {
  if (!articles || articles.length === 0) return null;

  const featuredArticle = articles[0];
  const sideArticles = articles.slice(1, 3);
  const bottomArticles = articles.slice(3, 7);

  const placeholderImages = [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80",
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
  ];

  return (
    <section className="bg-muted/30 py-12 sm:py-16">
      <div className="container">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-accent" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Analysis & Reports
            </h2>
          </div>
          <Link 
            to="/topic/analysis" 
            className="text-sm font-medium text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Main Grid - Featured + Side Articles */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Featured Article - Left (3 columns) */}
          <div className="lg:col-span-3">
            <Link to={`/article/${featuredArticle.slug}`} className="block group h-full">
              <Card className="h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="relative h-full min-h-[400px] lg:min-h-[480px]">
                  <img 
                    src={optimizeImageUrl(featuredArticle.hero_image_url, { width: 1200, quality: 82 }) || placeholderImages[0]}
                    alt={featuredArticle.title}
                    width={800}
                    height={480}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                    {featuredArticle.region && (
                      <Badge className="bg-accent text-accent-foreground mb-4 uppercase tracking-wider text-xs">
                        {featuredArticle.region.name}
                      </Badge>
                    )}
                    <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-3 text-white line-clamp-3">
                      {featuredArticle.title}
                    </h3>
                    {featuredArticle.subtitle && (
                      <p className="text-white/80 line-clamp-2 mb-4 text-sm sm:text-base">
                        {featuredArticle.subtitle}
                      </p>
                    )}
                    <span className="text-sm text-white/70">
                      {formatDate(featuredArticle.publish_date)}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Side Articles - Right (2 columns) - Horizontal Image Cards */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {sideArticles.map((article, index) => (
              <Link 
                key={article.id} 
                to={`/article/${article.slug}`} 
                className="block group flex-1"
              >
                <Card className="h-full border-0 bg-card shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0 flex gap-0 h-full">
                    {/* Thumbnail */}
                    <div className="relative w-32 sm:w-40 flex-shrink-0 overflow-hidden">
                      <img 
                        src={optimizeImageUrl(article.hero_image_url, { width: 200, quality: 80 }) || placeholderImages[(index + 1) % placeholderImages.length]}
                        alt={article.title}
                        width={160}
                        height={120}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 p-4 flex flex-col justify-center">
                      {article.region && (
                        <Badge variant="outline" className="w-fit mb-2 uppercase tracking-wider text-[10px] border-accent/50 text-accent">
                          {article.region.name}
                        </Badge>
                      )}
                      <h4 className="font-semibold text-sm sm:text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(article.publish_date)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Row - 4 Compact Cards */}
        {bottomArticles.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {bottomArticles.map((article, index) => (
              <Link 
                key={article.id} 
                to={`/article/${article.slug}`} 
                className="block group"
              >
                <Card className="border-0 bg-card shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
                  <CardContent className="p-3 sm:p-4 flex gap-3">
                    {/* Small Thumbnail */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <img 
                        src={optimizeImageUrl(article.hero_image_url, { width: 200, quality: 80 }) || placeholderImages[(index + 3) % placeholderImages.length]}
                        alt={article.title}
                        width={80}
                        height={80}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-semibold text-xs sm:text-sm leading-snug mb-1.5 line-clamp-2">
                        {article.title}
                      </h4>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {formatDate(article.publish_date)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
