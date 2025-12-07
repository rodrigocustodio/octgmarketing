import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";

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

function estimateReadingTime(body: string | null, title: string): number {
  const wordsPerMinute = 200;
  const text = body || title;
  const wordCount = text.split(/\s+/).length;
  return Math.max(3, Math.ceil(wordCount / wordsPerMinute));
}

export function AnalysisReportsSection({ articles }: AnalysisReportsSectionProps) {
  if (!articles || articles.length === 0) return null;

  const featuredArticle = articles[0];
  const sideArticles = articles.slice(1, 3);
  const bottomArticles = articles.slice(3, 6);

  const placeholderImages = [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80",
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&q=80",
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

        {/* Main Grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Featured Article - Left (3 columns) */}
          <div className="lg:col-span-3">
            <Link to={`/article/${featuredArticle.slug}`} className="block group h-full">
              <Card className="h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="relative h-full min-h-[400px] lg:min-h-[480px]">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${featuredArticle.hero_image_url || placeholderImages[0]})`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                    <Badge className="bg-accent text-accent-foreground mb-4">
                      Featured Analysis
                    </Badge>
                    <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-3 group-hover:text-accent transition-colors line-clamp-3">
                      {featuredArticle.title}
                    </h3>
                    {featuredArticle.subtitle && (
                      <p className="text-muted-foreground line-clamp-2 mb-4 text-sm sm:text-base">
                        {featuredArticle.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {estimateReadingTime(featuredArticle.body || null, featuredArticle.title)} min read
                      </span>
                      {featuredArticle.region && (
                        <span>{featuredArticle.region.name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Side Articles - Right (2 columns) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {sideArticles.map((article, index) => (
              <Link 
                key={article.id} 
                to={`/article/${article.slug}`} 
                className="block group flex-1"
              >
                <Card className="h-full border-0 bg-card shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardContent className="p-5 flex gap-4 h-full">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-accent">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                      {article.subtitle && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {article.subtitle}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {estimateReadingTime(article.body || null, article.title)} min read
                        </span>
                        <span>{formatDate(article.publish_date)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Row - 3 Compact Cards */}
        {bottomArticles.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {bottomArticles.map((article, index) => (
              <Link 
                key={article.id} 
                to={`/article/${article.slug}`} 
                className="block group"
              >
                <Card className="border-0 bg-card shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardContent className="p-4 flex gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <img 
                        src={article.hero_image_url || placeholderImages[(index + 3) % placeholderImages.length]}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-accent/90 flex items-center justify-center">
                        <span className="text-xs font-bold text-accent-foreground">
                          {String(index + 3).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-semibold text-sm leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {estimateReadingTime(article.body || null, article.title)} min read
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
