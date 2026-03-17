import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Edit, Trash2, Plus, FileText, Star, Eye, Sparkles, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

const SEOIndicator = ({ length, min, max, label }: { length: number; min: number; max: number; label: string }) => {
  const isValid = length >= min && length <= max;
  const isTooShort = length < min;
  const isTooLong = length > max;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`text-xs px-1.5 py-0.5 rounded font-mono ${
            isValid 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/20 text-rose-400'
          }`}>
            {length}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}: {length} chars</p>
          <p className="text-muted-foreground">
            {isValid && "✓ SEO optimal"}
            {isTooShort && `↓ Too short (min ${min})`}
            {isTooLong && `↑ Too long (max ${max})`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const Articles = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: articles, isLoading, refetch } = useQuery({
    queryKey: ["admin-articles", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select(`
          *,
          region:regions(name, slug)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "draft" | "published" | "featured");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/optimize-article-seo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ articleId, mode: 'single' }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to optimize');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      const result = data.results?.[0];
      if (result?.titleChange || result?.subtitleChange) {
        toast.success("Article SEO optimized");
      } else {
        toast.info("Article already optimized");
      }
    },
    onError: (error) => {
      toast.error(`Optimization failed: ${error.message}`);
    },
  });

  const bulkOptimizeMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Get articles needing optimization
      const needsOptimization = articles?.filter(a => 
        a.title.length > 60 || 
        !a.subtitle || 
        (a.subtitle && (a.subtitle.length < 120 || a.subtitle.length > 155))
      ) || [];

      if (needsOptimization.length === 0) {
        return { message: 'All articles already optimized', results: [] };
      }

      const results = [];
      setBulkProgress({ current: 0, total: needsOptimization.length, name: '' });

      for (let i = 0; i < needsOptimization.length; i++) {
        const article = needsOptimization[i];
        setBulkProgress({ 
          current: i + 1, 
          total: needsOptimization.length, 
          name: article.title.substring(0, 40) + '...'
        });

        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/optimize-article-seo`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ articleId: article.id, mode: 'single' }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            results.push(data.results?.[0]);
          }
        } catch (err) {
          console.error(`Error optimizing ${article.id}:`, err);
        }

        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setBulkProgress(null);
      return { results };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      const changedCount = data.results?.filter((r: any) => r?.titleChange || r?.subtitleChange).length || 0;
      toast.success(`Bulk optimization complete: ${changedCount} articles updated`);
    },
    onError: (error) => {
      setBulkProgress(null);
      toast.error(`Bulk optimization failed: ${error.message}`);
    },
  });

  const filteredArticles = articles?.filter((article) =>
    article.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete article");
    } else {
      toast.success("Article deleted");
      refetch();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "featured":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Star className="h-3 w-3 mr-1" />Featured</Badge>;
      case "published":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><Eye className="h-3 w-3 mr-1" />Published</Badge>;
      default:
        return <Badge variant="secondary"><FileText className="h-3 w-3 mr-1" />Draft</Badge>;
    }
  };

  const getSEOStatus = (article: { title: string; subtitle: string | null }) => {
    const titleOk = article.title.length <= 60;
    const subtitleOk = article.subtitle && article.subtitle.length >= 120 && article.subtitle.length <= 155;
    return titleOk && subtitleOk;
  };

  const stats = {
    total: articles?.length || 0,
    featured: articles?.filter((a) => a.status === "featured").length || 0,
    published: articles?.filter((a) => a.status === "published").length || 0,
    draft: articles?.filter((a) => a.status === "draft").length || 0,
    seoOptimized: articles?.filter(a => getSEOStatus(a)).length || 0,
    needsOptimization: articles?.filter(a => !getSEOStatus(a)).length || 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Articles</h1>
            <p className="text-muted-foreground">Manage published articles</p>
          </div>
          <div className="flex gap-2">
            {stats.needsOptimization > 0 && (
              <Button 
                variant="outline" 
                onClick={() => bulkOptimizeMutation.mutate()}
                disabled={bulkOptimizeMutation.isPending}
              >
                {bulkOptimizeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Optimize All ({stats.needsOptimization})
              </Button>
            )}
            <Button asChild>
              <Link to="/admin/articles/new">
                <Plus className="h-4 w-4 mr-2" />
                New Article
              </Link>
            </Button>
          </div>
        </div>

        {/* Bulk Progress */}
        {bulkProgress && (
          <Card className="border-accent/50 bg-accent/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Optimizing: {bulkProgress.name}</span>
                    <span>{bulkProgress.current}/{bulkProgress.total}</span>
                  </div>
                  <Progress value={(bulkProgress.current / bulkProgress.total) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-400">Featured</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.featured}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-400">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.published}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-400">SEO ✓</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.seoOptimized}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-rose-400">Needs SEO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.needsOptimization}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Articles Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-20 text-center">Title</TableHead>
                  <TableHead className="w-20 text-center">Desc</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading articles...
                    </TableCell>
                  </TableRow>
                ) : filteredArticles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No articles found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArticles?.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {article.hero_image_url && (
                            <img
                              src={article.hero_image_url}
                              alt=""
                              className="h-10 w-16 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{article.title}</p>
                            <p className="text-xs text-muted-foreground">/{article.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <SEOIndicator 
                          length={article.title.length} 
                          min={35} 
                          max={60} 
                          label="Title length"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <SEOIndicator 
                          length={article.subtitle?.length || 0} 
                          min={120} 
                          max={155} 
                          label="Description length"
                        />
                      </TableCell>
                      <TableCell>
                        {article.region?.name || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(article.status)}</TableCell>
                      <TableCell>
                        {article.publish_date
                          ? format(new Date(article.publish_date), "MMM d, yyyy")
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!getSEOStatus(article) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => optimizeMutation.mutate(article.id)}
                                    disabled={optimizeMutation.isPending}
                                    className="text-accent hover:text-accent"
                                  >
                                    {optimizeMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Optimize SEO</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button variant="ghost" size="icon" asChild aria-label="Edit article">
                            <Link to={`/admin/articles/${article.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete article">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Article</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{article.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(article.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Articles;
