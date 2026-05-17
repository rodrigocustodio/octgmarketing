import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useExecutivesByRegion, useExecutiveStats } from "@/hooks/useExecutives";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Building2, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import globeCeoLeaders from "@/assets/globe-ceo-leaders.jpg";

const REGIONS = [
  { value: "all", label: "All Regions" },
  { value: "Americas", label: "Americas" },
  { value: "Europe", label: "Europe" },
  { value: "Asia-Pacific", label: "Asia-Pacific" },
  { value: "Australia", label: "Australia" },
];


export default function CEODirectory() {
  const [selectedRegion, setSelectedRegion] = useState("all");
  const { data: executives, isLoading } = useExecutivesByRegion(selectedRegion);
  const { data: stats } = useExecutiveStats();

  // CollectionPage Schema for AI search optimization
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://octgindex.com/ceo-directory",
    name: "Energy Industry Leadership Directory",
    description: `Meet the CEOs leading ${stats?.total || 49} publicly traded companies in the OCTG industry. Executive profiles spanning steel manufacturing, oilfield services, and drilling.`,
    url: "https://octgindex.com/ceo-directory",
    isPartOf: {
      "@type": "WebSite",
      name: "OCTG Index",
      url: "https://octgindex.com"
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".directory-hero", ".directory-stats"]
    }
  };

  // ItemList Schema for CEO listings
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Energy Industry Executives",
    description: "Complete listing of CEOs and executives in the OCTG industry",
    numberOfItems: stats?.total || 49,
    itemListElement: executives?.slice(0, 20).map((exec, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://octgindex.com/ceo/${exec.slug}`,
      name: exec.name,
      description: `${exec.title} at ${exec.company_name}`
    })) || []
  };

  // BreadcrumbList Schema
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
        name: "CEO Directory",
        item: "https://octgindex.com/ceo-directory"
      }
    ]
  };

  // FAQPage Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the OCTG CEO Directory?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `The OCTG CEO Directory is a comprehensive database of ${stats?.total || 49} chief executives leading major publicly traded companies in the Oil Country Tubular Goods industry, including steel manufacturers, oilfield service companies, and drilling contractors.`
        }
      },
      {
        "@type": "Question",
        name: "How many OCTG company CEOs are listed?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `The directory features ${stats?.total || 49} CEOs from publicly traded OCTG companies across ${REGIONS.length - 1} global regions: Americas (${stats?.byRegion?.Americas || 18}), Europe (${stats?.byRegion?.Europe || 11}), Asia-Pacific (${stats?.byRegion?.["Asia-Pacific"] || 7}), and Australia (${stats?.byRegion?.Australia || 1}).`
        }
      },
      {
        "@type": "Question",
        name: "What industries do these CEOs represent?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The CEOs in this directory lead companies across steel manufacturing, OCTG production, oilfield services, drilling operations, energy exploration, and related sectors of the oil and gas industry."
        }
      }
    ]
  };

  const structuredData = [collectionPageSchema, itemListSchema, breadcrumbSchema, faqSchema];

  return (
    <>
      <SEOHead
        title="Energy Industry Leadership | CEO Directory"
        description="Meet the CEOs leading major publicly traded companies in the OCTG industry. Executive profiles spanning steel manufacturing, oilfield services, and drilling."
        canonical="https://octgindex.com/ceo-directory"
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        {/* Hero Section */}
        <section className="directory-hero relative py-16 md:py-24 overflow-hidden border-b border-border">
          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0">
            <img 
              src={globeCeoLeaders} 
              alt="" 
              className="w-full h-full object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/40" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>CEO Directory</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-4">
                Leadership Directory
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Energy Industry Leadership
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Meet the Chief Executive Officers leading {stats?.total || 37} publicly traded companies 
                across the global OCTG industry—spanning steel manufacturing, oilfield services, 
                drilling operations, and related sectors.
              </p>
            </div>

            {/* Stats */}
            <div className="directory-stats flex flex-wrap gap-6 mt-8">
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
        <section className="sticky top-[88px] z-30 bg-background/95 backdrop-blur border-b border-border">
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
                            src={optimizeImageUrl(executive.photo_url, { width: 400, quality: 75 }) || executive.photo_url}
                            srcSet={`
                              ${optimizeImageUrl(executive.photo_url, { width: 300, quality: 70 }) || executive.photo_url} 300w,
                              ${optimizeImageUrl(executive.photo_url, { width: 500, quality: 75 }) || executive.photo_url} 500w
                            `}
                            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
                            alt={`${executive.name}, ${executive.title} at ${executive.company_name}`}
                            width={400}
                            height={300}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                            <User className="w-16 h-16 text-muted-foreground/30" />
                          </div>
                        )}
                        <Badge
                          variant="outline"
                          className="absolute top-2 right-2 bg-gray-800/80 text-gray-300 border-gray-600/50 text-[10px] px-1.5 py-0.5"
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