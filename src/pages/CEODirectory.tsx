import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useExecutivesByRegion, useExecutiveStats } from "@/hooks/useExecutives";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const REGIONS = [
  { value: "all", label: "All Regions" },
  { value: "Americas", label: "Americas" },
  { value: "Europe", label: "Europe" },
  { value: "Asia-Pacific", label: "Asia-Pacific" },
  { value: "Australia", label: "Australia" },
];

const regionColors: Record<string, string> = {
  Americas: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Europe: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Asia-Pacific": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Australia: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function CEODirectory() {
  const [selectedRegion, setSelectedRegion] = useState("all");
  const { data: executives, isLoading } = useExecutivesByRegion(selectedRegion);
  const { data: stats } = useExecutiveStats();

  return (
    <>
      <SEOHead
        title="OCTG Industry Leadership | CEO Directory"
        description="Meet the CEOs leading 37 publicly traded companies in the OCTG industry. Executive profiles spanning steel manufacturing, oilfield services, and drilling operations."
        canonical="https://octgindex.com/ceo-directory"
      />

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-b from-card to-background border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-4">
                Leadership Directory
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
                OCTG Industry Leadership
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Meet the Chief Executive Officers leading {stats?.total || 37} publicly traded companies 
                across the global OCTG industry—spanning steel manufacturing, oilfield services, 
                drilling operations, and related sectors.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-8">
              {REGIONS.slice(1).map((region) => (
                <div key={region.value} className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {stats?.byRegion[region.value] || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">{region.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filter Tabs */}
        <section className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <Tabs value={selectedRegion} onValueChange={setSelectedRegion}>
              <TabsList className="bg-muted/50">
                {REGIONS.map((region) => (
                  <TabsTrigger key={region.value} value={region.value} className="px-4">
                    {region.label}
                    {region.value !== "all" && stats?.byRegion[region.value] && (
                      <span className="ml-2 text-xs opacity-60">
                        ({stats.byRegion[region.value]})
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </section>

        {/* Executive Grid */}
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {executives?.map((executive) => (
                  <Link key={executive.id} to={`/ceo/${executive.slug}`}>
                    <Card className="group overflow-hidden hover:border-primary/50 transition-all duration-300 h-full">
                      {/* Photo or Placeholder */}
                      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                        {executive.photo_url ? (
                          <img
                            src={executive.photo_url}
                            alt={executive.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                            <User className="w-16 h-16 text-muted-foreground/30" />
                          </div>
                        )}
                        <Badge
                          variant="outline"
                          className={`absolute top-3 right-3 ${regionColors[executive.region] || ""}`}
                        >
                          {executive.region}
                        </Badge>
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {executive.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {executive.title}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="line-clamp-1">{executive.company_name}</span>
                        </div>
                        {executive.stock_symbol && (
                          <div className="mt-1 text-xs font-mono text-accent">
                            {executive.stock_symbol}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {executives?.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                No executives found for this region.
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
