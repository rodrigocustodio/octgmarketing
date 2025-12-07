import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, TrendingUp, Factory, Anchor } from "lucide-react";
import heroImage from "@/assets/hero-octg.jpg";

const featuredArticle = {
  title: "Global OCTG Demand Surges as Energy Sector Rebounds",
  subtitle: "Market analysts predict sustained growth through 2025 as drilling activity intensifies across major basins",
  imageUrl: heroImage,
  region: "Global",
  topic: "Market Analysis",
  date: "December 7, 2024",
  slug: "global-octg-demand-surges-2024",
};

const secondaryArticles = [
  {
    title: "Tenaris Expands U.S. Manufacturing Capacity",
    subtitle: "New seamless pipe mill to serve Permian Basin operators",
    imageUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800",
    region: "Americas",
    topic: "Mills",
    date: "December 6, 2024",
    slug: "tenaris-us-expansion",
  },
  {
    title: "Middle East Rig Count Reaches Five-Year High",
    subtitle: "Saudi Aramco leads regional drilling surge",
    imageUrl: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800",
    region: "Middle East",
    topic: "Rigs",
    date: "December 5, 2024",
    slug: "middle-east-rig-count",
  },
  {
    title: "EU Carbon Regulations Impact Steel Pricing",
    subtitle: "OCTG manufacturers adjust strategies amid new environmental policies",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    region: "Europe",
    topic: "Regulations",
    date: "December 4, 2024",
    slug: "eu-carbon-regulations",
  },
];

const topics = [
  { name: "Mills & Manufacturing", slug: "mills-manufacturing", icon: Factory },
  { name: "Yards & Supply Chain", slug: "yards-supply-chain", icon: Anchor },
  { name: "Pricing & Market", slug: "pricing-market", icon: TrendingUp },
  { name: "Projects & Contracts", slug: "projects-contracts", icon: MapPin },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center right',
            }}
          />
          <div className="container relative z-20 py-16 sm:py-24">
            <div className="max-w-4xl animate-fade-in-up">
              <Badge variant="featured" className="mb-4">Featured Story</Badge>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-wider mb-4">
                {featuredArticle.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-6 max-w-2xl">
                {featuredArticle.subtitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to={`/article/${featuredArticle.slug}`}>
                  <Button variant="hero">
                    Read Full Story <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/map">
                  <Button variant="hero-outline">
                    Explore Asset Map
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Secondary Articles */}
        <section className="container py-12">
          <div className="grid md:grid-cols-3 gap-6">
            {secondaryArticles.map((article, index) => (
              <div key={article.slug} className={`animate-fade-in-up animation-delay-${(index + 1) * 100}`}>
                <ArticleCard {...article} />
              </div>
            ))}
          </div>
        </section>

        <div className="container">
          <div className="octg-divider" />
        </div>

        {/* Topics Grid */}
        <section className="container py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl tracking-wider">Browse by Topic</h2>
            <Link to="/topics">
              <Button variant="ghost">View All <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topics.map((topic) => (
              <Link key={topic.slug} to={`/topic/${topic.slug}`}>
                <Card variant="interactive" className="p-6">
                  <CardContent className="p-0 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-accent/10">
                      <topic.icon className="h-6 w-6 text-accent" />
                    </div>
                    <span className="font-display text-lg tracking-wide">{topic.name}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Data & Indices Teaser */}
        <section className="container py-12">
          <Card variant="elevated" className="p-8 sm:p-12 octg-texture">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Badge variant="asset" className="mb-4">Data & Analytics</Badge>
                <h2 className="font-display text-3xl sm:text-4xl tracking-wider mb-4">
                  Interactive Asset Map
                </h2>
                <p className="text-muted-foreground mb-6">
                  Explore global OCTG infrastructure including mills, pipe yards, rigs, and port facilities. 
                  Filter by region, asset type, and operator.
                </p>
                <Link to="/map">
                  <Button variant="steel">
                    <MapPin className="mr-2 h-4 w-4" /> Explore the Map
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 text-center">
                  <p className="font-display text-3xl text-accent">150+</p>
                  <p className="text-sm text-muted-foreground">Mills Tracked</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="font-display text-3xl text-primary">500+</p>
                  <p className="text-sm text-muted-foreground">Pipe Yards</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="font-display text-3xl text-accent">2,000+</p>
                  <p className="text-sm text-muted-foreground">Active Rigs</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="font-display text-3xl text-primary">75+</p>
                  <p className="text-sm text-muted-foreground">Port Terminals</p>
                </Card>
              </div>
            </div>
          </Card>
        </section>

        {/* Newsletter */}
        <section className="container py-12">
          <NewsletterSignup />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
