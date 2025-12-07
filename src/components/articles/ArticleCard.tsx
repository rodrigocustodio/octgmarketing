import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ArticleCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  region?: string;
  topic?: string;
  date?: string;
  slug: string;
  featured?: boolean;
}

export function ArticleCard({ title, subtitle, imageUrl, region, topic, date, slug, featured }: ArticleCardProps) {
  return (
    <Link to={`/article/${slug}`}>
      <Card variant={featured ? "featured" : "article"} className="overflow-hidden h-full">
        {imageUrl && (
          <div className="aspect-video overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        )}
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {region && <Badge variant="region">{region}</Badge>}
            {topic && <Badge variant="topic">{topic}</Badge>}
          </div>
          <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight mb-2 line-clamp-2">{title}</h3>
          {subtitle && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{subtitle}</p>
          )}
          {date && (
            <p className="text-xs text-muted-foreground">{date}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
