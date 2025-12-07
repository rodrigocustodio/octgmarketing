import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RelatedArticle {
  title: string;
  region: string;
  date: string;
  slug: string;
}

interface RelatedArticlesProps {
  articles: RelatedArticle[];
  currentRegion?: string;
}

const RelatedArticles = ({ articles, currentRegion }: RelatedArticlesProps) => {
  return (
    <Card variant="elevated">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {currentRegion ? `More from ${currentRegion}` : "Related Articles"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {articles.map((article, index) => (
          <Link 
            key={index} 
            to={`/article/${article.slug}`}
            className="block group"
          >
            <div className="space-y-1">
              <h4 className="font-medium text-sm leading-snug group-hover:text-accent transition-colors line-clamp-2">
                {article.title}
              </h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {article.region}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {article.date}
                </span>
              </div>
            </div>
            {index < articles.length - 1 && (
              <div className="border-b border-border/50 mt-4" />
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

export default RelatedArticles;
