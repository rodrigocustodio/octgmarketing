import { useEditorialSuggestions, useUpdateSuggestionStatus, useGenerateTopicSuggestions } from "@/hooks/useEditorialStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Sparkles, Check, X, Loader2, TrendingUp, Target } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TopicSuggestions() {
  const { data: suggestions, isLoading } = useEditorialSuggestions();
  const updateStatus = useUpdateSuggestionStatus();
  const generateSuggestions = useGenerateTopicSuggestions();

  const handleGenerate = async () => {
    try {
      await generateSuggestions.mutateAsync();
      toast.success("New topic suggestions generated!");
    } catch (error) {
      toast.error("Failed to generate suggestions");
      console.error(error);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Suggestion marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update suggestion");
    }
  };

  const pendingSuggestions = suggestions?.filter(s => s.status === "pending") || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Topic Suggestions
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateSuggestions.isPending}
            size="sm"
          >
            {generateSuggestions.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Ideas
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : pendingSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No pending suggestions</p>
            <Button onClick={handleGenerate} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate New Ideas
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{suggestion.title}</h4>
                    {suggestion.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {suggestion.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {suggestion.region?.name && (
                        <Badge variant="outline" className="text-xs">
                          {suggestion.region.name}
                        </Badge>
                      )}
                      {suggestion.seo_score && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            suggestion.seo_score >= 70
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : suggestion.seo_score >= 50
                              ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                              : "bg-muted"
                          )}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          SEO: {suggestion.seo_score}
                        </Badge>
                      )}
                      {suggestion.business_score && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            suggestion.business_score >= 70
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : suggestion.business_score >= 50
                              ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                              : "bg-muted"
                          )}
                        >
                          <Target className="h-3 w-3 mr-1" />
                          Biz: {suggestion.business_score}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs capitalize">
                        {suggestion.source}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                      onClick={() => handleStatusUpdate(suggestion.id, "used")}
                      aria-label="Mark as used"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleStatusUpdate(suggestion.id, "dismissed")}
                      aria-label="Dismiss suggestion"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
