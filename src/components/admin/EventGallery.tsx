import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, Images } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventGalleryProps {
  eventSlug: string;
  images: string[];
  onChange: (images: string[]) => void;
}

export function EventGallery({ eventSlug, images, onChange }: EventGalleryProps) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleMultiUpload = async (files: File[]) => {
    const availableSlots = maxImages - images.length;
    const filesToUpload = files.slice(0, availableSlots);
    
    if (files.length > availableSlots) {
      toast.warning(`Only uploading ${availableSlots} image(s) - gallery limit reached`);
    }

    // Validate files
    const validFiles = filesToUpload.filter(file => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingCount(validFiles.length);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const folder = `octgindex/events/${eventSlug}/gallery`;

      // Upload all files in parallel
      const uploadPromises = validFiles.map(async (file) => {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const { data, error } = await supabase.functions.invoke("upload-image", {
          body: { imageBase64: base64, fileName: file.name, folder },
        });

        if (error) throw error;
        if (!data.cdnUrl) throw new Error("No URL returned");
        return data.cdnUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      onChange([...images, ...newUrls]);
      toast.success(`${newUrls.length} image(s) uploaded`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload images");
    } finally {
      setUploadingCount(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleMultiUpload(files);
    e.target.value = "";
  };

  const maxImages = 6;

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const hasAvailableSlots = images.length + uploadingCount < maxImages;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="h-5 w-5" />
          Event Gallery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Add up to 6 event photos. These appear on the public event page.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="grid grid-cols-2 gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="relative aspect-video rounded-md overflow-hidden group">
              <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {Array.from({ length: uploadingCount }).map((_, idx) => (
            <div key={`uploading-${idx}`} className="aspect-video rounded-md border-2 border-dashed border-primary/50 flex items-center justify-center bg-muted/50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ))}

          {hasAvailableSlots && (
            <Button
              type="button"
              variant="outline"
              className="aspect-video h-auto flex flex-col gap-1 border-dashed"
              onClick={() => inputRef.current?.click()}
              disabled={uploadingCount > 0}
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">Add Photos</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
