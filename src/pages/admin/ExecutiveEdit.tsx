import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  useExecutiveById,
  useUpdateExecutive,
  useCreateExecutive,
} from "@/hooks/useExecutives";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const REGIONS = ["Americas", "Europe", "Asia-Pacific", "Australia"];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ExecutiveEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const { data: executive, isLoading } = useExecutiveById(id || "");
  const updateExecutive = useUpdateExecutive();
  const createExecutive = useCreateExecutive();

  const [formData, setFormData] = useState({
    name: "",
    title: "Chief Executive Officer",
    company_name: "",
    stock_symbol: "",
    bio: "",
    photo_url: "",
    region: "Americas",
    slug: "",
    linkedin_url: "",
    company_id: null as string | null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (executive && !isNew) {
      setFormData({
        name: executive.name,
        title: executive.title,
        company_name: executive.company_name,
        stock_symbol: executive.stock_symbol || "",
        bio: executive.bio || "",
        photo_url: executive.photo_url || "",
        region: executive.region,
        slug: executive.slug,
        linkedin_url: executive.linkedin_url || "",
        company_id: executive.company_id,
      });
    }
  }, [executive, isNew]);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isNew ? generateSlug(name) : prev.slug,
    }));
  };

  const handleImageUpload = async (base64: string): Promise<string> => {
    setIsUploading(true);
    try {
      const fileName = `${formData.slug || generateSlug(formData.name)}.jpg`;

      const { data, error } = await supabase.functions.invoke("upload-image", {
        body: {
          imageBase64: base64,
          fileName,
          folder: "octgindex/ceos",
        },
      });

      if (error) throw error;

      // Add cache-busting timestamp to force fresh image load
      const cdnUrl = `${data.cdnUrl}?v=${Date.now()}`;
      setFormData((prev) => ({ ...prev, photo_url: cdnUrl }));
      toast.success("Photo uploaded successfully");
      return cdnUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.company_name || !formData.region) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    toast.loading("Saving executive...", { id: "saving" });
    
    try {
      const saveData = {
        name: formData.name,
        title: formData.title,
        company_name: formData.company_name,
        stock_symbol: formData.stock_symbol || null,
        bio: formData.bio || null,
        photo_url: formData.photo_url || null,
        region: formData.region,
        slug: formData.slug || generateSlug(formData.name),
        linkedin_url: formData.linkedin_url || null,
        company_id: formData.company_id,
      };

      if (isNew) {
        await createExecutive.mutateAsync(saveData);
        toast.success("Executive created successfully", { id: "saving" });
      } else {
        await updateExecutive.mutateAsync({ id: id!, updates: saveData });
        toast.success("Executive updated successfully", { id: "saving" });
      }

      navigate("/admin/executives");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save executive", { id: "saving" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !isNew) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/executives")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isNew ? "Add Executive" : "Edit Executive"}
              </h1>
              <p className="text-muted-foreground">
                {isNew ? "Create a new CEO profile" : formData.name}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="min-w-[100px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Form Fields (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g., John Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="e.g., Chief Executive Officer"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, slug: e.target.value }))
                      }
                      placeholder="e.g., john-smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region *</Label>
                    <Select
                      value={formData.region}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, region: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          company_name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Tenaris S.A."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock_symbol">Stock Symbol</Label>
                    <Input
                      id="stock_symbol"
                      value={formData.stock_symbol}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          stock_symbol: e.target.value,
                        }))
                      }
                      placeholder="e.g., NYSE: TS"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        linkedin_url: e.target.value,
                      }))
                    }
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Biography</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="bio">Full Biography (Markdown supported)</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    placeholder="Enter the executive's biography..."
                    rows={16}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Photo (1/3 width) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.photo_url ? (
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                    <img
                      src={formData.photo_url}
                      alt={formData.name}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, photo_url: "" }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center">
                    <User className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}

                <ImageUpload
                  value={formData.photo_url}
                  onChange={(url) =>
                    setFormData((prev) => ({ ...prev, photo_url: url }))
                  }
                  onUpload={handleImageUpload}
                  isUploading={isUploading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div className="flex justify-between">
                  <span>Photo</span>
                  <span className={formData.photo_url ? "text-emerald-500" : "text-amber-500"}>
                    {formData.photo_url ? "Uploaded" : "Missing"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Biography</span>
                  <span className={formData.bio ? "text-emerald-500" : "text-amber-500"}>
                    {formData.bio ? `${formData.bio.length} chars` : "Empty"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>LinkedIn</span>
                  <span className={formData.linkedin_url ? "text-emerald-500" : "text-muted-foreground"}>
                    {formData.linkedin_url ? "Added" : "Optional"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
