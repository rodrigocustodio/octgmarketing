import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Factory, TrendingUp, MapPin } from "lucide-react";
import { format } from "date-fns";
import heroImage from "@/assets/hero-octg.jpg";
import { useArticlesByTopic } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

const topicConfig: { slug: string; name: string; icon: LucideIcon }[] = [
  { slug: "mills-manufacturing", name: "Mills & Manufacturing", icon: Factory },
  { slug: "pricing-market", name: "Pricing & Market", icon: TrendingUp },
  { slug: "projects-contracts", name: "Projects & Contracts", icon: MapPin },
];

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch {
    return "";
  }
}

function TopicRowSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}

interface TopicRowProps {
  slug: string;
  name: string;
  icon: LucideIcon;
}

function TopicRow({ slug, name, icon: Icon }: TopicRowProps) {
  const { data: articles, isLoading } = useArticlesByTopic(slug, 2);

  if (isLoading) return <TopicRowSkeleton />;
  if (!articles || articles.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-display text-lg font-bold tracking-tight">{name}</h3>
        </div>
        <Link to={`/topic/${slug}`}>
          <Button variant="ghost" size="sm" className="text-xs">
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {articles.map((article) => (
          <Link key={article.id} to={`/article/${article.slug}`}>
            <Card variant="interactive" className="h-full overflow-hidden group">
              <div className="aspect-[16/9] relative overflow-hidden">
                <img 
                  src={article.hero_image_url || heroImage} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {article.region && (
                    <Badge variant="region" className="mb-2 text-xs">{article.region.name}</Badge>
                  )}
                  <h4 className="font-display font-bold text-sm line-clamp-2 group-hover:text-accent transition-colors">
                    {article.title}
                  </h4>
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    {formatDate(article.publish_date)}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TopicRows() {
  return (
    <section className="container py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-2xl font-bold tracking-tight">By Topic</h2>
        <Link to="/topics">
          <Button variant="ghost" size="sm">All Topics <ArrowRight className="ml-1 h-4 w-4" /></Button>
        </Link>
      </div>

      <div className="space-y-10">
        {topicConfig.map((topic) => (
          <TopicRow key={topic.slug} {...topic} />
        ))}
      </div>
    </section>
  );
}
