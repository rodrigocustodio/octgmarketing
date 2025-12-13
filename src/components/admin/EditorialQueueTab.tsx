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
  Globe, 
  Tag, 
  AlertCircle,
  Search,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import OpportunityResearchDialog from "./OpportunityResearchDialog";

interface QueueItem {
  id: string;
  regionId: string;
  regionName: string;
  topicId: string;
  topicName: string;
  articleCount: number;
  priorityScore: number;
  gapReason: string;
  initialSequence: number;
  lastPublishedAt: string | null;
}

export default function EditorialQueueTab() {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch queue from database with circular ordering
  const { data: queue, isLoading, refetch } = useQuery({
    queryKey: ["editorial-queue-persistent"],
    queryFn: async () => {
      // Fetch queue items with region and topic names
      const { data: queueData, error: queueError } = await supabase
        .from("editorial_queue")
        .select(`
          id,
          region_id,
          topic_id,
          priority_score,
          gap_reason,
          initial_sequence,
          last_published_at,
          regions!inner(id, name),
          topics!inner(id, name)
        `)
        .order("last_published_at", { ascending: true, nullsFirst: true })
        .order("initial_sequence", { ascending: true })
        .limit(15);

      if (queueError) throw queueError;

      // Fetch article counts for each region×topic combination
      const [articlesResult, articleTopicsResult] = await Promise.all([
        supabase.from("articles").select("id, region_id").in("status", ["published", "featured"]),
        supabase.from("article_topics").select("article_id, topic_id"),
      ]);

      const articles = articlesResult.data || [];
      const articleTopics = articleTopicsResult.data || [];

      // Map queue items with article counts
      const queueItems: QueueItem[] = (queueData || []).map((item: any) => {
        const regionId = item.region_id;
        const topicId = item.topic_id;

        // Calculate article count for this region×topic
        const articleIds = articles
          .filter(a => a.region_id === regionId)
          .map(a => a.id);

        const matchingArticles = articleTopics.filter(
          at => articleIds.includes(at.article_id) && at.topic_id === topicId
        );

        const count = matchingArticles.length;

        // Calculate gap reason based on count
        let gapReason = "";
        if (count === 0) {
          gapReason = "No coverage - high priority";
        } else if (count < 3) {
          gapReason = "Limited coverage";
        } else if (count < 6) {
          gapReason = "Moderate coverage";
        } else {
          gapReason = "Good coverage";
        }

        return {
          id: item.id,
          regionId: regionId,
          regionName: item.regions?.name || "Unknown",
          topicId: topicId,
          topicName: item.topics?.name || "Unknown",
          articleCount: count,
          priorityScore: item.priority_score || 100,
          gapReason,
          initialSequence: item.initial_sequence || 0,
          lastPublishedAt: item.last_published_at,
        };
      });

      return queueItems;
    },
  });

  // Mutation to mark item as published (sends to end of queue)
  const markPublishedMutation = useMutation({
    mutationFn: async (queueItemId: string) => {
      const { error } = await supabase
        .from("editorial_queue")
        .update({ last_published_at: new Date().toISOString() })
        .eq("id", queueItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editorial-queue-persistent"] });
      toast.success("Item moved to end of queue");
    },
    onError: (error) => {
      toast.error("Failed to update queue: " + error.message);
    },
  });

  const handleResearchClick = (item: QueueItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleArticleGenerated = () => {
    if (selectedItem) {
      markPublishedMutation.mutate(selectedItem.id);
    }
  };

  const handleMarkPublished = (e: React.MouseEvent, item: QueueItem) => {
    e.stopPropagation();
    markPublishedMutation.mutate(item.id);
  };

  const getPriorityColor = (count: number) => {
    if (count === 0) return "bg-destructive/20 text-destructive border-destructive/30";
    if (count < 3) return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
    if (count < 6) return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
    return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30";
  };

  // Calculate queue stats
  const totalItems = 138; // 6 regions × 23 topics
  const completedCount = queue?.filter(q => q.lastPublishedAt)?.length || 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5 text-primary" />
              Smart Editorial Queue
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Queue: {totalItems} combinations
              </Badge>
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Circular queue rotating through 6 regions × 23 topics = {totalItems} combinations.
            Completed items move to end of sequence automatically.
          </p>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : queue && queue.length > 0 ? (
            <div className="space-y-3">
              {queue.slice(0, 10).map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleResearchClick(item)}
                >
                  <div className="grid grid-cols-[50px_1fr_1.5fr_auto_1fr_auto] items-center gap-4">
                    {/* Column 1: Position */}
                    <span className="text-2xl font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    
                    {/* Column 2: Region */}
                    <Badge variant="outline" className="text-xs w-fit">
                      <Globe className="h-3 w-3 mr-1" />
                      {item.regionName}
                    </Badge>
                    
                    {/* Column 3: Topic */}
                    <Badge variant="outline" className="text-xs w-fit">
                      <Tag className="h-3 w-3 mr-1" />
                      {item.topicName}
                    </Badge>
                    
                    {/* Column 4: Article count */}
                    <Badge className={`text-xs border ${getPriorityColor(item.articleCount)}`}>
                      {item.articleCount} articles
                    </Badge>
                    
                    {/* Column 5: Gap reason */}
                    <span className="text-xs text-muted-foreground">
                      {item.gapReason}
                    </span>
                    
                    {/* Column 6: Actions */}
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-600/10"
                        onClick={(e) => handleMarkPublished(e, item)}
                        disabled={markPublishedMutation.isPending}
                      >
                        {markPublishedMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        )}
                        Done
                      </Button>
                      <Button size="sm" variant="outline">
                        <Search className="h-4 w-4 mr-2" />
                        Research
                      </Button>
                    </div>
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
          queueItemId={selectedItem.id}
          onArticleGenerated={() => refetch()}
        />
      )}
    </div>
  );
}
