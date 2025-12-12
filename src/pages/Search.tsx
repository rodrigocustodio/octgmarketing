import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Search as SearchIcon, Newspaper, Building2, User, Tag, Globe } from "lucide-react";
import { useSearchData, filterSearchResults, SearchResult } from "@/hooks/useSearch";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const { searchIndex, isLoading } = useSearchData();

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  // Filter results based on query
  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    return filterSearchResults(searchIndex, query);
  }, [searchIndex, query]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      article: [],
      company: [],
      executive: [],
      topic: [],
      region: [],
    };
    results.forEach((result) => {
      if (groups[result.type]) {
        groups[result.type].push(result);
      }
    });
    return groups;
  }, [results]);

  const getIcon = (type: string) => {
    switch (type) {
      case "article": return <Newspaper className="h-4 w-4" />;
      case "company": return <Building2 className="h-4 w-4" />;
      case "executive": return <User className="h-4 w-4" />;
      case "topic": return <Tag className="h-4 w-4" />;
      case "region": return <Globe className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "article": return "Articles";
      case "company": return "Companies";
      case "executive": return "Executives";
      case "topic": return "Topics";
      case "region": return "Regions";
      default: return type;
    }
  };

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
        name: "Search",
        item: "https://octgindex.com/search"
      }
    ]
  };

  return (
    <>
      <SEOHead
        title={query ? `Search: ${query} | OCTG Index` : "Search | OCTG Index"}
        description="Search the OCTG Index database for news, companies, executives, and market intelligence across the oil country tubular goods industry."
        canonical="https://octgindex.com/search"
        noindex
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-12">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Search</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Search OCTG Index
          </h1>

          {/* Search Input */}
          <div className="relative max-w-2xl mb-8">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search articles, companies, executives..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
              autoFocus
            />
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : query.length < 2 ? (
            <div className="text-center py-12 text-muted-foreground">
              <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Enter at least 2 characters to search</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-2">Try different keywords or browse our directories</p>
            </div>
          ) : (
            <div className="space-y-8">
              <p className="text-sm text-muted-foreground">
                Found {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
              </p>

              {Object.entries(groupedResults).map(([type, typeResults]) => {
                if (typeResults.length === 0) return null;
                return (
                  <div key={type}>
                    <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                      {getIcon(type)}
                      {getTypeLabel(type)}
                      <Badge variant="secondary" className="ml-2">{typeResults.length}</Badge>
                    </h2>
                    <div className="grid gap-3">
                      {typeResults.map((result) => (
                        <Link key={result.id} to={result.url}>
                          <Card className="hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                {getIcon(result.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{result.title}</h3>
                                {result.subtitle && (
                                  <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
