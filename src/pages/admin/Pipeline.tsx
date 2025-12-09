import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Sparkles, RefreshCw, Search, Wand2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useSourceArticleCounts,
  useDraftArticleCounts,
  useScrapeOctg,
  useGenerateDrafts,
  useSearchTopic,
  useFixArticleEndings,
} from "@/hooks/usePipeline";

const REGION_OPTIONS = [
  { value: "all", label: "All Regions" },
  { value: "Global", label: "Global" },
  { value: "Americas", label: "Americas" },
  { value: "Europe", label: "Europe" },
  { value: "Asia-Pacific", label: "Asia-Pacific" },
  { value: "Middle East", label: "Middle East" },
  { value: "Africa", label: "Africa" },
  { value: "Australia", label: "Australia" },
];

const SEARCH_PRESETS = [
  { label: "OCTG News", query: "OCTG pipe tube casing news announcements" },
  { label: "Steel Prices", query: "steel pipe prices market pricing trends" },
  { label: "Drilling Activity", query: "drilling rig count oil gas exploration" },
  { label: "Tariffs & Trade", query: "steel tariffs import sanctions trade policy" },
  { label: "Pipeline Projects", query: "pipeline construction contracts offshore" },
  { label: "M&A Deals", query: "mergers acquisitions steel oil gas companies" },
  { label: "Mill Updates", query: "steel mill production capacity expansion" },
  { label: "Shale & Permian", query: "shale Permian basin fracking production" },
];

const Pipeline = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [topicQuery, setTopicQuery] = useState<string>("");
  const sourceCounts = useSourceArticleCounts();
  const draftCounts = useDraftArticleCounts();
  const scrapeOctg = useScrapeOctg();
  const generateDrafts = useGenerateDrafts();
  const searchTopic = useSearchTopic();
  const fixEndings = useFixArticleEndings();

  const isRefreshing = sourceCounts.isFetching || draftCounts.isFetching;

  const refreshAll = () => {
    sourceCounts.refetch();
    draftCounts.refetch();
  };

  const handleTopicSearch = () => {
    if (topicQuery.trim()) {
      searchTopic.mutate(topicQuery.trim());
    }
  };

  const handlePresetClick = (query: string) => {
    setTopicQuery(query);
    searchTopic.mutate(query);
  };

  return (
    <>
      <Helmet>
        <title>Content Pipeline | OCTG Admin</title>
      </Helmet>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Content Pipeline</h1>
              <p className="text-muted-foreground">
                Scrape sources and generate AI drafts
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshAll} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          {/* Topic Search Agent */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Topic Search Agent
              </CardTitle>
              <CardDescription>
                Search the web for recent OCTG articles on a specific topic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., OCTG pipe prices North America 2025"
                  value={topicQuery}
                  onChange={(e) => setTopicQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTopicSearch()}
                  className="flex-1"
                />
                <Button
                  onClick={handleTopicSearch}
                  disabled={searchTopic.isPending || !topicQuery.trim()}
                >
                  {searchTopic.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              
              {/* Quick Search Presets */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Quick searches:</p>
                <div className="flex flex-wrap gap-2">
                  {SEARCH_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetClick(preset.query)}
                      disabled={searchTopic.isPending}
                      className="text-xs hover:bg-accent hover:text-accent-foreground"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Step 1: Scrape Sources
                </CardTitle>
                <CardDescription>
                  Search and collect OCTG news articles from industry sources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select region to scrape" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => scrapeOctg.mutate(selectedRegion === "all" ? {} : { region: selectedRegion })}
                  disabled={scrapeOctg.isPending}
                  className="w-full"
                >
                  {scrapeOctg.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scraping {selectedRegion === "all" ? "All Regions" : selectedRegion}...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Run Scraper
                    </>
                  )}
                </Button>
                
                {sourceCounts.data && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {sourceCounts.data.total} Total
                    </Badge>
                    <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">
                      {sourceCounts.data.new} New
                    </Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                      {sourceCounts.data.processed} Processed
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Step 2: Generate Drafts
                </CardTitle>
                <CardDescription>
                  Use AI to rewrite source articles into editorial drafts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => generateDrafts.mutate()}
                  disabled={generateDrafts.isPending || (sourceCounts.data?.new ?? 0) === 0}
                  className="w-full"
                >
                  {generateDrafts.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Drafts
                    </>
                  )}
                </Button>

                {draftCounts.data && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {draftCounts.data.total} Total
                    </Badge>
                    <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">
                      {draftCounts.data.pending_review} Pending
                    </Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                      {draftCounts.data.approved} Approved
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Utilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Utilities
              </CardTitle>
              <CardDescription>
                Tools for bulk content fixes and optimizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => fixEndings.mutate({ table: 'both', dryRun: false })}
                disabled={fixEndings.isPending}
              >
                {fixEndings.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fixing Endings...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Fix "Conclusion" Headers
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Replaces generic "Conclusion" headers with creative, contextual alternatives
              </p>
            </CardContent>
          </Card>

          {/* Pipeline Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Status</CardTitle>
              <CardDescription>
                Overview of content at each stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold">
                    {sourceCounts.data?.new ?? "-"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Source Articles (New)
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold">
                    {draftCounts.data?.pending_review ?? "-"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Drafts Pending Review
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold">
                    {draftCounts.data?.approved ?? "-"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Approved Drafts
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold">
                    {draftCounts.data?.published ?? "-"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Published
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
};

export default Pipeline;
