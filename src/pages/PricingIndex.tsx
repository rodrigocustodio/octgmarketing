import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useSteelPrices } from "@/hooks/useSteelPrices";
import { usePublishedArticles } from "@/hooks/useArticles";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TrendingUp, TrendingDown, Minus, Clock, BarChart3, Globe, Newspaper } from "lucide-react";
import { format } from "date-fns";

function PriceChangeIndicator({ change, changePercent }: { change: number; changePercent: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center gap-1 text-green-500">
        <TrendingUp className="h-4 w-4" />
        <span>+{changePercent.toFixed(2)}%</span>
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-1 text-red-500">
        <TrendingDown className="h-4 w-4" />
        <span>{changePercent.toFixed(2)}%</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <Minus className="h-4 w-4" />
      <span>0.00%</span>
    </span>
  );
}

function formatPrice(price: number, currency: string = "USD") {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }
  return `${price.toFixed(2)} ${currency}`;
}

export default function PricingIndex() {
  const { data: prices, isLoading: pricesLoading } = useSteelPrices();
  const { data: articles } = usePublishedArticles(4);

  // Separate commodities from stocks
  const commodities = prices?.filter((p) => p.category === "commodity") || [];
  const stocks = prices?.filter((p) => p.category === "stock") || [];

  // Group stocks by region
  const stocksByRegion = stocks.reduce((acc, stock) => {
    const region = stock.region || "Global";
    if (!acc[region]) acc[region] = [];
    acc[region].push(stock);
    return acc;
  }, {} as Record<string, typeof stocks>);

  const regions = Object.keys(stocksByRegion).sort();

  // Get latest update time
  const latestUpdate = prices?.[0]?.updated_at;

  // Use the latest published articles for market news
  const pricingArticles = articles || [];

  // Schema.org structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://octgindex.com"
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Market Prices",
        item: "https://octgindex.com/pricing-index"
      }
    ]
  };

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Market Prices – Global OCTG Pricing & Benchmarks",
    description: "Live steel commodity prices and OCTG industry stock tracking. Monitor HRC, iron ore, steel scrap, billet prices and major OCTG manufacturers across Americas, Europe, Asia-Pacific, and Middle East.",
    url: "https://octgindex.com/pricing-index",
    publisher: {
      "@type": "Organization",
      name: "OCTG Index",
      url: "https://octgindex.com",
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Steel & OCTG Price Index",
      itemListElement: commodities.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: c.name,
          offers: {
            "@type": "Offer",
            price: c.price,
            priceCurrency: c.currency || "USD",
          },
        },
      })),
    },
  };

  const structuredData = [breadcrumbSchema, schemaData];

  return (
    <>
      <SEOHead
        title="Market Prices – Global OCTG Pricing & Benchmarks | OCTG Index"
        description="Live steel commodity prices and OCTG industry stock tracking. Monitor HRC, iron ore, steel scrap, billet prices and major OCTG manufacturers across Americas, Europe, Asia-Pacific, and Middle East."
        canonical="https://octgindex.com/pricing-index"
        type="website"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-primary/5 via-background to-background py-12 md:py-16">
          <div className="container">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Market Prices</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-8 w-8 text-accent" />
              <Badge variant="secondary" className="text-xs">LIVE DATA</Badge>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Market Prices – Global OCTG Pricing & Benchmarks
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mb-6">
              Track steel commodity prices and OCTG industry stocks in real-time. This section provides daily-updated 
              pricing benchmarks for hot-rolled coil (HRC), iron ore, steel scrap, billet, and cold-rolled coil (CRC)—the 
              essential raw materials for OCTG manufacturing. We also track stock prices of major publicly traded OCTG 
              manufacturers and service providers across Americas, Europe, Asia-Pacific, Australia, and Middle East regions.
            </p>
            {latestUpdate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last updated: {format(new Date(latestUpdate), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
            )}
          </div>
        </section>

        {/* Commodities Section */}
        <section className="container py-10">
          <h2 className="font-display text-2xl font-bold tracking-tight mb-6">
            Steel Commodities
          </h2>

          {pricesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : commodities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {commodities.map((commodity) => (
                <Card key={commodity.id} className="bg-card hover:bg-card/80 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">{commodity.symbol}</span>
                      <PriceChangeIndicator change={commodity.change} changePercent={commodity.change_percent} />
                    </div>
                    <p className="font-display text-2xl font-bold tracking-tight">
                      {formatPrice(commodity.price, commodity.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{commodity.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No commodity data available</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Stocks by Region Section */}
        <section className="container py-10">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-6 w-6 text-accent" />
            <h2 className="font-display text-2xl font-bold tracking-tight">
              OCTG Industry Stocks
            </h2>
          </div>

          {pricesLoading ? (
            <Skeleton className="h-96" />
          ) : regions.length > 0 ? (
            <Tabs defaultValue={regions[0]} className="w-full">
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                {regions.map((region) => (
                  <TabsTrigger key={region} value={region} className="px-4">
                    {region}
                  </TabsTrigger>
                ))}
              </TabsList>

              {regions.map((region) => (
                <TabsContent key={region} value={region}>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Symbol</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Company</th>
                          <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Price</th>
                          <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Change</th>
                          <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">% Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {stocksByRegion[region].map((stock) => (
                          <tr key={stock.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-mono font-medium text-accent">{stock.symbol}</span>
                            </td>
                            <td className="px-4 py-3 text-sm">{stock.name}</td>
                            <td className="px-4 py-3 text-right font-mono">
                              {formatPrice(stock.price, stock.currency)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={stock.change > 0 ? "text-green-500" : stock.change < 0 ? "text-red-500" : "text-muted-foreground"}>
                                {stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right hidden sm:table-cell">
                              <PriceChangeIndicator change={stock.change} changePercent={stock.change_percent} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No stock data available</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Market Context Section */}
        <section className="container py-10">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="font-display text-xl">About the OCTG Pricing Index</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                The OCTG Pricing Index tracks key steel commodities and publicly traded companies in the oil country tubular goods sector. This includes manufacturers of casing, tubing, drill pipe, and premium connections used in oil and gas exploration and production.
              </p>
              <p>
                Key commodities tracked include Hot Rolled Coil (HRC), Cold Rolled Coil (CRC), iron ore, steel scrap, and steel billet—the raw materials essential to OCTG manufacturing. Stock prices represent major OCTG manufacturers and service providers across Americas, Europe, Asia-Pacific, Australia, and Middle East regions.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Related Articles Section */}
        {pricingArticles.length > 0 && (
          <section className="container py-10">
            <div className="flex items-center gap-3 mb-6">
              <Newspaper className="h-6 w-6 text-accent" />
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Latest Market News
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pricingArticles.map((article) => (
                <Link key={article.id} to={`/article/${article.slug}`}>
                  <Card className="h-full hover:bg-muted/50 transition-colors group">
                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-accent transition-colors">
                        {article.title}
                      </h3>
                      {article.publish_date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(article.publish_date), "MMM d, yyyy")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
