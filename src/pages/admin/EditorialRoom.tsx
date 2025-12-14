import AdminLayout from "@/components/admin/AdminLayout";
import { useEditorialStats } from "@/hooks/useEditorialStats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Newspaper, 
  Globe, 
  Building2, 
  Tag, 
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Package,
  Tags,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import CoverageHeatmap from "@/components/admin/CoverageHeatmap";
import CompanyMentions from "@/components/admin/CompanyMentions";
import TopicSuggestions from "@/components/admin/TopicSuggestions";
import ProductCoverageMatrix from "@/components/admin/ProductCoverageMatrix";

interface RecategorizationResult {
  article_id: string;
  title: string;
  old_category: string | null;
  new_category: string;
  confidence: number;
  success: boolean;
  error?: string;
}

function StatCard({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  subValue?: string; 
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subValue && (
              <div className="flex items-center gap-1 mt-1">
                {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
                {trend === "neutral" && <Minus className="h-3 w-3 text-muted-foreground" />}
                <p className="text-xs text-muted-foreground">{subValue}</p>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EditorialRoom() {
  const { data: stats, isLoading } = useEditorialStats();
  const [isRecategorizing, setIsRecategorizing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<RecategorizationResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const getTrend = () => {
    if (!stats) return "neutral";
    if (stats.articlesThisWeek > stats.articlesLastWeek) return "up";
    if (stats.articlesThisWeek < stats.articlesLastWeek) return "down";
    return "neutral";
  };

  const getWeeklyChange = () => {
    if (!stats) return "";
    const diff = stats.articlesThisWeek - stats.articlesLastWeek;
    if (diff > 0) return `+${diff} from last week`;
    if (diff < 0) return `${diff} from last week`;
    return "Same as last week";
  };

  const handleRecategorizeAll = async () => {
    setIsRecategorizing(true);
    setResults([]);
    
    // Get total article count
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .in('status', ['published', 'featured']);
    
    const totalArticles = count || 0;
    setProgress({ current: 0, total: totalArticles });
    
    let allResults: RecategorizationResult[] = [];
    let offset = 0;
    const batchSize = 10;
    
    try {
      while (offset < totalArticles) {
        const { data, error } = await supabase.functions.invoke('recategorize-articles', {
          body: { batch_size: batchSize, offset }
        });
        
        if (error) throw error;
        
        const batchResults = data?.results || [];
        allResults = [...allResults, ...batchResults];
        
        const newCurrent = Math.min(offset + batchSize, totalArticles);
        setProgress({ current: newCurrent, total: totalArticles });
        
        toast({
          title: `Processing ${newCurrent}/${totalArticles}`,
          description: `${batchResults.filter((r: RecategorizationResult) => r.success).length} articles updated in this batch`,
        });
        
        offset += batchSize;
      }
      
      setResults(allResults);
      setShowResults(true);
      
      const successCount = allResults.filter(r => r.success).length;
      toast({
        title: "Recategorization Complete",
        description: `${successCount}/${allResults.length} articles successfully recategorized`,
      });
    } catch (error) {
      console.error('Recategorization error:', error);
      toast({
        title: "Error",
        description: "Failed to complete recategorization",
        variant: "destructive",
      });
    } finally {
      setIsRecategorizing(false);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Editorial Room
          </h1>
          <p className="text-muted-foreground mt-1">
            Content planning hub with analytics, gap analysis, and AI-powered topic suggestions
          </p>
        </div>

        {/* AI Recategorization Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">AI Category Assignment</CardTitle>
              </div>
              {results.length > 0 && !isRecategorizing && (
                <Button variant="outline" size="sm" onClick={() => setShowResults(true)}>
                  View Last Results
                </Button>
              )}
            </div>
            <CardDescription>
              Use Perplexity AI to analyze all articles and assign the best-matching category from the official 30-category list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRecategorizing && (
              <div className="space-y-2">
                <Progress value={(progress.current / progress.total) * 100} />
                <p className="text-sm text-muted-foreground text-center">
                  Processing {progress.current}/{progress.total} articles...
                </p>
              </div>
            )}
            <Button 
              onClick={handleRecategorizeAll} 
              disabled={isRecategorizing}
              className="w-full"
            >
              {isRecategorizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recategorizing...
                </>
              ) : (
                <>
                  <Tags className="mr-2 h-4 w-4" />
                  Recategorize All Articles
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Published Articles"
                value={stats?.totalArticles || 0}
                subValue={getWeeklyChange()}
                icon={Newspaper}
                trend={getTrend() as "up" | "down" | "neutral"}
              />
              <StatCard
                title="Regions Covered"
                value={`${stats?.regionsCount || 0}/${stats?.totalRegions || 0}`}
                subValue={stats?.regionsCount === stats?.totalRegions ? "Full coverage" : "Gaps exist"}
                icon={Globe}
                trend={stats?.regionsCount === stats?.totalRegions ? "up" : "down"}
              />
              <StatCard
                title="Companies Mentioned"
                value={`${stats?.companiesMentioned || 0}/${stats?.totalCompanies || 0}`}
                subValue={`${Math.round(((stats?.companiesMentioned || 0) / (stats?.totalCompanies || 1)) * 100)}% coverage`}
                icon={Building2}
                trend={(stats?.companiesMentioned || 0) / (stats?.totalCompanies || 1) > 0.5 ? "up" : "down"}
              />
              <StatCard
                title="This Week"
                value={stats?.articlesThisWeek || 0}
                subValue={`${stats?.articlesLastWeek || 0} last week`}
                icon={Tag}
                trend={getTrend() as "up" | "down" | "neutral"}
              />
            </>
          )}
        </div>

        {/* Coverage Tabs */}
        <Tabs defaultValue="topics" className="w-full">
          <TabsList>
            <TabsTrigger value="topics" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Region × Topic
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              OCTG Products
            </TabsTrigger>
          </TabsList>
          <TabsContent value="topics" className="mt-4">
            <CoverageHeatmap />
          </TabsContent>
          <TabsContent value="products" className="mt-4">
            <ProductCoverageMatrix />
          </TabsContent>
        </Tabs>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Company Mentions */}
          <CompanyMentions />

          {/* AI Topic Suggestions */}
          <TopicSuggestions />
        </div>

        {/* Results Dialog */}
        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Recategorization Results</DialogTitle>
              <DialogDescription>
                Summary of AI category assignments for all articles
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">{successCount} Success</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="font-medium">{errorCount} Errors</span>
              </div>
            </div>
            
            <ScrollArea className="h-[400px] rounded-md border">
              <div className="p-4 space-y-2">
                {results.map((result, index) => (
                  <div 
                    key={result.article_id || index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{result.old_category || 'None'}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="text-foreground font-medium">{result.new_category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge 
                        variant={result.confidence > 0.8 ? "default" : result.confidence > 0.5 ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {Math.round(result.confidence * 100)}%
                      </Badge>
                      {result.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="flex justify-end">
              <Button onClick={() => setShowResults(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}