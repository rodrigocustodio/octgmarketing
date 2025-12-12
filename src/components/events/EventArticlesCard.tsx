import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Newspaper } from "lucide-react";
import { useArticlesByEventId } from "@/hooks/useArticles";
import { format } from "date-fns";

interface EventArticlesCardProps {
  eventId: string;
  eventName: string;
}

export function EventArticlesCard({ eventId, eventName }: EventArticlesCardProps) {
  const { data: articles, isLoading } = useArticlesByEventId(eventId);

  if (isLoading || !articles || articles.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 bg-accent rounded-full" />
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">
            Event Coverage
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
        {articles.map((article, index) => (
          <div key={article.id}>
            {index > 0 && <div className="border-t border-border my-3" />}
            <Link
              to={`/article/${article.slug}`}
              className="group flex items-start gap-3"
            >
              <span className="text-lg font-bold text-muted-foreground/50 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                  {article.title}
                </h4>
                {article.publish_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(article.publish_date), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
