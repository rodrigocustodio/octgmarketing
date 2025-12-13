import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ListOrdered, 
  RefreshCw, 
  Sparkles, 
  Globe, 
  Tag, 
  AlertCircle,
  Search,
  Loader2 
} from "lucide-react";
import { toast } from "sonner";
import OpportunityResearchDialog from "./OpportunityResearchDialog";

interface QueueItem {
  regionId: string;
  regionName: string;
  topicId: string;
  topicName: string;
  articleCount: number;
  priorityScore: number;
  gapReason: string;
}

export default function EditorialQueueTab() {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch and calculate editorial queue
  const { data: queue, isLoading, refetch } = useQuery({
    queryKey: ["editorial-queue-calculated"],
    queryFn: async () => {
      const [regionsResult, topicsResult, articlesResult, articleTopicsResult] = await Promise.all([
        supabase.from("regions").select("id, name").order("name"),
        supabase.from("topics").select("id, name").order("name"),
        supabase.from("articles").select("id, region_id, publish_date").in("status", ["published", "featured"]),
        supabase.from("article_topics").select("article_id, topic_id"),
      ]);

      const regions = regionsResult.data || [];
      const topics = topicsResult.data || [];
      const articles = articlesResult.data || [];
      const articleTopics = articleTopicsResult.data || [];

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate coverage for each region × topic combination
      const queueItems: QueueItem[] = [];

      for (const region of regions) {
        for (const topic of topics) {
          const articleIds = articles
            .filter(a => a.region_id === region.id)
            .map(a => a.id);

          const matchingArticles = articleTopics.filter(
            at => articleIds.includes(at.article_id) && at.topic_id === topic.id
          );

          const count = matchingArticles.length;

          // Calculate priority score
          let priorityScore = 0;
          let gapReason = "";

          if (count === 0) {
            priorityScore = 100;
            gapReason = "No coverage - high priority";
          } else if (count < 3) {
            priorityScore = 75;
            gapReason = "Limited coverage";
          } else if (count < 6) {
            priorityScore = 50;
            gapReason = "Moderate coverage";
          } else {
            priorityScore = 25;
            gapReason = "Good coverage";
          }

          // Check if no recent articles (boost priority)
          const regionArticles = articles.filter(a => a.region_id === region.id);
          const hasRecentArticle = regionArticles.some(
            a => a.publish_date && new Date(a.publish_date) > thirtyDaysAgo
          );
          if (!hasRecentArticle && count > 0) {
            priorityScore += 25;
            gapReason += " (stale - no recent articles)";
          }

          queueItems.push({
            regionId: region.id,
            regionName: region.name,
            topicId: topic.id,
            topicName: topic.name,
            articleCount: count,
            priorityScore,
            gapReason,
          });
        }
      }

      // Round-robin algorithm: rotate through regions while varying topics
      // This ensures balanced coverage across ALL 6 regions and topics
      
      // First, filter to high-priority items (0-2 articles = scores 75-100)
      const highPriority = queueItems.filter(item => item.priorityScore >= 75);
      
      // Get unique regions in a fixed order
      const regionOrder = regions.map(r => r.id);
      const topicIds = topics.map(t => t.id);
      
      // Interleave function: rotates through regions, varies topics each cycle
      function interleaveRoundRobin(items: QueueItem[]): QueueItem[] {
        const result: QueueItem[] = [];
        const usedCombinations = new Set<string>();
        let topicOffset = 0; // Shifts topic selection each region cycle
        
        // Continue until we have enough items or exhausted all options
        while (result.length < 10 && result.length < items.length) {
          let addedThisCycle = false;
          
          // Cycle through each region in order
          for (const regionId of regionOrder) {
            if (result.length >= 10) break;
            
            // Find available items for this region, sorted by priority
            const regionItems = items
              .filter(item => 
                item.regionId === regionId && 
                !usedCombinations.has(`${item.regionId}-${item.topicId}`)
              )
              .sort((a, b) => {
                // Sort by priority, then prefer topics we haven't used recently
                if (b.priorityScore !== a.priorityScore) {
                  return b.priorityScore - a.priorityScore;
                }
                return a.articleCount - b.articleCount;
              });
            
            if (regionItems.length > 0) {
              // Pick item with topic offset to vary topics across regions
              const pickIndex = Math.min(topicOffset % regionItems.length, regionItems.length - 1);
              const selected = regionItems[pickIndex];
              
              result.push(selected);
              usedCombinations.add(`${selected.regionId}-${selected.topicId}`);
              addedThisCycle = true;
            }
          }
          
          topicOffset++; // Next cycle picks different topics
          
          // Prevent infinite loop if no items were added
          if (!addedThisCycle) break;
        }
        
        return result;
      }
      
      // Apply round-robin to high priority items
      const interleaved = interleaveRoundRobin(highPriority);
      
      // If we need more items, add from medium priority with same logic
      if (interleaved.length < 10) {
        const mediumPriority = queueItems
          .filter(item => item.priorityScore < 75 && item.priorityScore >= 50)
          .filter(item => !interleaved.some(i => i.regionId === item.regionId && i.topicId === item.topicId));
        
        const additionalItems = interleaveRoundRobin(mediumPriority);
        interleaved.push(...additionalItems.slice(0, 10 - interleaved.length));
      }

      return interleaved;
    },
  });

  const handleResearchClick = (item: QueueItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const getPriorityColor = (score: number) => {
    if (score >= 100) return "bg-destructive/20 text-destructive border-destructive/30";
    if (score >= 75) return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
    if (score >= 50) return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-primary" />
              Smart Editorial Queue
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            AI-prioritized opportunities based on coverage gaps across 6 regions and {queue?.length ? Math.ceil((queue?.length || 0) / 6) : 0}+ topics.
            Click any item to research and generate article ideas.
          </p>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : queue && queue.length > 0 ? (
            <div className="space-y-3">
              {queue.map((item, index) => (
                <div
                  key={`${item.regionId}-${item.topicId}`}
                  className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleResearchClick(item)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground w-8">
                        #{index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {item.regionName}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {item.topicName}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-xs border ${getPriorityColor(item.priorityScore)}`}
                          >
                            {item.articleCount} articles
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.gapReason}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Search className="h-4 w-4 mr-2" />
                      Research
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No opportunities found. All topics have good coverage!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Research Dialog */}
      {selectedItem && (
        <OpportunityResearchDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          regionName={selectedItem.regionName}
          topicName={selectedItem.topicName}
          regionId={selectedItem.regionId}
          topicId={selectedItem.topicId}
          articleCount={selectedItem.articleCount}
        />
      )}
    </div>
  );
}