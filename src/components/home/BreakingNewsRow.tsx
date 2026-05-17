import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { format } from "date-fns";
import { optimizeImageUrl } from "@/lib/utils";

interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  publish_date: string | null;
  hero_image_url: string | null;
  region?: { name: string; slug: string } | null;
}

interface BreakingNewsRowProps {
  articles: Article[];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "MMM d");
  } catch {
    return "";
  }
}

export function BreakingNewsRow({ articles }: BreakingNewsRowProps) {
  if (articles.length === 0) return null;

  return (
    <section className="container py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 rounded-md bg-destructive/10">
          <Zap className="h-4 w-4 text-destructive" />
        </div>
        <h2 className="font-display text-lg font-bold tracking-tight uppercase">Breaking News</h2>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.slice(0, 3).map((article) => (
          <div key={article.id} className="flex flex-col">
            <Link to={`/article/${article.slug}`}>
              <Card variant="interactive" className="h-full">
                <CardContent className="p-0 flex gap-3 h-full">
                  {article.hero_image_url && (
                    <div className="w-24 h-20 flex-shrink-0 overflow-hidden rounded-l-lg">
                      <img 
                        src={optimizeImageUrl(article.hero_image_url, { width: 200, quality: 80 })} 
                        alt={article.title}
                        width={96}
                        height={80}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="py-2 pr-3 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {article.region && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{article.region.name}</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">{formatDate(article.publish_date)}</span>
                    </div>
                    <h3 className="font-display text-sm font-semibold line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </Link>
            {article.subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2 px-1">
                {article.subtitle}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
