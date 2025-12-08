import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Factory, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import heroImage from "@/assets/hero-octg.jpg";

interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  publish_date: string | null;
  hero_image_url: string | null;
  region?: { name: string; slug: string } | null;
}

interface IndustryFocusMasonryProps {
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

function getReadingTime(title: string): string {
  // Estimate reading time based on typical article length
  const baseMinutes = 4 + Math.floor(title.length / 30);
  return `${Math.min(baseMinutes, 8)} min read`;
}

export function IndustryFocusMasonry({ articles }: IndustryFocusMasonryProps) {
  if (articles.length === 0) return null;

  const featured = articles[0];
  const numberedArticles = articles.slice(1, 5);

  return (
    <section className="container py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Factory className="h-5 w-5 text-accent" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Industry Focus</h2>
        </div>
        <Link to="/topic/mills-manufacturing">
          <Button variant="ghost" size="sm">View All <ArrowRight className="ml-1 h-4 w-4" /></Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Featured Article - Left 60% (3 columns) */}
        <div className="lg:col-span-3">
          <Link to={`/article/${featured.slug}`} className="block group">
            <Card variant="article" className="overflow-hidden">
              <div className="relative aspect-[16/10]">
                <img 
                  src={featured.hero_image_url || heroImage} 
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-accent text-accent-foreground font-semibold text-xs uppercase tracking-wider">
                    Featured Analysis
                  </Badge>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-display text-xl lg:text-2xl font-bold group-hover:text-accent transition-colors line-clamp-2">
                    {featured.title}
                  </h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {getReadingTime(featured.title)}
                  </span>
                  {featured.region && (
                    <>
                      <span>•</span>
                      <Badge variant="region" className="text-xs">{featured.region.name}</Badge>
                    </>
                  )}
                </div>
                {featured.subtitle && (
                  <p className="text-muted-foreground line-clamp-3">
                    {featured.subtitle}
                  </p>
                )}
              </div>
            </Card>
          </Link>
        </div>

        {/* Numbered Article List - Right 40% (2 columns) */}
        <div className="lg:col-span-2 flex flex-col">
          {numberedArticles.map((article, index) => (
            <Link 
              key={article.id} 
              to={`/article/${article.slug}`} 
              className="group flex gap-4 py-5 first:pt-0 last:pb-0 border-b border-border/50 last:border-0"
            >
              <span className="text-4xl font-light text-muted-foreground/30 leading-none w-10 flex-shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0 space-y-2">
                <h4 className="font-display font-semibold text-base group-hover:text-accent transition-colors line-clamp-2">
                  {article.title}
                </h4>
                {article.subtitle && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.subtitle}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getReadingTime(article.title)}
                  </span>
                  <span>•</span>
                  <span>{formatDate(article.publish_date)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
