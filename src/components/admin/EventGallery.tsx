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
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const idx = images.length;
    setUploadingIndex(idx);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const folder = `octgindex/events/${eventSlug}/gallery`;

      const { data, error } = await supabase.functions.invoke("upload-image", {
        body: { imageBase64: base64, fileName: file.name, folder },
      });

      if (error) throw error;
      if (!data.cdnUrl) throw new Error("No URL returned");

      onChange([...images, data.cdnUrl]);
      toast.success("Image uploaded");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const maxImages = 6;
  const emptySlots = Math.max(0, maxImages - images.length - (uploadingIndex !== null ? 1 : 0));

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

          {uploadingIndex !== null && (
            <div className="aspect-video rounded-md border-2 border-dashed border-primary/50 flex items-center justify-center bg-muted/50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {emptySlots > 0 && images.length < maxImages && (
            <Button
              type="button"
              variant="outline"
              className="aspect-video h-auto flex flex-col gap-1 border-dashed"
              onClick={() => inputRef.current?.click()}
              disabled={uploadingIndex !== null}
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">Add Photo</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
