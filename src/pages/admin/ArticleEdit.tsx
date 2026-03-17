import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CompanyTagSelector } from "@/components/admin/CompanyTagSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Trash2,
  Upload,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Eye,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { marked } from "marked";
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
import { ContentGallery } from "@/components/admin/ContentGallery";

// Author assignment based on region (per memory: features/article-author-regional-assignment-strategy)
const REGION_AUTHOR_MAP: Record<string, string> = {
  'americas': 'bfc3c93c-25b5-4d3c-b29e-697022214856', // Maria Oliveira
  'europe': '828baef1-ceb9-4513-98e8-50b4fe9ac732',   // Franklin Clarke
  'australia': '828baef1-ceb9-4513-98e8-50b4fe9ac732', // Franklin Clarke
  'africa': '828baef1-ceb9-4513-98e8-50b4fe9ac732',   // Franklin Clarke
  'middle-east': '83af1633-e44b-4d8a-9282-5a6f40840a67', // Oliver Duncan
  'asia-pacific': '83af1633-e44b-4d8a-9282-5a6f40840a67', // Oliver Duncan
};

const getAuthorIdByRegion = (regionId: string | null, regions: { id: string; slug: string }[] | undefined): string | null => {
  if (!regionId || !regions) return null;
  const region = regions.find(r => r.id === regionId);
  if (!region) return null;
  return REGION_AUTHOR_MAP[region.slug] || null;
};

const ArticleEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    subtitle: "",
    body: "",
    status: "draft" as "draft" | "published" | "featured",
    region_id: "",
    hero_image_url: "",
    event_id: "" as string | null,
  });
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isDroppingImage, setIsDroppingImage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch article
  const { data: article, isLoading } = useQuery({
    queryKey: ["article", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  // Fetch article topics
  const { data: articleTopics } = useQuery({
    queryKey: ["article-topics", id],
    queryFn: async () => {
      if (isNew) return [];
      const { data, error } = await supabase
        .from("article_topics")
        .select("topic_id")
        .eq("article_id", id);
      if (error) throw error;
      return data.map((t) => t.topic_id);
    },
    enabled: !isNew,
  });

  // Fetch article companies
  const { data: articleCompanies } = useQuery({
    queryKey: ["article-companies", id],
    queryFn: async () => {
      if (isNew) return [];
      const { data, error } = await supabase
        .from("article_companies")
        .select("company_id")
        .eq("article_id", id);
      if (error) throw error;
      return data.map((c) => c.company_id);
    },
    enabled: !isNew,
  });

  // Fetch source article info via draft_articles linkage
  const { data: sourceInfo } = useQuery({
    queryKey: ["article-source", article?.slug],
    queryFn: async () => {
      if (!article?.slug) return null;
      
      // Find draft article that matches this article's slug
      const { data: draft, error: draftError } = await supabase
        .from("draft_articles")
        .select(`
          id,
          source_article_id,
          source_articles(
            id,
            source_url,
            source_name,
            title
          )
        `)
        .eq("slug", article.slug)
        .maybeSingle();
      
      if (draftError || !draft?.source_articles) return null;
      return draft.source_articles as {
        id: string;
        source_url: string;
        source_name: string;
        title: string;
      };
    },
    enabled: !!article?.slug,
  });

  // Fetch regions, topics, companies, events
  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("regions").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events-for-select", formData.event_id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("events")
        .select("id, name, start_date")
        .or(`start_date.gte.${today}${formData.event_id ? `,id.eq.${formData.event_id}` : ''}`)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: topics } = useQuery({
    queryKey: ["topics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("topics").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Populate form when article loads
  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || "",
        slug: article.slug || "",
        subtitle: article.subtitle || "",
        body: article.body || "",
        status: article.status || "draft",
        region_id: article.region_id || "",
        hero_image_url: article.hero_image_url || "",
        event_id: (article as any).event_id || null,
      });
    }
  }, [article]);

  useEffect(() => {
    if (articleTopics) setSelectedTopics(articleTopics);
  }, [articleTopics]);

  useEffect(() => {
    if (articleCompanies) setSelectedCompanies(articleCompanies);
  }, [articleCompanies]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Auto-assign author based on region if article doesn't have one
      const authorId = article?.author_id || getAuthorIdByRegion(formData.region_id, regions);
      
      const articleData = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        subtitle: formData.subtitle || null,
        body: formData.body || null,
        status: formData.status,
        region_id: formData.region_id || null,
        hero_image_url: formData.hero_image_url || null,
        author_id: authorId,
        publish_date: formData.status !== "draft" ? new Date().toISOString() : null,
        event_id: formData.event_id || null,
      };

      let articleId = id;

      if (isNew) {
        const { data, error } = await supabase
          .from("articles")
          .insert(articleData)
          .select()
          .single();
        if (error) throw error;
        articleId = data.id;
      } else {
        const { error } = await supabase
          .from("articles")
          .update(articleData)
          .eq("id", id);
        if (error) throw error;
      }

      // Update topics
      await supabase.from("article_topics").delete().eq("article_id", articleId);
      if (selectedTopics.length > 0) {
        await supabase.from("article_topics").insert(
          selectedTopics.map((topic_id) => ({ article_id: articleId, topic_id }))
        );
      }

      // Update companies
      await supabase.from("article_companies").delete().eq("article_id", articleId);
      if (selectedCompanies.length > 0) {
        await supabase.from("article_companies").insert(
          selectedCompanies.map((company_id) => ({ article_id: articleId, company_id }))
        );
      }

      return articleId;
    },
    onSuccess: (articleId) => {
      toast.success("Article saved");
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      
      // Ping IndexNow for faster Google indexation (non-blocking, only for published)
      if (formData.status === "published") {
        supabase.functions.invoke("index-now", {
          body: { articleSlug: formData.slug }
        }).catch(err => console.error("[IndexNow] Failed:", err));
      }
      
      if (isNew) {
        navigate(`/admin/articles/${articleId}`);
      }
    },
    onError: (error) => {
      toast.error("Failed to save article: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Article deleted");
      navigate("/admin/articles");
    },
    onError: () => {
      toast.error("Failed to delete article");
    },
  });

  // Image upload - uses Bunny CDN via edge function
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.functions.invoke('upload-image', {
          body: { 
            imageBase64: base64, 
            fileName, 
            folder: `octgindex/articles/${id || 'manual'}` 
          },
        });

        if (error) throw error;
        
        setFormData((prev) => ({ ...prev, hero_image_url: data.cdnUrl }));
        toast.success("Image uploaded to CDN");
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload image");
      setIsUploading(false);
    }
  };

  // Generate AI image
  const handleGenerateImage = async () => {
    if (!formData.title || !formData.body) {
      toast.error("Please add title and content first");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-featured-image", {
        body: {
          title: formData.title,
          body: formData.body.substring(0, 2000),
          draftId: id || "new-article",
        },
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setFormData((prev) => ({ ...prev, hero_image_url: data.imageUrl }));
        toast.success("Image generated");
      }
    } catch (error) {
      toast.error("Failed to generate image");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Toggle topic
  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };


  // Handle drop on textarea
  const handleContentDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const isGalleryImage = e.dataTransfer.getData("application/x-gallery-image");
    const imageUrl = e.dataTransfer.getData("text/plain");
    
    if (isGalleryImage && imageUrl) {
      e.preventDefault();
      
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart || 0;
      const textBefore = formData.body.substring(0, cursorPos);
      const textAfter = formData.body.substring(cursorPos);
      const markdown = `\n![Image](${imageUrl})\n`;

      setFormData((prev) => ({
        ...prev,
        body: textBefore + markdown + textAfter,
      }));

      setIsDroppingImage(false);
      toast.success("Image inserted into content");
    }
  };

  const handleContentDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const isGalleryImage = e.dataTransfer.types.includes("application/x-gallery-image");
    if (isGalleryImage) {
      e.preventDefault();
      setIsDroppingImage(true);
    }
  };

  const handleContentDragLeave = () => {
    setIsDroppingImage(false);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin/articles">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isNew ? "New Article" : "Edit Article"}
              </h1>
              {!isNew && (
                <a
                  href={`/article/${formData.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  View live <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!isNew && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Article</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this article? This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Title & Slug */}
            <Card>
              <CardHeader>
                <CardTitle>Article Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                        slug: isNew ? generateSlug(e.target.value) : prev.slug,
                      }))
                    }
                    placeholder="Article title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="article-url-slug"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle / Excerpt</Label>
                  <Textarea
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                    placeholder="Brief description for previews and SEO"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Content (Markdown)</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="edit">
                  <TabsList className="mb-4">
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit">
                    <Textarea
                      ref={textareaRef}
                      value={formData.body}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, body: e.target.value }))
                      }
                      onDrop={handleContentDrop}
                      onDragOver={handleContentDragOver}
                      onDragLeave={handleContentDragLeave}
                      placeholder="Write your article content in markdown... Drag images from the gallery below!"
                      className={`min-h-[400px] font-mono text-sm transition-colors ${
                        isDroppingImage ? "border-primary border-2 bg-primary/5" : ""
                      }`}
                    />
                  </TabsContent>
                  <TabsContent value="preview">
                    <div
                      className="prose prose-invert max-w-none min-h-[400px] p-4 border rounded-md bg-muted/30"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(formData.body || "*No content yet*", { async: false }) as string,
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.status}
                  onValueChange={(value: "draft" | "published" | "featured") =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Source Reference */}
            {sourceInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Source Reference
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                      Source
                    </Label>
                    <p className="text-sm font-medium mt-1">
                      {sourceInfo.source_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                      Original Title
                    </Label>
                    <p className="text-sm mt-1 text-muted-foreground line-clamp-2">
                      {sourceInfo.title}
                    </p>
                  </div>
                  <a
                    href={sourceInfo.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    View original article
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.hero_image_url ? (
                  <div className="relative">
                    <img
                      src={formData.hero_image_url}
                      alt="Featured"
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, hero_image_url: "" }))
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={isUploading}
                    onClick={() => document.getElementById("image-upload")?.click()}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={isGeneratingImage}
                    onClick={handleGenerateImage}
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate
                  </Button>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </CardContent>
            </Card>

            {/* Content Gallery */}
            {!isNew && id && (
              <ContentGallery articleId={id} />
            )}

            {/* Region */}
            <Card>
              <CardHeader>
                <CardTitle>Region</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.region_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, region_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions?.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Related Event */}
            <Card>
              <CardHeader>
                <CardTitle>Related Event</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.event_id || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, event_id: value === "none" ? null : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No event</SelectItem>
                    {events?.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Topics */}
            <Card>
              <CardHeader>
                <CardTitle>Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {topics?.map((topic) => (
                    <div key={topic.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`topic-${topic.id}`}
                        checked={selectedTopics.includes(topic.id)}
                        onCheckedChange={() => toggleTopic(topic.id)}
                      />
                      <label
                        htmlFor={`topic-${topic.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {topic.name}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Companies */}
            <Card>
              <CardHeader>
                <CardTitle>Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <CompanyTagSelector
                  companies={companies || []}
                  selectedIds={selectedCompanies}
                  onChange={setSelectedCompanies}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ArticleEdit;
