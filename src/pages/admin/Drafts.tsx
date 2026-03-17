import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, Eye, RefreshCw, AlertTriangle, CheckCircle, Wrench } from "lucide-react";
import { useFixArticleEndings } from "@/hooks/usePipeline";
import { format } from "date-fns";
import { SEOIndicator, isTitleValid, isDescriptionValid } from "@/components/admin/SEOIndicator";

interface DraftArticle {
  id: string;
  source_article_id: string | null;
  region_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  created_at: string;
  region?: { name: string } | null;
}

const Drafts = () => {
  const [drafts, setDrafts] = useState<DraftArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const fixEndings = useFixArticleEndings();
  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("draft_articles")
        .select(`
          *,
          region:regions(name)
        `)
        .eq("status", "pending_review")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setDrafts(data as DraftArticle[]);
    } catch (error) {
      console.error("Error fetching drafts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const seoOptimizedCount = drafts.filter(d => 
    isTitleValid(d.title) && isDescriptionValid(d.excerpt)
  ).length;
  const needsSeoCount = drafts.length - seoOptimizedCount;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Draft Review</h1>
            <p className="text-muted-foreground mt-1">
              AI-generated articles awaiting approval
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => fixEndings.mutate({ table: 'both', dryRun: false })} 
              variant="outline" 
              disabled={fixEndings.isPending}
            >
              <Wrench className={`h-4 w-4 mr-2 ${fixEndings.isPending ? "animate-spin" : ""}`} />
              {fixEndings.isPending ? "Fixing..." : "Fix Conclusion Headers"}
            </Button>
            <Button onClick={fetchDrafts} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-base py-1 px-3">
            {drafts.length} pending
          </Badge>
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-base py-1 px-3">
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            {seoOptimizedCount} SEO optimized
          </Badge>
          {needsSeoCount > 0 && (
            <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-base py-1 px-3">
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              {needsSeoCount} need SEO
            </Badge>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>AI Drafts</CardTitle>
            <CardDescription>
              Review and approve articles before publishing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No drafts yet. Process source articles to generate AI drafts.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-center w-16">T</TableHead>
                    <TableHead className="text-center w-16">D</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.map((draft) => (
                    <TableRow key={draft.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {draft.region?.name ?? "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate font-medium">
                        {draft.title}
                      </TableCell>
                      <TableCell className="text-center">
                        <SEOIndicator
                          length={draft.title.length}
                          min={35}
                          max={60}
                          label="Title length"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <SEOIndicator
                          length={draft.excerpt?.length || 0}
                          min={120}
                          max={155}
                          label="Description length"
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(draft.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/admin/drafts/${draft.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Drafts;