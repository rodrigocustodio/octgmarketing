import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Upload, X, Loader2, Package, Images } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProductById, useUpdateProduct, useProductCategories } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: product, isLoading } = useProductById(id);
  const { data: categories } = useProductCategories();
  const updateProduct = useUpdateProduct();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [apiStandard, setApiStandard] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [applications, setApplications] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form when product loads
  if (product && !initialized) {
    setName(product.name);
    setSlug(product.slug);
    setShortDescription(product.short_description || "");
    setDescription(product.description || "");
    setApiStandard(product.api_standard || "");
    setCategoryId(product.category_id || "");
    setApplications((product.applications || []).join(", "));
    setGalleryImages((product.gallery_images as string[]) || []);
    setInitialized(true);
  }

  const handleUpload = async (file: File, index: number) => {
    if (!id) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 5MB", variant: "destructive" });
      return;
    }

    setUploadingIndex(index);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      // Upload to Bunny CDN
      const { data, error } = await supabase.functions.invoke("upload-image", {
        body: {
          imageBase64: base64Data,
          fileName: `${index + 1}.${file.name.split(".").pop()}`,
          folder: `octgindex/products/${id}/gallery`,
        },
      });

      if (error) throw error;

      // Update gallery array
      const newGallery = [...galleryImages];
      newGallery[index] = data.cdnUrl;
      setGalleryImages(newGallery);

      toast({ title: "Image uploaded", description: `Gallery image ${index + 1} uploaded successfully` });
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newGallery = [...galleryImages];
    newGallery[index] = "";
    setGalleryImages(newGallery.filter((url) => url !== ""));
  };

  const handleSave = async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      await updateProduct.mutateAsync({
        id,
        name,
        slug,
        short_description: shortDescription || null,
        description: description || null,
        api_standard: apiStandard || null,
        category_id: categoryId || null,
        applications: applications.split(",").map((a) => a.trim()).filter(Boolean),
        gallery_images: galleryImages.filter((url) => url),
      });

      toast({ title: "Product saved", description: "Product details updated successfully" });
    } catch (err) {
      console.error("Save error:", err);
      toast({ title: "Save failed", description: "Failed to save product", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <Button asChild variant="outline">
            <Link to="/admin/products">Back to Products</Link>
          </Button>
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
            <Button asChild variant="ghost" size="icon">
              <Link to="/admin/products">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground text-sm">Edit product details and gallery</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Textarea
                    id="shortDescription"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card>
              <CardHeader>
                <CardTitle>Technical Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiStandard">API Standard</Label>
                    <Input
                      id="apiStandard"
                      value={apiStandard}
                      onChange={(e) => setApiStandard(e.target.value)}
                      placeholder="e.g., API 5CT, API 5D"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="applications">Applications (comma-separated)</Label>
                  <Textarea
                    id="applications"
                    value={applications}
                    onChange={(e) => setApplications(e.target.value)}
                    placeholder="e.g., Onshore drilling, Offshore exploration, High-pressure wells"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Gallery */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Images className="w-5 h-5" />
                  Photo Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload up to 4 product photos. These will appear on the public product page.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg border-2 border-dashed border-border overflow-hidden relative group"
                    >
                      {galleryImages[index] ? (
                        <>
                          <img
                            src={galleryImages[index]}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8"
                              onClick={() => inputRef.current?.click()}
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-8 w-8"
                              onClick={() => handleRemoveImage(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      ) : uploadingIndex === index ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(file, index);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preview Link */}
            <Card>
              <CardContent className="p-4">
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/octg-directory/${product.category?.slug || "manufacturing"}/${product.slug}`} target="_blank">
                    <Package className="w-4 h-4 mr-2" />
                    View Public Page
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
