import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  ExternalLink 
} from "lucide-react";

interface DraftArticle {
  id: string;
  source_article_id: string | null;
  region_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  body_markdown: string | null;
  hero_image_url: string | null;
  tags: string[] | null;
  status: "pending_review" | "approved" | "rejected";
  editor_notes: string | null;
  created_at: string;
  region?: { name: string } | null;
  source_article?: {
    title: string;
    source_url: string;
    source_name: string;
    raw_content: string | null;
  } | null;
}

const statusColors = {
  pending_review: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  approved: "bg-green-500/20 text-green-500 border-green-500/30",
  rejected: "bg-red-500/20 text-red-500 border-red-500/30",
};

const DraftDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [draft, setDraft] = useState<DraftArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorNotes, setEditorNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDraft = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("draft_articles")
          .select(`
            *,
            region:regions(name),
            source_article:source_articles(
              title,
              source_url,
              source_name,
              raw_content
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;

        setDraft(data as DraftArticle);
        setEditorNotes(data.editor_notes || "");
      } catch (error) {
        console.error("Error fetching draft:", error);
        toast({
          title: "Error",
          description: "Failed to load draft article",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
  }, [id, toast]);

  const handleApprove = async () => {
    if (!draft) return;
    
    setSubmitting(true);
    try {
      // Update draft status
      const { error: draftError } = await supabase
        .from("draft_articles")
        .update({
          status: "approved",
          editor_notes: editorNotes || null,
        })
        .eq("id", draft.id);

      if (draftError) throw draftError;

      // Create new article in main articles table
      const { error: articleError } = await supabase
        .from("articles")
        .insert({
          title: draft.title,
          slug: draft.slug,
          subtitle: draft.excerpt,
          body: draft.body_markdown,
          hero_image_url: draft.hero_image_url,
          region_id: draft.region_id,
          status: "published",
          publish_date: new Date().toISOString(),
        });

      if (articleError) throw articleError;

      toast({
        title: "Article Approved",
        description: "The draft has been approved and added to articles.",
      });

      navigate("/admin/drafts");
    } catch (error) {
      console.error("Error approving draft:", error);
      toast({
        title: "Error",
        description: "Failed to approve draft",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!draft) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("draft_articles")
        .update({
          status: "rejected",
          editor_notes: editorNotes || null,
        })
        .eq("id", draft.id);

      if (error) throw error;

      toast({
        title: "Article Rejected",
        description: "The draft has been rejected.",
      });

      navigate("/admin/drafts");
    } catch (error) {
      console.error("Error rejecting draft:", error);
      toast({
        title: "Error",
        description: "Failed to reject draft",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!draft) {
    return (
      <AdminLayout>
        <div className="text-center py-24">
          <p className="text-muted-foreground">Draft not found</p>
          <Button variant="link" onClick={() => navigate("/admin/drafts")}>
            Back to drafts
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/drafts")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{draft.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline">
                {draft.region?.name ?? "Unknown Region"}
              </Badge>
              <Badge variant="outline" className={statusColors[draft.status]}>
                {draft.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Original Source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Original Source</CardTitle>
              <CardDescription>
                {draft.source_article?.source_name ?? "Unknown Source"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Original Title
                </Label>
                <p className="font-medium mt-1">
                  {draft.source_article?.title ?? "—"}
                </p>
              </div>
              
              {draft.source_article?.source_url && (
                <a
                  href={draft.source_article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                >
                  View original <ExternalLink className="h-3 w-3" />
                </a>
              )}

              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Raw Content
                </Label>
                <div className="mt-2 p-4 bg-muted rounded-lg max-h-[400px] overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap text-foreground/80">
                    {draft.source_article?.raw_content || "No content available"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: AI Draft */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI-Generated Draft</CardTitle>
              <CardDescription>
                Rewritten for OCTG Marketing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.hero_image_url && (
                <img
                  src={draft.hero_image_url}
                  alt={draft.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Excerpt
                </Label>
                <p className="mt-1 text-foreground/80">
                  {draft.excerpt || "—"}
                </p>
              </div>

              {draft.tags && Array.isArray(draft.tags) && draft.tags.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                    Tags
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {draft.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Article Body
                </Label>
                <div className="mt-2 p-4 bg-muted rounded-lg max-h-[400px] overflow-y-auto">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {draft.body_markdown?.split("\n").map((para, i) => (
                      <p key={i} className="text-sm text-foreground/80 mb-2">
                        {para}
                      </p>
                    )) || "No content available"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editor Notes & Actions */}
        {draft.status === "pending_review" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Editorial Decision</CardTitle>
              <CardDescription>
                Add notes and approve or reject this draft
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Editor Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this article..."
                  value={editorNotes}
                  onChange={(e) => setEditorNotes(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve & Publish
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={submitting}
                  variant="destructive"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing editor notes for approved/rejected */}
        {draft.status !== "pending_review" && draft.editor_notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Editor Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">{draft.editor_notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default DraftDetail;