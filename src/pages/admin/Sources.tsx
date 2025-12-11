import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ExternalLink, Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface SourceArticle {
  id: string;
  region_id: string | null;
  source_url: string;
  source_name: string;
  title: string;
  raw_content: string | null;
  image_url: string | null;
  scraped_at: string;
  status: "new" | "processed" | "failed";
  region?: { name: string } | null;
}

const statusColors = {
  new: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  processed: "bg-green-500/20 text-green-500 border-green-500/30",
  failed: "bg-red-500/20 text-red-500 border-red-500/30",
};

const Sources = () => {
  const [sources, setSources] = useState<SourceArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<SourceArticle | null>(null);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("source_articles")
        .select(`
          *,
          region:regions(name)
        `)
        .order("scraped_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setSources(data as SourceArticle[]);
    } catch (error) {
      console.error("Error fetching sources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Source Queue</h1>
            <p className="text-muted-foreground mt-1">
              Raw scraped articles from news sources
            </p>
          </div>
          <Button onClick={fetchSources} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Scraped Articles</CardTitle>
            <CardDescription>
              {sources.length} articles in queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No source articles yet. Run the scraper to collect news.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead className="max-w-md">Title</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Scraped</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {source.region?.name ?? "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate font-medium">
                        {source.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {source.source_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(source.scraped_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={statusColors[source.status]}
                        >
                          {source.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedSource(source)}
                            aria-label="View source details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <a
                            href={source.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="ghost" aria-label="Open original source">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={!!selectedSource} onOpenChange={() => setSelectedSource(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedSource?.title}</DialogTitle>
              <DialogDescription>
                From {selectedSource?.source_name} • {selectedSource?.region?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedSource?.image_url && (
                <img
                  src={selectedSource.image_url}
                  alt={selectedSource.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusColors[selectedSource?.status ?? "new"]}>
                  {selectedSource?.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Scraped {selectedSource?.scraped_at && format(new Date(selectedSource.scraped_at), "PPp")}
                </span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-foreground/80">
                  {selectedSource?.raw_content || "No content available"}
                </p>
              </div>
              <a
                href={selectedSource?.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                View original article <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Sources;