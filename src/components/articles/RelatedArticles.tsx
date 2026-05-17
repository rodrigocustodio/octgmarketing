import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold text-accent uppercase tracking-wider flex items-center gap-2">
          <span className="w-8 h-0.5 bg-accent rounded-full" />
          {currentRegion ? `More from ${currentRegion}` : "Related Articles"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {articles.map((article, index) => (
          <Link 
            key={index} 
            to={`/article/${article.slug}`}
            className="block group"
          >
            <div className="flex gap-4">
              {/* Number indicator */}
              <span className="text-2xl font-bold text-muted-foreground/70 leading-none pt-0.5">
                {String(index + 1).padStart(2, '0')}
              </span>
              
              {/* Content */}
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-base leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2">
                  {article.title}
                </h4>
                <span className="text-sm text-muted-foreground">
                  {article.date}
                </span>
              </div>
            </div>
            {index < articles.length - 1 && (
              <div className="border-b border-border/30 mt-5 ml-12" />
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

export default RelatedArticles;
