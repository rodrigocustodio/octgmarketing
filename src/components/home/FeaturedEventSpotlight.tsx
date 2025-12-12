import { Link } from "react-router-dom";
import { useUpcomingEvents } from "@/hooks/useEvents";
import { getVideoEmbed } from "@/lib/video-utils";
import { optimizeImageUrl, parseLocalDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";

export function FeaturedEventSpotlight() {
  const { data: events, isLoading } = useUpcomingEvents(1);
  const event = events?.[0];

  // Don't render if no upcoming events
  if (!isLoading && !event) return null;

  // Get video embed or fallback to gallery/image
  const videoEmbed = event?.video_url ? getVideoEmbed(event.video_url) : null;
  const fallbackImage = event?.gallery_images?.[0] || event?.image_url;

  if (isLoading) {
    return (
      <section className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Upcoming Events</h2>
            <p className="text-muted-foreground mt-1">Industry conferences in the next 60 days</p>
          </div>
        </div>
        <div className="grid lg:grid-cols-10 gap-8">
          <div className="lg:col-span-7">
            <Skeleton className="w-full aspect-video rounded-xl" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </section>
    );
  }

  if (!event) return null;

  return (
    <section className="container py-12">
      {/* Section Header */}
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

      <div className="grid lg:grid-cols-10 gap-8 items-stretch">
        
        {/* LEFT SIDE - 70% (7 of 10 columns) */}
        <div className="lg:col-span-7">
          {videoEmbed ? (
            // Video embed using responsive pattern
            <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
              {videoEmbed.type === 'bunny-direct' ? (
                <video
                  src={videoEmbed.embedUrl}
                  className="absolute top-0 left-0 w-full h-full"
                  controls
                  preload="metadata"
                />
              ) : (
                <iframe 
                  src={videoEmbed.embedUrl}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={event.name}
                />
              )}
            </div>
          ) : fallbackImage ? (
            // First gallery image or featured image
            <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
              <img 
                src={optimizeImageUrl(fallbackImage, { width: 1200, quality: 85 })}
                alt={event.name}
                className="absolute top-0 left-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            // Placeholder if no media
            <div className="bg-muted rounded-xl aspect-video flex items-center justify-center">
              <Calendar className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        
        {/* RIGHT SIDE - 30% (3 of 10 columns) */}
        <div className="lg:col-span-3 flex flex-col justify-center space-y-5">
          {/* Event Date Badge */}
          <Badge variant="featured" className="w-fit">
            {format(parseLocalDate(event.start_date), "MMM d, yyyy")}
          </Badge>
          
          {/* Event Title */}
          <h3 className="font-display text-2xl lg:text-3xl font-bold leading-tight">
            {event.name}
          </h3>
          
          {/* Short Description (truncated) */}
          <p className="text-muted-foreground line-clamp-4">
            {event.description || `Join industry leaders at ${event.name} in ${event.location}.`}
          </p>
          
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{event.location}</span>
          </div>
          
          {/* Sign Up Button */}
          {event.website ? (
            <a href={event.website} target="_blank" rel="noopener noreferrer">
              <Button variant="bronze" size="lg" className="w-full">
                Register for Event <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          ) : (
            <Link to={`/events/${event.slug}`}>
              <Button variant="bronze" size="lg" className="w-full">
                View Event Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
        
      </div>
    </section>
  );
}
