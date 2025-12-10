import { useMemo, useState } from "react";
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
import { Calendar, Plus, Search, Edit, Trash2, Star, StarOff } from "lucide-react";
import { useEvents, useDeleteEvent, useUpdateEvent } from "@/hooks/useEvents";
import { format } from "date-fns";
import { toast } from "sonner";

function isUpcoming(startDate: string): boolean {
  return new Date(startDate) >= new Date(new Date().toDateString());
}

const AdminEvents = () => {
  const { data: events, isLoading } = useEvents();
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!searchQuery) return events;

    return events.filter(
      (event) =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  const { upcomingCount, pastCount, featuredCount } = useMemo(() => {
    if (!events) return { upcomingCount: 0, pastCount: 0, featuredCount: 0 };

    return {
      upcomingCount: events.filter((e) => isUpcoming(e.start_date)).length,
      pastCount: events.filter((e) => !isUpcoming(e.start_date)).length,
      featuredCount: events.filter((e) => e.is_featured).length,
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground">Manage industry events and conferences</p>
          </div>
          <Link to="/admin/events/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => {
                    const upcoming = isUpcoming(event.start_date);
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
                            {format(new Date(event.start_date), "MMM d, yyyy")}
                          </p>
                          {event.end_date && (
                            <p className="text-xs text-muted-foreground">
                              to {format(new Date(event.end_date), "MMM d")}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm line-clamp-1">{event.location}</p>
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
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleFeatured(event.id, event.is_featured)}
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
