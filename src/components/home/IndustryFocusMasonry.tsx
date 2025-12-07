import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Factory, ArrowRight } from "lucide-react";
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
    return format(new Date(dateString), "MMMM d, yyyy");
  } catch {
    return "";
  }
}

export function IndustryFocusMasonry({ articles }: IndustryFocusMasonryProps) {
  if (articles.length === 0) return null;

  const featured = articles[0];
  const mediumCards = articles.slice(1, 3);
  const compactCards = articles.slice(3, 5);

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

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Large Featured Card - Takes 3 columns, spans 2 rows */}
        <div className="lg:col-span-3 lg:row-span-2">
          <Link to={`/article/${featured.slug}`} className="block h-full">
            <Card variant="article" className="h-full overflow-hidden group min-h-[400px]">
              <div className="relative h-full">
                <img 
                  src={featured.hero_image_url || heroImage} 
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex gap-2 mb-3">
                    {featured.region && (
                      <Badge variant="region">{featured.region.name}</Badge>
                    )}
                  </div>
                  <h3 className="font-display text-xl lg:text-2xl font-bold mb-2 group-hover:text-accent transition-colors">
                    {featured.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-2 mb-2">
                    {featured.subtitle}
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    {formatDate(featured.publish_date)}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Medium Cards - 2 columns, stacked */}
        {mediumCards.map((article) => (
          <div key={article.id} className="lg:col-span-2">
            <Link to={`/article/${article.slug}`} className="block h-full">
              <Card variant="interactive" className="h-full overflow-hidden group">
                <div className="flex h-full">
                  <div className="w-1/3 relative overflow-hidden">
                    <img 
                      src={article.hero_image_url || heroImage} 
                      alt={article.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="w-2/3 p-4 flex flex-col justify-center">
                    {article.region && (
                      <Badge variant="topic" className="w-fit mb-2 text-xs">{article.region.name}</Badge>
                    )}
                    <h4 className="font-display font-semibold text-sm mb-1 line-clamp-2 group-hover:text-accent transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(article.publish_date)}
                    </p>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </div>
        ))}

        {/* Compact Cards - 2 cards in 3 columns */}
        {compactCards.map((article) => (
          <div key={article.id} className="lg:col-span-3 sm:col-span-1">
            <Link to={`/article/${article.slug}`} className="block h-full">
              <Card variant="interactive" className="h-full p-3">
                <CardContent className="p-0 flex gap-3">
                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                    <img 
                      src={article.hero_image_url || heroImage} 
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h4 className="font-display text-sm font-semibold line-clamp-2 group-hover:text-accent transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(article.publish_date)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
