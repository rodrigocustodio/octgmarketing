import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Factory, TrendingUp, MapPin } from "lucide-react";
import { format } from "date-fns";
import heroImage from "@/assets/hero-octg.jpg";
import { LucideIcon } from "lucide-react";
import { ArticleWithTopics } from "@/hooks/useArticles";

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

interface TopicRowProps {
  slug: string;
  name: string;
  icon: LucideIcon;
  articles: ArticleWithTopics[];
}

function TopicRow({ slug, name, icon: Icon, articles }: TopicRowProps) {
  if (articles.length === 0) return null;

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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

interface TopicRowsProps {
  articles: ArticleWithTopics[];
  usedIds: Set<string>;
}

export function TopicRows({ articles, usedIds }: TopicRowsProps) {
  // For each topic, find articles that have this topic and haven't been used yet
  const getArticlesForTopic = (topicSlug: string, count: number): ArticleWithTopics[] => {
    const result: ArticleWithTopics[] = [];
    
    for (const article of articles) {
      if (usedIds.has(article.id)) continue;
      
      const hasTopics = article.topics?.some(t => t.slug === topicSlug);
      if (hasTopics) {
        result.push(article);
        usedIds.add(article.id); // Mark as used
        if (result.length >= count) break;
      }
    }
    
    return result;
  };

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
          <TopicRow 
            key={topic.slug} 
            slug={topic.slug}
            name={topic.name}
            icon={topic.icon}
            articles={getArticlesForTopic(topic.slug, 4)}
          />
        ))}
      </div>
    </section>
  );
}
