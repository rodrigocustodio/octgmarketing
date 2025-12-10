import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  publish_date: string | null;
  hero_image_url: string | null;
  region?: { name: string; slug: string } | null;
}

interface QuickReadsGridProps {
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

export function QuickReadsGrid({ articles }: QuickReadsGridProps) {
  if (articles.length === 0) return null;

  return (
    <section className="container py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Newspaper className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Quick Reads</h2>
        </div>
        <Link to="/articles">
          <Button variant="ghost" size="sm">All Articles <ArrowRight className="ml-1 h-4 w-4" /></Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.slice(0, 4).map((article) => (
          <Link key={article.id} to={`/article/${article.slug}`}>
            <Card variant="interactive" className="h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  {article.region && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                      {article.region.name}
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatDate(article.publish_date)}
                  </span>
                </div>
                <h3 className="font-display text-sm font-bold line-clamp-3 group-hover:text-primary transition-colors mb-2">
                  {article.title}
                </h3>
                {article.subtitle && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {article.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
