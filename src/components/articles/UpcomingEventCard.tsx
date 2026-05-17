import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { useUpcomingEvents } from "@/hooks/useEvents";
import { format } from "date-fns";
import { optimizeImageUrl, parseLocalDate } from "@/lib/utils";

export function UpcomingEventCard() {
  const { data: events, isLoading } = useUpcomingEvents(1);
  
  if (isLoading || !events || events.length === 0) {
    return null;
  }

  const event = events[0];
  
  const formatEventDate = (startDate: string, endDate: string | null) => {
    const start = parseLocalDate(startDate);
    if (!endDate) {
      return format(start, "MMMM d, yyyy");
    }
    const end = parseLocalDate(endDate);
    if (format(start, "MMMM yyyy") === format(end, "MMMM yyyy")) {
      return `${format(start, "MMMM d")}-${format(end, "d, yyyy")}`;
    }
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  return (
    <Card className="overflow-hidden border-border/50 bg-card">
      {/* Image Section */}
      {event.image_url && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={optimizeImageUrl(event.image_url, { width: 600, quality: 80 })}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        </div>
      )}

      {/* Content Section */}
      <div className="p-5 space-y-3">
        {/* Section Header */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 bg-accent rounded-full" />
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Upcoming Event
          </span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-accent" />
          <span>{formatEventDate(event.start_date, event.end_date)}</span>
        </div>

        {/* Event Name */}
        <h3 className="font-display text-lg font-bold leading-snug text-foreground line-clamp-2">
          {event.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{event.location}</span>
        </div>

        {/* CTA Button */}
        <Button
          asChild
          className="w-full bg-gradient-to-r from-octg-bronze via-octg-gold to-octg-copper hover:opacity-90 text-white font-semibold mt-2"
        >
          <Link
            to={`/events/${event.slug}`}
            className="flex items-center justify-center gap-2"
          >
            View Event Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
