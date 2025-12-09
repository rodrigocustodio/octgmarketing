import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, GripVertical, Images } from "lucide-react";
import { toast } from "sonner";

interface ContentGalleryProps {
  articleId: string;
  onImageReady?: (imageUrl: string) => void;
}

const MAX_IMAGES = 4;

export function ContentGallery({ articleId, onImageReady }: ContentGalleryProps) {
  const [images, setImages] = useState<string[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (images.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPG, PNG, WebP, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingIndex(images.length);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;
      const base64Content = base64Data.split(",")[1];

      // Upload to Bunny CDN via edge function
      const { data, error } = await supabase.functions.invoke("upload-image", {
        body: {
          imageBase64: base64Content,
          fileName: `gallery-${Date.now()}.${file.name.split(".").pop()}`,
          folder: `octgindex/articles/${articleId}/gallery`,
        },
      });

      if (error) throw error;

      const imageUrl = data.cdnUrl;
      setImages((prev) => [...prev, imageUrl]);
      toast.success("Image uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageDragStart = (e: React.DragEvent<HTMLDivElement>, imageUrl: string) => {
    e.dataTransfer.setData("text/plain", imageUrl);
    e.dataTransfer.setData("application/x-gallery-image", "true");
    e.dataTransfer.effectAllowed = "copy";
  };

  const emptySlots = MAX_IMAGES - images.length - (uploadingIndex !== null ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="h-4 w-4" />
          Content Gallery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Upload images, then drag them into your article content
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Uploaded images - draggable */}
          {images.map((imageUrl, index) => (
            <div
              key={imageUrl}
              draggable
              onDragStart={(e) => handleImageDragStart(e, imageUrl)}
              className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted cursor-grab active:cursor-grabbing group"
            >
              <img
                src={imageUrl}
                alt={`Gallery ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <GripVertical className="h-6 w-6 text-white" />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {/* Uploading slot */}
          {uploadingIndex !== null && (
            <div className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty upload slots */}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center cursor-pointer transition-colors"
            >
              <Upload className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Upload</span>
            </div>
          ))}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardContent>
    </Card>
  );
}

export default ContentGallery;
