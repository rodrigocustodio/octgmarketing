import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Trash2, Calendar, Sparkles, Loader2, ImageIcon } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { EventGallery } from "@/components/admin/EventGallery";
import { useEventById, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/useEvents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Region {
  id: string;
  name: string;
  slug: string;
}

const EventEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const { data: event, isLoading } = useEventById(isNew ? "" : id || "");
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [regions, setRegions] = useState<Region[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    location: "",
    venue: "",
    start_date: "",
    end_date: "",
    website: "",
    video_url: "",
    image_url: "",
    gallery_images: [] as string[],
    region_id: "",
    attendees_count: "",
    exhibitors_count: "",
    is_featured: false,
  });

  // Fetch regions
  useEffect(() => {
    const fetchRegions = async () => {
      const { data } = await supabase.from("regions").select("id, name, slug").order("name");
      if (data) setRegions(data);
    };
    fetchRegions();
  }, []);

  // Populate form when event loads
  useEffect(() => {
    if (event && !isNew) {
      setFormData({
        name: event.name || "",
        slug: event.slug || "",
        description: event.description || "",
        location: event.location || "",
        venue: event.venue || "",
        start_date: event.start_date || "",
        end_date: event.end_date || "",
        website: event.website || "",
        video_url: event.video_url || "",
        image_url: event.image_url || "",
        gallery_images: event.gallery_images || [],
        region_id: event.region_id || "",
        attendees_count: event.attendees_count || "",
        exhibitors_count: event.exhibitors_count || "",
        is_featured: event.is_featured || false,
      });
    }
  }, [event, isNew]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      toast.error("Please enter event name first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-event-description', {
        body: {
          eventName: formData.name,
          location: formData.location,
          website: formData.website,
          venue: formData.venue,
          startDate: formData.start_date,
          endDate: formData.end_date,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setFormData((prev) => ({ ...prev, description: data.description }));
      toast.success("Description generated successfully");
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || "Failed to generate description");
    } finally {
    setIsGenerating(false);
    }
  };

  const handleImageUpload = async (base64: string, fileName: string): Promise<string> => {
    setIsUploadingImage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const folder = `octgindex/events/${formData.slug || id || 'new'}`;
      
      const { data, error } = await supabase.functions.invoke('upload-image', {
        body: { imageBase64: base64, fileName, folder },
      });

      if (error) throw error;
      if (!data.cdnUrl) throw new Error("No URL returned from upload");

      toast.success("Image uploaded successfully");
      return data.cdnUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error(error.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.location || !formData.start_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const eventData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        location: formData.location,
        venue: formData.venue || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        website: formData.website || null,
        video_url: formData.video_url || null,
        image_url: formData.image_url || null,
        gallery_images: formData.gallery_images.length > 0 ? formData.gallery_images : null,
        region_id: formData.region_id || null,
        attendees_count: formData.attendees_count || null,
        exhibitors_count: formData.exhibitors_count || null,
        is_featured: formData.is_featured,
      };

      if (isNew) {
        const newEvent = await createEvent.mutateAsync(eventData);
        toast.success("Event created successfully");
        navigate(`/admin/events/${newEvent.id}`, { replace: true });
      } else {
        await updateEvent.mutateAsync({ id: id!, ...eventData });
        toast.success("Event updated successfully");
        // Stay on current page - no navigation
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save event");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await deleteEvent.mutateAsync(id!);
      toast.success("Event deleted successfully");
      navigate("/admin/events");
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  if (isLoading && !isNew) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" size="icon" onClick={() => navigate("/admin/events")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                {isNew ? "Add New Event" : "Edit Event"}
              </h1>
              <p className="text-muted-foreground">
                {isNew ? "Create a new industry event" : event?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
              {createEvent.isPending || updateEvent.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isNew ? "Create Event" : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., ADIPEC 2026"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., adipec-2026"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Description</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateDescription}
                      disabled={isGenerating || !formData.name}
                      className="bg-accent/20 hover:bg-accent/30 border-accent/30"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Researching...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Description
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the event..."
                    rows={6}
                  />
                  {formData.description && (
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.description.length} characters
                    </p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Abu Dhabi, UAE"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      value={formData.venue}
                      onChange={(e) => setFormData((prev) => ({ ...prev, venue: e.target.value }))}
                      placeholder="e.g., ADNEC"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Official Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video_url">Video URL</Label>
                  <Input
                    id="video_url"
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, video_url: e.target.value }))}
                    placeholder="YouTube or Bunny.net Stream URL"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports: YouTube (youtube.com, youtu.be) or Bunny.net Stream (iframe.mediadelivery.net, .b-cdn.net)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select
                    value={formData.region_id}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, region_id: value }))}
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
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_featured">Featured Event</Label>
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_featured: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="attendees_count">Expected Attendees</Label>
                  <Input
                    id="attendees_count"
                    value={formData.attendees_count}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, attendees_count: e.target.value }))
                    }
                    placeholder="e.g., 50,000+"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exhibitors_count">Exhibitors</Label>
                  <Input
                    id="exhibitors_count"
                    value={formData.exhibitors_count}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, exhibitors_count: e.target.value }))
                    }
                    placeholder="e.g., 2,000+"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Hero Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData((prev) => ({ ...prev, image_url: url || "" }))}
                  onUpload={handleImageUpload}
                  isUploading={isUploadingImage}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1920×600px for optimal hero display
                </p>
              </CardContent>
            </Card>

            <EventGallery
              eventSlug={formData.slug || id || "new"}
              images={formData.gallery_images}
              onChange={(imgs) => setFormData((prev) => ({ ...prev, gallery_images: imgs }))}
            />
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default EventEdit;
