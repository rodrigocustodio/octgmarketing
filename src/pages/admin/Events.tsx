import { useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Plus, Search, Edit, Trash2, Star, StarOff, Sparkles, Loader2, Check, Square, RefreshCw } from "lucide-react";
import { useEvents, useDeleteEvent, useUpdateEvent, Event } from "@/hooks/useEvents";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseLocalDate } from "@/lib/utils";

function isUpcoming(startDate: string): boolean {
  return parseLocalDate(startDate) >= new Date(new Date().toDateString());
}

const AdminEvents = () => {
  const { data: events, isLoading, refetch } = useEvents();
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkMode, setBulkMode] = useState<'missing' | 'all'>('missing');
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentName: "" });
  const stopBulkRef = useRef(false);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!searchQuery) return events;

    return events.filter(
      (event) =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  const { upcomingCount, pastCount, featuredCount, missingDescCount } = useMemo(() => {
    if (!events) return { upcomingCount: 0, pastCount: 0, featuredCount: 0, missingDescCount: 0 };

    return {
      upcomingCount: events.filter((e) => isUpcoming(e.start_date)).length,
      pastCount: events.filter((e) => !isUpcoming(e.start_date)).length,
      featuredCount: events.filter((e) => e.is_featured).length,
      missingDescCount: events.filter((e) => !e.description || e.description.length < 100).length,
    };
  }, [events]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteEvent.mutateAsync(id);
      toast.success("Event deleted successfully");
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleToggleFeatured = async (id: string, currentValue: boolean) => {
    try {
      await updateEvent.mutateAsync({ id, is_featured: !currentValue });
      toast.success(currentValue ? "Event unfeatured" : "Event featured");
    } catch (error) {
      toast.error("Failed to update event");
    }
  };

  const handleGenerateDescription = async (event: Event) => {
    setGeneratingId(event.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-event-description', {
        body: {
          eventName: event.name,
          location: event.location,
          website: event.website,
          venue: event.venue,
          startDate: event.start_date,
          endDate: event.end_date,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      await updateEvent.mutateAsync({ id: event.id, description: data.description });
      toast.success(`Description generated for ${event.name}`);
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || "Failed to generate description");
    } finally {
      setGeneratingId(null);
    }
  };

  const processBulkGeneration = async (eventsToProcess: Event[], mode: 'missing' | 'all') => {
    if (eventsToProcess.length === 0) {
      toast.info(mode === 'missing' ? "All events already have descriptions" : "No events to process");
      return;
    }

    setIsBulkGenerating(true);
    setBulkMode(mode);
    stopBulkRef.current = false;
    setBulkProgress({ current: 0, total: eventsToProcess.length, currentName: "" });

    const batchSize = 10;
    let processed = 0;

    for (let i = 0; i < eventsToProcess.length; i += batchSize) {
      if (stopBulkRef.current) break;

      const batch = eventsToProcess.slice(i, i + batchSize);
      
      for (const event of batch) {
        if (stopBulkRef.current) break;

        processed++;
        setBulkProgress({ current: processed, total: eventsToProcess.length, currentName: event.name });

        try {
          const { data, error } = await supabase.functions.invoke('generate-event-description', {
            body: {
              eventName: event.name,
              location: event.location,
              website: event.website,
              venue: event.venue,
              startDate: event.start_date,
              endDate: event.end_date,
            },
          });

          if (!error && data.success) {
            await updateEvent.mutateAsync({ id: event.id, description: data.description });
          }
        } catch (error) {
          console.error('Bulk generation error for', event.name, error);
        }

        // Delay between items
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Pause between batches
      if (i + batchSize < eventsToProcess.length && !stopBulkRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setIsBulkGenerating(false);
    setBulkProgress({ current: 0, total: 0, currentName: "" });
    refetch();
    toast.success(`${mode === 'all' ? 'Regenerated' : 'Generated'} descriptions for ${processed} events`);
  };

  const handleBulkGenerate = () => {
    const eventsToProcess = events?.filter((e) => !e.description || e.description.length < 100) || [];
    processBulkGeneration(eventsToProcess, 'missing');
  };

  const handleRegenerateAll = () => {
    if (!events || events.length === 0) {
      toast.info("No events to process");
      return;
    }
    if (!confirm(`This will regenerate descriptions for ALL ${events.length} events. Continue?`)) return;
    processBulkGeneration(events, 'all');
  };

  const handleStopBulk = () => {
    stopBulkRef.current = true;
    toast.info("Stopping bulk generation...");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground">Manage industry events and conferences</p>
          </div>
          <div className="flex items-center gap-2">
            {isBulkGenerating ? (
              <Button variant="outline" onClick={handleStopBulk}>
                <Square className="h-4 w-4 mr-2" />
                Stop ({bulkProgress.current}/{bulkProgress.total})
              </Button>
            ) : (
              <>
                {missingDescCount > 0 && (
                  <Button variant="outline" onClick={handleBulkGenerate} className="bg-accent/20 hover:bg-accent/30 border-accent/30">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Missing ({missingDescCount})
                  </Button>
                )}
                {events && events.length > 0 && (
                  <Button variant="outline" onClick={handleRegenerateAll}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate All ({events.length})
                  </Button>
                )}
              </>
            )}
            <Link to="/admin/events/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Bulk Progress */}
        {isBulkGenerating && (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <div className="flex-1">
                  <p className="font-medium">Generating: {bulkProgress.currentName}</p>
                  <p className="text-sm text-muted-foreground">
                    {bulkProgress.current} of {bulkProgress.total} events
                  </p>
                </div>
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="bg-accent h-2 rounded-full transition-all" 
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold">{upcomingCount}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Past Events</p>
                  <p className="text-2xl font-bold">{pastCount}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Featured</p>
                  <p className="text-2xl font-bold">{featuredCount}</p>
                </div>
                <Star className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Need Description</p>
                  <p className="text-2xl font-bold">{missingDescCount}</p>
                </div>
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Events ({filteredEvents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => {
                    const upcoming = isUpcoming(event.start_date);
                    const hasDescription = event.description && event.description.length >= 100;
                    const isGeneratingThis = generatingId === event.id;

                    return (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium line-clamp-1">{event.name}</p>
                              {event.venue && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {event.venue}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {format(parseLocalDate(event.start_date), "MMM d, yyyy")}
                          </p>
                          {event.end_date && (
                            <p className="text-xs text-muted-foreground">
                              to {format(parseLocalDate(event.end_date), "MMM d")}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm line-clamp-1">{event.location}</p>
                        </TableCell>
                        <TableCell>
                          {hasDescription ? (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              {event.description!.length} chars
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Missing</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {upcoming ? (
                              <Badge variant="default" className="text-xs">Upcoming</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Passed</Badge>
                            )}
                            {event.is_featured && (
                              <Badge variant="featured" className="text-xs">Featured</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleGenerateDescription(event)}
                              disabled={isGeneratingThis || isBulkGenerating}
                              title="Generate description"
                              className={hasDescription ? "text-green-600" : "bg-accent/20 hover:bg-accent/30"}
                            >
                              {isGeneratingThis ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : hasDescription ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleFeatured(event.id, event.is_featured || false)}
                              title={event.is_featured ? "Remove from featured" : "Mark as featured"}
                            >
                              {event.is_featured ? (
                                <StarOff className="h-4 w-4" />
                              ) : (
                                <Star className="h-4 w-4" />
                              )}
                            </Button>
                            <Link to={`/admin/events/${event.id}`}>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(event.id, event.name)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminEvents;
