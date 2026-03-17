import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { CompanyTagSelector } from "@/components/admin/CompanyTagSelector";
import EditorialQueueTab from "@/components/admin/EditorialQueueTab";
import { Loader2, Sparkles, Save, Send, Eye, ListOrdered, FileText } from "lucide-react";
import { marked } from "marked";

interface GeneratedArticle {
  title: string;
  excerpt: string;
  body_markdown: string;
  slug: string;
  tags: string[];
  region_id: string | null;
  suggested_topic_ids: string[];
  suggested_company_ids: string[];
}

// Author assignment based on region (per memory: features/article-author-regional-assignment-strategy)
const REGION_AUTHOR_MAP: Record<string, string> = {
  'americas': 'bfc3c93c-25b5-4d3c-b29e-697022214856', // Maria Oliveira
  'europe': '828baef1-ceb9-4513-98e8-50b4fe9ac732',   // Franklin Clarke
  'australia': '828baef1-ceb9-4513-98e8-50b4fe9ac732', // Franklin Clarke
  'africa': '828baef1-ceb9-4513-98e8-50b4fe9ac732',   // Franklin Clarke
  'middle-east': '83af1633-e44b-4d8a-9282-5a6f40840a67', // Oliver Duncan
  'asia-pacific': '83af1633-e44b-4d8a-9282-5a6f40840a67', // Oliver Duncan
};

const getAuthorIdByRegion = (regionId: string | null, regions: { id: string; slug: string }[]): string | null => {
  if (!regionId || !regions) return null;
  const region = regions.find(r => r.id === regionId);
  if (!region) return null;
  return REGION_AUTHOR_MAP[region.slug] || null;
};

