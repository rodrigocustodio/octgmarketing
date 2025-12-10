import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, ArrowRight, Users } from "lucide-react";
import { useUpcomingEvents } from "@/hooks/useEvents";
import { format } from "date-fns";

function formatEventDate(startDate: string, endDate: string | null): string {
  const start = new Date(startDate);
  if (!endDate) {
    return format(start, "MMM d, yyyy");
  }
  const end = new Date(endDate);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${format(start, "MMM d")}–${format(end, "d, yyyy")}`;
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

export function UpcomingEventsSection() {
  const { data: events, isLoading } = useUpcomingEvents(6);

  if (isLoading) {
    return (
      <section className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Upcoming Events</h2>
            <p className="text-muted-foreground mt-1">Industry conferences in the next 60 days</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <section className="container py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Upcoming Events</h2>
          <p className="text-muted-foreground mt-1">Industry conferences in the next 60 days</p>
        </div>
        <Link to="/events">
          <Button variant="outline" size="sm">
            View All Events <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event, index) => (
          <Link key={event.id} to={`/events/${event.slug}`}>
            <Card 
              className={`h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-accent">
                        {format(new Date(event.start_date), "MMM")}
                      </p>
                      <p className="text-xl font-bold">
                        {format(new Date(event.start_date), "d")}
                      </p>
                    </div>
                  </div>
                  {event.is_featured && (
                    <Badge variant="featured" className="text-xs">Featured</Badge>
                  )}
                </div>

                <h3 className="font-display font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {event.name}
                </h3>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{formatEventDate(event.start_date, event.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  {event.attendees_count && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span>{event.attendees_count} attendees</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
