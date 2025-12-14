import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Sparkles, ExternalLink, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ArticleIdea {
  title: string;
  description: string;
  sources: string[];
  relevance: string;
}

interface OpportunityResearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regionName: string | null;
  topicName: string | null;
  regionId: string | null;
  topicId: string | null;
  articleCount: number;
  queueItemId?: string;
  onArticleGenerated?: () => void;
}

export default function OpportunityResearchDialog({
  open,
  onOpenChange,
  regionName,
  topicName,
  regionId,
  topicId,
  articleCount,
  queueItemId,
  onArticleGenerated,
}: OpportunityResearchDialogProps) {
  const navigate = useNavigate();
  const [isResearching, setIsResearching] = useState(false);
  const [ideas, setIdeas] = useState<ArticleIdea[]>([]);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);

  const handleResearch = async () => {
    setIsResearching(true);
    setIdeas([]);

    try {
      const { data, error } = await supabase.functions.invoke("research-editorial-opportunity", {
        body: { region_name: regionName, topic_name: topicName },
      });

      if (error) throw error;

      if (data?.ideas) {
        setIdeas(data.ideas);
        toast.success(`Found ${data.ideas.length} article ideas`);
      }
    } catch (error) {
      console.error("Research error:", error);
      toast.error("Failed to research opportunity");
    } finally {
      setIsResearching(false);
    }
  };

  const handleGenerateArticle = async (idea: ArticleIdea, index: number) => {
    setGeneratingIndex(index);

    try {
      const content = `Topic: ${idea.title}\n\nDescription: ${idea.description}\n\nRelevance: ${idea.relevance}\n\nSources: ${idea.sources.join(", ")}`;

      const { data, error } = await supabase.functions.invoke("generate-article-from-content", {
        body: { content, source_name: "Editorial Research" },
      });

      if (error) throw error;

      // Navigate to create article page with pre-filled data
      toast.success("Article generated! Redirecting to editor...");
      
      // Store generated article data in sessionStorage to pass to CreateArticle
      sessionStorage.setItem('generatedArticle', JSON.stringify({
        ...data,
        region_id: regionId,
        suggested_topic_ids: topicId ? [topicId] : [],
      }));
      
      // Mark the queue item as published BEFORE navigating
      if (queueItemId) {
        const { error: updateError } = await supabase
          .from("editorial_queue")
          .update({ last_published_at: new Date().toISOString() })
          .eq("id", queueItemId);
        
        if (updateError) {
          console.error("Failed to update queue item:", updateError);
        }
      }
      
      // Notify parent to refetch
      onArticleGenerated?.();
      
      onOpenChange(false);
      navigate("/admin/create?fromResearch=true");
    } catch (error) {
      console.error("Generate error:", error);
      toast.error("Failed to generate article");
    } finally {
      setGeneratingIndex(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Editorial Opportunity
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Context info */}
          <div className="flex items-center gap-2 flex-wrap">
            {regionName && <Badge variant="outline">{regionName}</Badge>}
            {topicName && <Badge variant="outline">{topicName}</Badge>}
            <Badge
              variant={articleCount === 0 ? "destructive" : articleCount < 3 ? "secondary" : "default"}
            >
              {articleCount} article{articleCount !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Research button */}
          {ideas.length === 0 && !isResearching && (
            <Button onClick={handleResearch} className="w-full" size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Research Article Ideas with AI
            </Button>
          )}

          {/* Loading state */}
          {isResearching && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching for recent news...</span>
              </div>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          )}

          {/* Ideas list */}
          {ideas.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {ideas.length} article ideas based on recent news:
              </p>

              {ideas.map((idea, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <h4 className="font-semibold mb-2">{idea.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{idea.description}</p>

                  {idea.sources?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {idea.sources.slice(0, 3).map((source, idx) => (
                        <a
                          key={idx}
                          href={source.startsWith('http') ? source : `https://${source}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex"
                        >
                          <Badge 
                            variant="secondary" 
                            className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {source.replace(/^https?:\/\//, '').slice(0, 35)}...
                          </Badge>
                        </a>
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={() => handleGenerateArticle(idea, index)}
                    disabled={generatingIndex !== null}
                    size="sm"
                  >
                    {generatingIndex === index ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Article
                      </>
                    )}
                  </Button>
                </div>
              ))}

              {/* Research again */}
              <Button onClick={handleResearch} variant="outline" className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Search Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}