export default function CreateArticle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if coming from research
  const fromResearch = searchParams.get('fromResearch') === 'true';
  const [activeTab, setActiveTab] = useState(fromResearch ? "write" : "queue");

  // Form state
  const [rawContent, setRawContent] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  
  // Editable fields after generation
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [slug, setSlug] = useState("");
  const [regionId, setRegionId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [heroImageUrl, setHeroImageUrl] = useState<string | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  // Check sessionStorage for pre-filled data from research
  useEffect(() => {
    if (fromResearch) {
      const stored = sessionStorage.getItem('generatedArticle');
      if (stored) {
        try {
          const data = JSON.parse(stored) as GeneratedArticle;
          setGeneratedArticle(data);
          setTitle(data.title);
          setExcerpt(data.excerpt);
          setBodyMarkdown(data.body_markdown);
          setSlug(data.slug);
          setRegionId(data.region_id);
          setSelectedTopicIds(data.suggested_topic_ids || []);
          setSelectedCompanyIds([]); // Manual selection only
          sessionStorage.removeItem('generatedArticle');
        } catch (e) {
          console.error('Failed to parse stored article:', e);
        }
      }
    }
  }, [fromResearch]);

  // Fetch regions
  const { data: regions = [] } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("regions").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch topics
  const { data: topics = [] } = useQuery({
    queryKey: ["topics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("topics").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch events
  const { data: events = [] } = useQuery({
    queryKey: ["events-for-select"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("events")
        .select("id, name, start_date")
        .gte("start_date", today)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Generate article mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-article-from-content", {
        method: "POST",
        body: { content: rawContent, source_name: sourceName },
      });
      if (error) throw error;
      return data as GeneratedArticle;
    },
    onSuccess: (data) => {
      setGeneratedArticle(data);
      setTitle(data.title);
      setExcerpt(data.excerpt);
      setBodyMarkdown(data.body_markdown);
      setSlug(data.slug);
      setRegionId(data.region_id);
      setSelectedTopicIds(data.suggested_topic_ids || []);
      setSelectedCompanyIds([]); // Manual selection only
      toast({
        title: "Article Generated",
        description: "Review and edit the generated content before publishing.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload image handler
  const handleImageUpload = async (base64: string, fileName: string): Promise<string> => {
    setIsUploading(true);
    try {
      const { data, error } = await supabase.functions.invoke("upload-image", {
        method: "POST",
        body: { imageBase64: base64, fileName, folder: "octgindex/articles/manual" },
      });
      if (error) throw error;
      return data.cdnUrl;
    } finally {
      setIsUploading(false);
    }
  };

  // Publish article mutation
  const publishMutation = useMutation({
    mutationFn: async (status: "draft" | "published") => {
      // Auto-assign author based on region
      const authorId = getAuthorIdByRegion(regionId, regions);
      
      // Insert article
      const { data: article, error: articleError } = await supabase
        .from("articles")
        .insert({
          title,
          subtitle: excerpt,
          body: bodyMarkdown,
          slug,
          region_id: regionId,
          author_id: authorId,
          hero_image_url: heroImageUrl,
          status,
          publish_date: status === "published" ? new Date().toISOString() : null,
          event_id: eventId,
        })
        .select("id")
        .single();

      if (articleError) throw articleError;

      // Insert topic relationships
      if (selectedTopicIds.length > 0) {
        const topicRelations = selectedTopicIds.map((topicId) => ({
          article_id: article.id,
          topic_id: topicId,
        }));
        const { error: topicsError } = await supabase
          .from("article_topics")
          .insert(topicRelations);
        if (topicsError) console.error("Failed to insert topics:", topicsError);
      }

      // Insert company relationships
      if (selectedCompanyIds.length > 0) {
        const companyRelations = selectedCompanyIds.map((companyId) => ({
          article_id: article.id,
          company_id: companyId,
        }));
        const { error: companiesError } = await supabase
          .from("article_companies")
          .insert(companyRelations);
        if (companiesError) console.error("Failed to insert companies:", companiesError);
      }

      return article;
    },
    onSuccess: (article, status) => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: status === "published" ? "Article Published" : "Draft Saved",
        description: status === "published" 
          ? "Your article is now live on the site." 
          : "Your article has been saved as a draft.",
      });
      
      // Ping IndexNow for faster Google indexation (non-blocking, only for published)
      if (status === "published") {
        supabase.functions.invoke("index-now", {
          body: { articleSlug: slug }
        }).catch(err => console.error("[IndexNow] Failed:", err));
      }
      
      navigate("/admin/articles");
    },
    onError: (error) => {
      toast({
        title: "Failed to Save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };


  const renderMarkdown = (markdown: string) => {
    return { __html: marked.parse(markdown, { async: false }) as string };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create Article</h1>
          <p className="text-muted-foreground">
            Use the Editorial Queue for AI-guided opportunities or paste content directly
          </p>
        </div>

        {!generatedArticle ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="queue" className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4" />
                Editorial Queue
              </TabsTrigger>
              <TabsTrigger value="write" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Write Manually
              </TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="mt-4">
              <EditorialQueueTab />
            </TabsContent>

            <TabsContent value="write" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Source Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="source-name">Source Name (optional)</Label>
                    <Input
                      id="source-name"
                      placeholder="e.g., Press Release from Tenaris"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="raw-content">Content *</Label>
                    <Textarea
                      id="raw-content"
                      placeholder="Paste your source content here (minimum 100 characters)..."
                      value={rawContent}
                      onChange={(e) => setRawContent(e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {rawContent.length} characters
                    </p>
                  </div>
                  <Button
                    onClick={() => generateMutation.mutate()}
                    disabled={rawContent.length < 100 || generateMutation.isPending}
                    className="w-full"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Article...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Article with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          // Step 2: Edit and publish
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content editor */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Article Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div>
                    <Label>Body (Markdown)</Label>
                    <Tabs defaultValue="edit" className="w-full">
                      <TabsList className="mb-2">
                        <TabsTrigger value="edit">Edit</TabsTrigger>
                        <TabsTrigger value="preview">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="edit">
                        <Textarea
                          value={bodyMarkdown}
                          onChange={(e) => setBodyMarkdown(e.target.value)}
                          className="min-h-[400px] font-mono text-sm"
                        />
                      </TabsContent>
                      <TabsContent value="preview">
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none p-4 border rounded-md min-h-[400px] bg-muted/30"
                          dangerouslySetInnerHTML={renderMarkdown(bodyMarkdown)}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Featured Image */}
              <Card>
                <CardHeader>
                  <CardTitle>Featured Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    value={heroImageUrl}
                    onChange={setHeroImageUrl}
                    onUpload={handleImageUpload}
                    isUploading={isUploading}
                  />
                </CardContent>
              </Card>

              {/* Region */}
              <Card>
                <CardHeader>
                  <CardTitle>Region</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={regionId || ""}
                    onValueChange={(value) => setRegionId(value || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
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
                    value={eventId || "none"}
                    onValueChange={(value) => setEventId(value === "none" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No event</SelectItem>
                      {events.map((event) => (
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
                    {topics.map((topic) => (
                      <div key={topic.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`topic-${topic.id}`}
                          checked={selectedTopicIds.includes(topic.id)}
                          onChange={() => handleTopicToggle(topic.id)}
                          className="h-4 w-4 rounded border-border"
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
                    companies={companies}
                    selectedIds={selectedCompanyIds}
                    onChange={setSelectedCompanyIds}
                  />
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => publishMutation.mutate("draft")}
                    disabled={publishMutation.isPending || !title}
                  >
                    {publishMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save as Draft
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => publishMutation.mutate("published")}
                    disabled={publishMutation.isPending || !title || !heroImageUrl}
                  >
                    {publishMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Publish Now
                  </Button>
                  {!heroImageUrl && (
                    <p className="text-xs text-muted-foreground text-center">
                      Upload a featured image to publish
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Start Over */}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setGeneratedArticle(null);
                  setRawContent("");
                  setSourceName("");
                }}
              >
                Start Over
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
