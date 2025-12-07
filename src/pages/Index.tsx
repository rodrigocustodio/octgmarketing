import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, TrendingUp, Factory, Anchor, Flame, Globe, FileText } from "lucide-react";
import { useState } from "react";
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

const trendingArticles = {
  featured: {
    title: "Asian Steel Mills Announce Q1 2025 Production Targets",
    subtitle: "Major producers in China and Japan outline aggressive expansion plans amid rising global demand",
    imageUrl: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800",
    region: "Asia-Pacific",
    topic: "Production",
    date: "December 6, 2024",
    slug: "asian-steel-mills-q1-2025",
  },
  list: [
    {
      title: "Spot Prices Rally on Tight Supply Conditions",
      topic: "Pricing",
      date: "December 5, 2024",
      slug: "spot-prices-rally",
    },
    {
      title: "U.S. Distributors Report Record Inventory Turnover",
      topic: "Supply Chain",
      date: "December 4, 2024",
      slug: "us-distributors-inventory",
    },
    {
      title: "Premium Connections Demand Outpaces Standard Grade",
      topic: "Market Trends",
      date: "December 3, 2024",
      slug: "premium-connections-demand",
    },
  ],
};

const regionalArticles = {
  "Americas": [
    {
      title: "Permian Basin Operators Signal Record OCTG Orders",
      subtitle: "Leading E&P companies prepare for intensified drilling campaigns in 2025",
      imageUrl: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800",
      topic: "Drilling",
      date: "December 5, 2024",
      slug: "permian-basin-octg-orders",
    },
    {
      title: "Canadian Pipeline Projects Boost Linepipe Demand",
      subtitle: "Trans Mountain expansion drives new orders from domestic mills",
      imageUrl: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800",
      topic: "Infrastructure",
      date: "December 3, 2024",
      slug: "canadian-pipeline-linepipe",
    },
  ],
  "Europe": [
    {
      title: "Norwegian Offshore Projects Drive Premium Pipe Demand",
      subtitle: "North Sea developments require specialized corrosion-resistant tubulars",
      imageUrl: "https://images.unsplash.com/photo-1544724107-6d5c4caaff30?w=800",
      topic: "Offshore",
      date: "December 4, 2024",
      slug: "norwegian-offshore-premium",
    },
    {
      title: "European Mills Invest in Green Steel Technology",
      subtitle: "Sustainability initiatives reshape continental production landscape",
      imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800",
      topic: "Sustainability",
      date: "December 2, 2024",
      slug: "european-green-steel",
    },
  ],
  "Middle East": [
    {
      title: "UAE Expands Downstream Integration Strategy",
      subtitle: "ADNOC accelerates plans for domestic pipe manufacturing capacity",
      imageUrl: "https://images.unsplash.com/photo-1518623001395-125242310d0c?w=800",
      topic: "Manufacturing",
      date: "December 5, 2024",
      slug: "uae-downstream-integration",
    },
    {
      title: "Saudi Vision 2030 Fuels Energy Sector Investment",
      subtitle: "Kingdom targets increased domestic content in OCTG procurement",
      imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800",
      topic: "Policy",
      date: "December 1, 2024",
      slug: "saudi-vision-2030-octg",
    },
  ],
  "Asia-Pacific": [
    {
      title: "Australian LNG Projects Resume OCTG Procurement",
      subtitle: "Major operators restart purchasing after extended delays",
      imageUrl: "https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800",
      topic: "LNG",
      date: "December 4, 2024",
      slug: "australian-lng-octg",
    },
    {
      title: "Southeast Asian Offshore Exploration Accelerates",
      subtitle: "Vietnam and Indonesia lead regional drilling activity growth",
      imageUrl: "https://images.unsplash.com/photo-1516937941344-00b4e0337589?w=800",
      topic: "Exploration",
      date: "December 2, 2024",
      slug: "southeast-asia-offshore",
    },
  ],
};

const analysisArticles = {
  featured: {
    title: "2024 OCTG Market Annual Review",
    subtitle: "Comprehensive analysis of global tubular market dynamics, pricing trends, and regional developments shaping the industry",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
    topic: "Annual Report",
    date: "December 1, 2024",
    slug: "2024-octg-annual-review",
  },
  grid: [
    {
      title: "Q4 Pricing Outlook: Americas Focus",
      excerpt: "Regional pricing analysis covering seamless and ERW products across North and South American markets.",
      topic: "Price Analysis",
      date: "November 28, 2024",
      slug: "q4-pricing-americas",
    },
    {
      title: "Seamless vs. ERW Market Share Trends",
      excerpt: "Comparative study examining shifting market dynamics between seamless and welded pipe segments.",
      topic: "Market Research",
      date: "November 25, 2024",
      slug: "seamless-erw-trends",
    },
    {
      title: "Trade Policy Impact Assessment",
      excerpt: "Analysis of recent tariff adjustments and their projected effects on global OCTG trade flows.",
      topic: "Regulatory Analysis",
      date: "November 20, 2024",
      slug: "trade-policy-impact",
    },
    {
      title: "Rig Count Correlation Study",
      excerpt: "Statistical analysis linking rig activity trends to OCTG demand patterns across key basins.",
      topic: "Data Analysis",
      date: "November 15, 2024",
      slug: "rig-count-correlation",
    },
  ],
};

const topics = [
  { name: "Mills & Manufacturing", slug: "mills-manufacturing", icon: Factory },
  { name: "Yards & Supply Chain", slug: "yards-supply-chain", icon: Anchor },
  { name: "Pricing & Market", slug: "pricing-market", icon: TrendingUp },
  { name: "Projects & Contracts", slug: "projects-contracts", icon: MapPin },
];

