import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRegions, useTopics, useCompanies } from "@/hooks/useArticles";
import { SEOIndicator, isTitleValid, isDescriptionValid } from "@/components/admin/SEOIndicator";
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Globe,
  Tag,
  Building2,
  Search,
  ImageIcon,
  Wand2,
  Undo2,
  Sparkles
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
  suggested_topic_ids: string[] | null;
  suggested_company_ids: string[] | null;
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

// Author assignment based on region (per memory: features/article-author-regional-assignment-strategy)
const REGION_AUTHOR_MAP: Record<string, string> = {
  'americas': 'bfc3c93c-25b5-4d3c-b29e-697022214856', // Maria Oliveira
  'europe': '828baef1-ceb9-4513-98e8-50b4fe9ac732',   // Franklin Clarke
  'australia': '828baef1-ceb9-4513-98e8-50b4fe9ac732', // Franklin Clarke
  'africa': '828baef1-ceb9-4513-98e8-50b4fe9ac732',   // Franklin Clarke
  'middle-east': '83af1633-e44b-4d8a-9282-5a6f40840a67', // Oliver Duncan
  'asia-pacific': '83af1633-e44b-4d8a-9282-5a6f40840a67', // Oliver Duncan
};

const getAuthorIdByRegion = (regionId: string, regions: { id: string; slug: string }[] | undefined): string | null => {
  if (!regions) return null;
  const region = regions.find(r => r.id === regionId);
  if (!region) return null;
  return REGION_AUTHOR_MAP[region.slug] || null;
};

const DraftDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [draft, setDraft] = useState<DraftArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorNotes, setEditorNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Metadata state
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  
  // Featured image state
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<"original" | "ai" | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  
  // SEO optimization state
  const [optimizingSeo, setOptimizingSeo] = useState(false);
  
  // Fetch regions, topics, companies
  const { data: regions } = useRegions();
  const { data: topics } = useTopics();
  const { data: companies } = useCompanies();

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
        setSelectedRegionId(data.region_id || "");
        setCurrentImageUrl(data.hero_image_url || null);
        setImageSource(data.hero_image_url ? "original" : null);
        
        // Auto-populate AI-suggested topics and companies
        setSelectedTopicIds(data.suggested_topic_ids || []);
        setSelectedCompanyIds(data.suggested_company_ids || []);
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

  const handleGenerateImage = async () => {
    if (!draft) return;
    
    setGeneratingImage(true);
    setGeneratedPrompt(null);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("generate-featured-image", {
        body: {
          title: draft.title,
          excerpt: draft.excerpt,
          body: draft.body_markdown,
          draftId: draft.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to generate image");
      }

      const { imageUrl, prompt } = response.data;
      
      setCurrentImageUrl(imageUrl);
      setImageSource("ai");
      setGeneratedPrompt(prompt);
      
      toast({
        title: "Image Generated",
        description: "AI-generated featured image is ready for review.",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Image Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate featured image",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleUseOriginalImage = () => {
    setCurrentImageUrl(draft?.hero_image_url || null);
    setImageSource("original");
    setGeneratedPrompt(null);
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleCompanyToggle = (companyId: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleOptimizeSeo = async () => {
    if (!draft) return;
    
    setOptimizingSeo(true);
    try {
      const response = await supabase.functions.invoke("optimize-article-seo", {
        body: { draftId: draft.id },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to optimize SEO");
      }

      const result = response.data.results?.[0];
      if (result?.status === 'success') {
        // Update local state with optimized values
        setDraft(prev => prev ? {
          ...prev,
          title: result.newTitle,
          excerpt: result.newSubtitle
        } : null);

        toast({
          title: "SEO Optimized",
          description: `Title: ${result.originalTitle.length} → ${result.newTitle.length} chars`,
        });
      } else {
        throw new Error(result?.error || "Optimization failed");
      }
    } catch (error) {
      console.error("Error optimizing SEO:", error);
      toast({
        title: "Optimization Failed",
        description: error instanceof Error ? error.message : "Failed to optimize SEO",
        variant: "destructive",
      });
    } finally {
      setOptimizingSeo(false);
    }
  };

  // Helper to check if URL is already on Bunny CDN
  const isBunnyCdnUrl = (url: string | null): boolean => {
    if (!url) return false;
    return url.includes("tukia-cdn.b-cdn.net") || url.includes("bunnycdn");
  };

  // Helper to upload image to Bunny CDN
  const uploadToBunnyCdn = async (imageUrl: string): Promise<string> => {
    console.log("[DraftDetail] Uploading to Bunny CDN:", imageUrl);
    
    const response = await supabase.functions.invoke("upload-to-bunny", {
      body: {
        imageUrl,
        folder: `octgindex/articles/${draft?.id}`,
      },
    });

    if (response.error) {
      throw new Error(response.error.message || "Failed to upload to Bunny CDN");
    }

    console.log("[DraftDetail] Bunny CDN upload success:", response.data.cdnUrl);
    return response.data.cdnUrl;
  };

  const handleApprove = async () => {
    if (!draft) return;
    
    if (!selectedRegionId) {
      toast({
        title: "Region Required",
        description: "Please select a region before approving.",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    try {
      // Check if image needs to be uploaded to Bunny CDN
      let finalImageUrl = currentImageUrl;
      
      if (currentImageUrl && !isBunnyCdnUrl(currentImageUrl)) {
        toast({
          title: "Uploading Image",
          description: "Copying image to CDN for reliable social sharing...",
        });
        
        try {
          finalImageUrl = await uploadToBunnyCdn(currentImageUrl);
        } catch (uploadError) {
          console.error("[DraftDetail] CDN upload failed, using original URL:", uploadError);
          // Continue with original URL if CDN upload fails
        }
      }

      // Update draft status and image
      const { error: draftError } = await supabase
        .from("draft_articles")
        .update({
          status: "approved",
          editor_notes: editorNotes || null,
          region_id: selectedRegionId,
          hero_image_url: finalImageUrl,
        })
        .eq("id", draft.id);

      if (draftError) throw draftError;

      // Create new article in main articles table with the CDN image
      // Auto-assign author based on region
      const authorId = getAuthorIdByRegion(selectedRegionId, regions);
      
      const { data: newArticle, error: articleError } = await supabase
        .from("articles")
        .insert({
          title: draft.title,
          slug: draft.slug,
          subtitle: draft.excerpt,
          body: draft.body_markdown,
          hero_image_url: finalImageUrl,
          region_id: selectedRegionId,
          author_id: authorId,
          status: "published",
          publish_date: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (articleError) throw articleError;

      // Insert article_topics links
      if (selectedTopicIds.length > 0 && newArticle) {
        const topicLinks = selectedTopicIds.map((topicId) => ({
          article_id: newArticle.id,
          topic_id: topicId,
        }));
        
        const { error: topicsError } = await supabase
          .from("article_topics")
          .insert(topicLinks);
        
        if (topicsError) {
          console.error("Error linking topics:", topicsError);
        }
      }

      // Insert article_companies links
      if (selectedCompanyIds.length > 0 && newArticle) {
        const companyLinks = selectedCompanyIds.map((companyId) => ({
          article_id: newArticle.id,
          company_id: companyId,
        }));
        
        const { error: companiesError } = await supabase
          .from("article_companies")
          .insert(companyLinks);
        
        if (companiesError) {
          console.error("Error linking companies:", companiesError);
        }
      }

      // Delete the draft after successful publish
      const { error: deleteError } = await supabase
        .from("draft_articles")
        .delete()
        .eq("id", draft.id);

      if (deleteError) {
        console.error("Error deleting draft:", deleteError);
      }

      toast({
        title: "Article Published",
        description: "The article is now live and the draft has been removed.",
      });

      // Ping IndexNow for faster Google indexation (non-blocking)
      supabase.functions.invoke("index-now", {
        body: { articleSlug: draft.slug }
      }).then(res => {
        if (res.data?.success) {
          console.log("[IndexNow] Submitted:", draft.slug);
        }
      }).catch(err => {
        console.error("[IndexNow] Failed:", err);
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
      // Delete the draft instead of just updating status
      const { error } = await supabase
        .from("draft_articles")
        .delete()
        .eq("id", draft.id);

      if (error) throw error;

      toast({
        title: "Draft Deleted",
        description: "The draft has been removed.",
      });

      navigate("/admin/drafts");
    } catch (error) {
      console.error("Error deleting draft:", error);
      toast({
        title: "Error",
        description: "Failed to delete draft",
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
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">AI-Generated Draft</CardTitle>
                <CardDescription>
                  Rewritten for OCTG Index
                </CardDescription>
              </div>
              {draft.status === "pending_review" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOptimizeSeo}
                  disabled={optimizingSeo || (isTitleValid(draft.title) && isDescriptionValid(draft.excerpt))}
                >
                  {optimizingSeo ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1.5" />
                  )}
                  Optimize SEO
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.hero_image_url && (
                <img
                  src={draft.hero_image_url}
                  alt={draft.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              {/* Title with SEO indicator */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                    Title
                  </Label>
                  <SEOIndicator
                    length={draft.title.length}
                    min={35}
                    max={60}
                    label="Title length"
                  />
                </div>
                <p className="font-medium text-foreground">
                  {draft.title}
                </p>
              </div>

              {/* Excerpt with SEO indicator */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                    Excerpt (Meta Description)
                  </Label>
                  <SEOIndicator
                    length={draft.excerpt?.length || 0}
                    min={120}
                    max={155}
                    label="Description length"
                  />
                </div>
                <p className="text-foreground/80">
                  {draft.excerpt || "—"}
                </p>
              </div>

              {draft.tags && Array.isArray(draft.tags) && draft.tags.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                    AI-Suggested Tags
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

        {/* Featured Image Section - Only show for pending drafts */}
        {draft.status === "pending_review" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Featured Image
              </CardTitle>
              <CardDescription>
                Generate an AI image or keep the original source image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Image Preview */}
              <div className="relative">
                {currentImageUrl ? (
                  <img
                    src={currentImageUrl}
                    alt="Featured image preview"
                    className="w-full h-64 object-cover rounded-lg border border-border"
                  />
                ) : (
                  <div className="w-full h-64 bg-muted rounded-lg border border-dashed border-border flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No featured image</p>
                  </div>
                )}
                {imageSource && (
                  <Badge 
                    className={`absolute top-3 right-3 ${
                      imageSource === "ai" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {imageSource === "ai" ? "AI Generated" : "Original"}
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleGenerateImage}
                  disabled={generatingImage}
                  variant="default"
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Featured Image
                    </>
                  )}
                </Button>

                {draft.hero_image_url && imageSource !== "original" && (
                  <Button variant="outline" onClick={handleUseOriginalImage}>
                    <Undo2 className="h-4 w-4 mr-2" />
                    Use Original Image
                  </Button>
                )}
              </div>

              {/* AI Prompt Preview */}
              {generatedPrompt && (
                <div className="p-3 bg-muted rounded-lg border border-border">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    AI Prompt Used
                  </Label>
                  <p className="text-sm mt-1 text-foreground/80">{generatedPrompt}</p>
                </div>
              )}

              {generatingImage && (
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Analyzing article content and generating realistic editorial photograph...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This may take 15-30 seconds
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Metadata Editor - Only show for pending drafts */}
        {draft.status === "pending_review" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Article Metadata & SEO
              </CardTitle>
              <CardDescription>
                Set region, topics, and companies for categorization and SEO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Region Selector */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Region <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedRegionId}
                  onValueChange={setSelectedRegionId}
                >
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions?.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Topics Multi-select */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Topics
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {topics?.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`topic-${topic.id}`}
                        checked={selectedTopicIds.includes(topic.id)}
                        onCheckedChange={() => handleTopicToggle(topic.id)}
                      />
                      <label
                        htmlFor={`topic-${topic.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {topic.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Companies Multi-select */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Companies Mentioned
                </Label>
                {companies && companies.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-40 overflow-y-auto p-2 bg-muted/50 rounded-lg">
                    {companies.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`company-${company.id}`}
                          checked={selectedCompanyIds.includes(company.id)}
                          onCheckedChange={() => handleCompanyToggle(company.id)}
                        />
                        <label
                          htmlFor={`company-${company.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {company.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No companies in database yet. Add companies via the database.
                  </p>
                )}
              </div>

              {/* SEO Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                    SEO Preview
                  </Label>
                  {isTitleValid(draft.title) && isDescriptionValid(draft.excerpt) ? (
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      SEO Ready
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-xs">
                      Needs optimization
                    </Badge>
                  )}
                </div>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-primary font-medium text-lg truncate flex-1">
                      {draft.title} | OCTG Index
                    </p>
                    <SEOIndicator length={draft.title.length} min={35} max={60} label="Title" />
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                      {draft.excerpt || "No excerpt provided"}
                    </p>
                    <SEOIndicator length={draft.excerpt?.length || 0} min={120} max={155} label="Desc" />
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    octgindex.com/article/{draft.slug}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                  disabled={submitting || !selectedRegionId}
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
