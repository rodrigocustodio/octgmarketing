import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, Plus, Pencil, Trash2, Globe, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface ScrapeSource {
  id: string;
  name: string;
  url: string;
  region: string;
  category: string;
  source_type: string;
  is_active: boolean;
  priority: number;
  last_scraped_at: string | null;
  articles_found: number;
  created_at: string;
}

const REGIONS = ["Global", "Americas", "Europe", "Asia-Pacific", "Middle East", "Africa"];
const CATEGORIES = [
  "Mills & Manufacturing",
  "E&P",
  "Rigs & Drilling",
  "Drilling Contractors",
  "Offshore Rigs",
  "Oilfield Services",
  "Industry Media",
  "Steel & Pricing",
  "Logistics & Ports",
  "Regulatory",
  "Regional News",
];

export default function SourcesConfig() {
  const [sources, setSources] = useState<ScrapeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<ScrapeSource | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    region: "Global",
    category: "Industry Media",
    priority: 50,
  });

  const fetchSources = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scrape_sources")
      .select("*")
      .order("priority", { ascending: true });

    if (error) {
      toast.error("Failed to fetch sources");
      console.error(error);
    } else {
      setSources(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleToggleActive = async (source: ScrapeSource) => {
    const { error } = await supabase
      .from("scrape_sources")
      .update({ is_active: !source.is_active })
      .eq("id", source.id);

    if (error) {
      toast.error("Failed to update source");
    } else {
      toast.success(`Source ${source.is_active ? "disabled" : "enabled"}`);
      fetchSources();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSource) {
      const { error } = await supabase
        .from("scrape_sources")
        .update({
          name: formData.name,
          url: formData.url,
          region: formData.region,
          category: formData.category,
          priority: formData.priority,
        })
        .eq("id", editingSource.id);

      if (error) {
        toast.error("Failed to update source");
      } else {
        toast.success("Source updated");
        setEditingSource(null);
        setIsAddDialogOpen(false);
        fetchSources();
      }
    } else {
      const { error } = await supabase
        .from("scrape_sources")
        .insert({
          name: formData.name,
          url: formData.url,
          region: formData.region,
          category: formData.category,
          priority: formData.priority,
          source_type: "HTML",
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("This URL already exists");
        } else {
          toast.error("Failed to add source");
        }
      } else {
        toast.success("Source added");
        setIsAddDialogOpen(false);
        resetForm();
        fetchSources();
      }
    }
  };

  const handleDelete = async (source: ScrapeSource) => {
    if (!confirm(`Delete "${source.name}"?`)) return;

    const { error } = await supabase
      .from("scrape_sources")
      .delete()
      .eq("id", source.id);

    if (error) {
      toast.error("Failed to delete source");
    } else {
      toast.success("Source deleted");
      fetchSources();
    }
  };

  const handleEdit = (source: ScrapeSource) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      url: source.url,
      region: source.region,
      category: source.category,
      priority: source.priority,
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      url: "",
      region: "Global",
      category: "Industry Media",
      priority: 50,
    });
    setEditingSource(null);
  };

  const regionColors: Record<string, string> = {
    Global: "bg-muted text-muted-foreground",
    Americas: "bg-blue-500/20 text-blue-400",
    Europe: "bg-green-500/20 text-green-400",
    "Asia-Pacific": "bg-purple-500/20 text-purple-400",
    "Middle East": "bg-amber-500/20 text-amber-400",
    Africa: "bg-orange-500/20 text-orange-400",
  };

  return (
    <AdminLayout>
      <Helmet><title>Sources Config | OCTG Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Source Configuration</h1>
            <p className="text-muted-foreground">
              Manage news sources for the OCTG scraper ({sources.length} sources)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchSources} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSource ? "Edit Source" : "Add New Source"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Source Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Tenaris Newsroom"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://example.com/news/"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Region</Label>
                      <Select
                        value={formData.region}
                        onValueChange={(value) => setFormData({ ...formData, region: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority (lower = higher priority)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min={1}
                      max={100}
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 50 })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingSource ? "Update" : "Add"} Source
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              News Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading sources...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Active</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Priority</TableHead>
                    <TableHead>Last Scraped</TableHead>
                    <TableHead className="text-center">Found</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((source) => (
                    <TableRow key={source.id} className={!source.is_active ? "opacity-50" : ""}>
                      <TableCell>
                        <Switch
                          checked={source.is_active}
                          onCheckedChange={() => handleToggleActive(source)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{source.name}</div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          {source.url.replace(/^https?:\/\//, "").slice(0, 40)}...
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={regionColors[source.region] || ""}>
                          {source.region}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{source.category}</TableCell>
                      <TableCell className="text-center text-sm">{source.priority}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {source.last_scraped_at
                          ? format(new Date(source.last_scraped_at), "MMM d, HH:mm")
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-center text-sm">{source.articles_found}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(source)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(source)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
}