const regions = ["Americas", "Europe", "Middle East", "Asia-Pacific"] as const;

const Index = () => {
  const [activeRegion, setActiveRegion] = useState<typeof regions[number]>("Americas");

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
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
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

        {/* SECTION 1: Trending This Week */}
        <section className="container py-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-accent/10">
              <Flame className="h-5 w-5 text-accent" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Trending This Week</h2>
          </div>
          
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Featured Large Card */}
            <div className="lg:col-span-3">
              <Link to={`/article/${trendingArticles.featured.slug}`}>
                <Card variant="article" className="h-full overflow-hidden group">
                  <div className="relative h-64 lg:h-full min-h-[300px]">
                    <img 
                      src={trendingArticles.featured.imageUrl} 
                      alt={trendingArticles.featured.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex gap-2 mb-3">
                        <Badge variant="region">{trendingArticles.featured.region}</Badge>
                        <Badge variant="topic">{trendingArticles.featured.topic}</Badge>
                      </div>
                      <h3 className="font-display text-xl lg:text-2xl font-bold mb-2 group-hover:text-accent transition-colors">
                        {trendingArticles.featured.title}
                      </h3>
                      <p className="text-muted-foreground line-clamp-2">
                        {trendingArticles.featured.subtitle}
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-3">{trendingArticles.featured.date}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>

            {/* Stacked List */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {trendingArticles.list.map((article, index) => (
                <Link key={article.slug} to={`/article/${article.slug}`}>
                  <Card variant="interactive" className="p-4 h-full">
                    <CardContent className="p-0">
                      <Badge variant="topic" className="mb-2 text-xs">{article.topic}</Badge>
                      <h4 className="font-display font-semibold mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                        {article.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">{article.date}</p>
                    </CardContent>
                    {index < trendingArticles.list.length - 1 && (
                      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="container">
          <div className="octg-divider" />
        </div>

        {/* Topics Grid */}
        <section className="container py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-bold tracking-tight">Browse by Topic</h2>
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
                    <span className="font-display text-base font-semibold tracking-tight">{topic.name}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <div className="container">
          <div className="octg-divider" />
        </div>

        {/* SECTION 2: Regional Spotlight */}
        <section className="container py-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Regional Spotlight</h2>
          </div>

          {/* Region Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {regions.map((region) => (
              <Button
                key={region}
                variant={activeRegion === region ? "steel" : "outline"}
                size="sm"
                onClick={() => setActiveRegion(region)}
                className="transition-all duration-200"
              >
                {region}
              </Button>
            ))}
          </div>

          {/* Regional Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {regionalArticles[activeRegion].map((article, index) => (
              <Link key={article.slug} to={`/article/${article.slug}`}>
                <Card 
                  variant="interactive" 
                  className="overflow-hidden group h-full animate-fade-in"
                >
                  <div className="flex flex-col sm:flex-row h-full">
                    <div className="sm:w-2/5 h-48 sm:h-auto relative overflow-hidden">
                      <img 
                        src={article.imageUrl} 
                        alt={article.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="sm:w-3/5 p-5 flex flex-col justify-center">
                      <Badge variant="topic" className="w-fit mb-3">{article.topic}</Badge>
                      <h3 className="font-display text-lg font-bold mb-2 group-hover:text-accent transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {article.subtitle}
                      </p>
                      <p className="text-xs text-muted-foreground/70">{article.date}</p>
                    </div>
                  </div>
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
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-4">
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
                  <p className="font-display text-2xl font-bold text-accent">150+</p>
                  <p className="text-sm text-muted-foreground">Mills Tracked</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="font-display text-2xl font-bold text-primary">500+</p>
                  <p className="text-sm text-muted-foreground">Pipe Yards</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="font-display text-2xl font-bold text-accent">2,000+</p>
                  <p className="text-sm text-muted-foreground">Active Rigs</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="font-display text-2xl font-bold text-primary">75+</p>
                  <p className="text-sm text-muted-foreground">Port Terminals</p>
                </Card>
              </div>
            </div>
          </Card>
        </section>

        <div className="container">
          <div className="octg-divider" />
        </div>

        {/* SECTION 3: Analysis & Reports */}
        <section className="container py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight">Analysis & Reports</h2>
            </div>
            <Link to="/reports">
              <Button variant="ghost">View All Reports <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Featured Report - Tall Card */}
            <div className="lg:row-span-2">
              <Link to={`/article/${analysisArticles.featured.slug}`}>
                <Card variant="article" className="h-full overflow-hidden group min-h-[400px]">
                  <div className="relative h-full">
                    <img 
                      src={analysisArticles.featured.imageUrl} 
                      alt={analysisArticles.featured.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <Badge variant="featured" className="mb-3">{analysisArticles.featured.topic}</Badge>
                      <h3 className="font-display text-xl lg:text-2xl font-bold mb-3 group-hover:text-accent transition-colors">
                        {analysisArticles.featured.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
                        {analysisArticles.featured.subtitle}
                      </p>
                      <p className="text-xs text-muted-foreground/70">{analysisArticles.featured.date}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>

            {/* Grid of 4 smaller reports */}
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
              {analysisArticles.grid.map((article) => (
                <Link key={article.slug} to={`/article/${article.slug}`}>
                  <Card variant="interactive" className="p-5 h-full group">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="text-xs">{article.topic}</Badge>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <h4 className="font-display font-semibold group-hover:text-accent transition-colors">
                        {article.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {article.excerpt}
                      </p>
                      <p className="text-sm text-muted-foreground mt-auto pt-3">{article.date}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
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
