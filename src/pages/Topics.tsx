import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useTopics } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { Factory, Anchor, TrendingUp, FileText, Users, Building2, Shield, Ship, Drill, Cpu } from "lucide-react";

const topicIcons: Record<string, React.ElementType> = {
  "mills-manufacturing": Factory,
  "yards-supply-chain": Anchor,
  "pricing-market": TrendingUp,
  "projects-contracts": FileText,
  "careers-people": Users,
  "companies-strategy": Building2,
  "hse-regulations": Shield,
  "ports-terminals": Ship,
  "rigs-wellsite": Drill,
  "technology-digitalization": Cpu,
};

const topicDescriptions: Record<string, string> = {
  "mills-manufacturing": "Steel mills, pipe manufacturing, and production capacity updates across the OCTG industry.",
  "yards-supply-chain": "Pipe yards, inventory management, and supply chain logistics in the tubular goods sector.",
  "pricing-market": "Market pricing trends, steel costs, and economic analysis for OCTG products.",
  "projects-contracts": "Major drilling projects, contract awards, and infrastructure developments.",
  "careers-people": "Industry leadership changes, career opportunities, and workforce developments.",
  "companies-strategy": "Corporate strategy, mergers, acquisitions, and business developments.",
  "hse-regulations": "Health, safety, environmental standards, and regulatory compliance.",
  "ports-terminals": "Port facilities, terminal operations, and maritime logistics.",
  "rigs-wellsite": "Drilling rigs, wellsite operations, and field developments.",
  "technology-digitalization": "Digital transformation, technology innovation, and automation in OCTG.",
};

export default function Topics() {
  const { data: topics, isLoading } = useTopics();

  return (
    <>
      <SEOHead
        title="All Topics"
        description="Browse all OCTG Index topics covering mills, manufacturing, pricing, projects, supply chain, technology, and more in the oil country tubular goods industry."
        canonical="/topics"
      />
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container py-12">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold tracking-tight mb-4">
              All Topics
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Explore OCTG industry news and analysis organized by topic. From steel mills and manufacturing to market pricing and drilling projects.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topics?.map((topic) => {
                const IconComponent = topicIcons[topic.slug] || FileText;
                const description = topicDescriptions[topic.slug] || "Latest news and updates.";
                
                return (
                  <Link
                    key={topic.id}
                    to={`/topic/${topic.slug}`}
                    className="group block p-6 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h2 className="font-display text-lg font-semibold tracking-tight mb-2 group-hover:text-accent transition-colors">
                          {topic.name}
                        </h2>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Internal links for SEO */}
          <div className="mt-16 pt-8 border-t border-border">
            <h2 className="font-display text-xl font-semibold mb-4">Explore More</h2>
            <div className="flex flex-wrap gap-4">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Latest News
              </Link>
              <Link to="/directory" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Company Directory
              </Link>
              <Link to="/ceo-directory" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                CEO Directory
              </Link>
              <Link to="/region/americas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Americas News
              </Link>
              <Link to="/region/europe" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Europe News
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
