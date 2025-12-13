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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, Clock, BarChart3, Globe, Newspaper, Info, AlertCircle, Building2 } from "lucide-react";
import { format } from "date-fns";
import { CostPressureIndicator } from "@/components/market/CostPressureIndicator";

function PriceChangeIndicator({ change, changePercent }: { change: number; changePercent: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center justify-end gap-1 text-green-500">
        <TrendingUp className="h-4 w-4" />
        <span>+{changePercent.toFixed(2)}%</span>
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center justify-end gap-1 text-red-500">
        <TrendingDown className="h-4 w-4" />
        <span>{changePercent.toFixed(2)}%</span>
      </span>
    );
  }
  return (
    <span className="flex items-center justify-end gap-1 text-muted-foreground">
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

function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-muted-foreground hover:text-foreground transition-colors ml-1">
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function PricingIndex() {
  const { data: prices, isLoading: pricesLoading } = useSteelPrices();
  const { data: articles } = usePublishedArticles(4);

  // Separate commodities, stocks, and anchors
  const commodities = prices?.filter((p) => p.category === "commodity") || [];
  const stocks = prices?.filter((p) => p.category === "stock") || [];
  const anchors = prices?.filter((p) => p.category === "anchor") || [];

  // Group stocks by region
  const stocksByRegion = stocks.reduce((acc, stock) => {
    const region = stock.region || "Global";
    if (!acc[region]) acc[region] = [];
    acc[region].push(stock);
    return acc;
  }, {} as Record<string, typeof stocks>);

  // Group anchors by region
  const anchorsByRegion = anchors.reduce((acc, anchor) => {
    const region = anchor.region || "Global";
    if (!acc[region]) acc[region] = [];
    acc[region].push(anchor);
    return acc;
  }, {} as Record<string, typeof anchors>);

  const regions = Object.keys(stocksByRegion).sort();

  // Get latest update time
  const latestUpdate = prices?.[0]?.updated_at;

  // Use the latest published articles for market news
  const pricingArticles = articles || [];

  // Schema.org structured data - Updated for market intelligence positioning
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
    name: "Market Prices – OCTG Cost Drivers, Benchmarks & Industry Indicators",
    description: "Track the raw material cost drivers, steel benchmarks, and industry indicators influencing OCTG pricing worldwide. Includes steel commodities, market sentiment, and energy-sector equity signals impacting casing and tubing markets.",
    url: "https://octgindex.com/pricing-index",
    publisher: {
      "@type": "Organization",
      name: "OCTG Index",
      url: "https://octgindex.com",
    },
    mainEntity: {
      "@type": "Dataset",
      name: "OCTG Market Indicators",
      description: "Steel commodity benchmarks and energy-sector equity indicators tracking cost pressures in OCTG manufacturing",
      keywords: ["OCTG", "steel prices", "market indicators", "cost drivers", "energy sector"],
    },
  };

  const structuredData = [breadcrumbSchema, schemaData];

  return (
    <>
      <SEOHead
        title="Market Prices – OCTG Cost Drivers, Benchmarks & Industry Indicators | OCTG Index"
        description="Track the raw material cost drivers, steel benchmarks, and industry indicators influencing OCTG pricing worldwide. Includes steel commodities, market sentiment, and energy-sector equity signals impacting casing and tubing markets."
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
              <Badge variant="secondary" className="text-xs">MARKET INTELLIGENCE</Badge>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Market Prices – OCTG Cost Drivers, Benchmarks & Industry Indicators
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mb-6">
              Track the raw material cost drivers, steel benchmarks, and industry indicators influencing OCTG pricing worldwide. 
              Includes steel commodities, market sentiment, and energy-sector equity signals impacting casing and tubing markets.
            </p>
            {latestUpdate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last updated: {format(new Date(latestUpdate), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
            )}
          </div>
        </section>

        {/* Editorial Explainer Block - MANDATORY */}
        <section className="container py-8">
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <h2 className="font-display text-lg font-semibold mb-3">About These Market Prices</h2>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      OCTG pricing is influenced by a combination of steel raw material costs, manufacturing capacity, 
                      energy-sector investment cycles, and global market sentiment.
                    </p>
                    <p>
                      This page tracks key input commodities (such as hot-rolled coil, billet, scrap, and iron ore) 
                      alongside publicly traded energy and steel companies to provide directional insight into cost 
                      pressure and market conditions impacting OCTG markets globally.
                    </p>
                    <p className="font-medium text-foreground">
                      This data does not represent spot or contract OCTG pipe pricing.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* OCTG Cost Pressure Index - Signature Feature */}
        {!pricesLoading && commodities.length > 0 && (
          <section className="container py-6">
            <CostPressureIndicator commodities={commodities} stocks={stocks} />
          </section>
        )}

        {/* Commodities Section */}
        <section className="container py-10">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Steel & Raw Material Cost Drivers
              </h2>
              <InfoTooltip content="These materials directly influence casing and tubing production costs. Data is editorial and directional—not transactional." />
            </div>
            <p className="text-sm text-muted-foreground">
              These materials directly influence casing and tubing production costs and mill pricing behavior.
            </p>
          </div>

          {pricesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : commodities.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {commodities.map((commodity) => (
                  <Card key={commodity.id} className="bg-card hover:bg-card/80 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-muted-foreground">{commodity.symbol}</span>
                          <InfoTooltip content="Input commodity used as cost-pressure proxy. Not transactional." />
                        </div>
                        <PriceChangeIndicator change={commodity.change} changePercent={commodity.change_percent} />
                      </div>
                      <p className="font-display text-2xl font-bold tracking-tight">
                        {formatPrice(commodity.price, commodity.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{commodity.name}</p>
                      <Badge variant="outline" className="mt-2 text-[10px]">Cost Driver</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Data Source Attribution */}
              <p className="text-xs text-muted-foreground mt-4 italic">
                Source: Exchange data, public market feeds, editorial aggregation. Editorial indicator—not transactional.
              </p>
            </>
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
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="h-6 w-6 text-accent" />
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Energy & Steel Equities – Market Sentiment Indicators
              </h2>
              <InfoTooltip content="Equity performance reflects capital investment cycles and market sentiment, not direct OCTG pipe pricing." />
            </div>
            <p className="text-sm text-muted-foreground">
              Equity performance reflects capital investment cycles and market sentiment, not direct OCTG pipe pricing.
            </p>
          </div>

          {pricesLoading ? (
            <Skeleton className="h-96" />
          ) : regions.length > 0 ? (
            <>
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
                    {/* Regional Industry Anchors Section */}
                    {anchorsByRegion[region] && anchorsByRegion[region].length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="h-4 w-4 text-accent" />
                          <h3 className="text-sm font-semibold text-muted-foreground">
                            Regional Industry Anchors — Strategic NOCs & EPCs
                          </h3>
                          <InfoTooltip content="Non-equity entities included for regional authority and industry context. No live pricing." />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {anchorsByRegion[region].map((anchor) => (
                            <Badge key={anchor.id} variant="secondary" className="px-3 py-1.5">
                              {anchor.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

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
              {/* Equity-based indicator label */}
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">Market Sentiment Proxy</Badge>
                <p className="text-xs text-muted-foreground italic">
                  Equity-based indicator — delayed market data. Source: Public stock exchange feeds, company filings.
                </p>
              </div>
            </>
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
              <CardTitle className="font-display text-xl">About OCTG Market Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                OCTG Index tracks the forces shaping OCTG pricing — not the transactions themselves. We provide 
                directional insight into cost pressures and market conditions by monitoring key input commodities 
                and market sentiment indicators.
              </p>
              <p>
                Key cost drivers tracked include Hot Rolled Coil (HRC), Cold Rolled Coil (CRC), iron ore, steel scrap, 
                and steel billet—the raw materials essential to casing and tubing manufacturing. Equity indicators 
                represent major energy and steel companies across Americas, Europe, Asia-Pacific, Australia, and 
                Middle East regions, reflecting capital investment cycles and industry sentiment.
              </p>
              <p className="text-muted-foreground text-sm">
                For specific OCTG pipe pricing inquiries, please contact manufacturers or distributors directly.
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
