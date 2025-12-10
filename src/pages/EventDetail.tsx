import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  MapPin, 
  Building2, 
  Users, 
  ExternalLink, 
  Globe,
  ArrowLeft,
  Share2
} from "lucide-react";
import { useEvent } from "@/hooks/useEvents";
import { format } from "date-fns";

function formatEventDate(startDate: string, endDate: string | null): string {
  const start = new Date(startDate);
  if (!endDate) {
    return format(start, "MMMM d, yyyy");
  }
  const end = new Date(endDate);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${format(start, "MMMM d")}–${format(end, "d, yyyy")}`;
  }
  return `${format(start, "MMMM d")} – ${format(end, "MMMM d, yyyy")}`;
}

function isUpcoming(startDate: string): boolean {
  return new Date(startDate) >= new Date(new Date().toDateString());
}

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading, error } = useEvent(slug || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96" />
            </div>
            <div>
              <Skeleton className="h-64" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="font-display text-3xl font-bold mb-2">Event Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/events">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isPast = !isUpcoming(event.start_date);

  // Schema.org Event structured data
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.description,
    startDate: event.start_date,
    endDate: event.end_date || event.start_date,
    location: {
      "@type": "Place",
      name: event.venue || event.location,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.location,
      },
    },
    organizer: {
      "@type": "Organization",
      name: event.name,
      url: event.website,
    },
    eventStatus: isPast ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(event.image_url && { image: event.image_url }),
  };

  return (
    <>
      <SEOHead
        title={`${event.name} | ${formatEventDate(event.start_date, event.end_date)} | OCTG Index`}
        description={event.description || `Join ${event.name} in ${event.location}. ${event.attendees_count ? `Expected ${event.attendees_count} attendees.` : ""} ${event.exhibitors_count ? `${event.exhibitors_count} exhibitors.` : ""}`}
        canonical={`https://octgindex.com/events/${event.slug}`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }} />

      <div className="min-h-screen bg-background">
        <Header />

        <main>
          {/* Hero with optional background image */}
          <section 
            className="relative py-10 md:py-14"
            style={event.image_url ? {
              backgroundImage: `url(${event.image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          >
            {/* Dark overlay for text readability when image exists */}
            {event.image_url && (
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50" />
            )}
            
            {/* Fallback gradient when no image */}
            {!event.image_url && (
              <div className="absolute inset-0 bg-gradient-to-b from-card to-background" />
            )}

            <div className="container relative z-10">
              <Link 
                to="/events" 
                className={`inline-flex items-center mb-6 transition-colors ${
                  event.image_url 
                    ? "text-white/70 hover:text-white" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Link>

              <div className="flex flex-wrap gap-3 mb-4">
                {isPast && <Badge variant="outline" className={event.image_url ? "border-white/30 text-white" : ""}>Event Passed</Badge>}
                {event.is_featured && !isPast && <Badge variant="featured">Featured Event</Badge>}
                {event.region?.name && <Badge variant="secondary">{event.region.name}</Badge>}
              </div>

              <h1 className={`font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 ${
                event.image_url ? "text-white" : ""
              }`}>
                {event.name}
              </h1>

              <div className={`flex flex-wrap items-center gap-6 text-lg ${
                event.image_url ? "text-white/80" : "text-muted-foreground"
              }`}>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{formatEventDate(event.start_date, event.end_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Content */}
          <section className="container py-8 md:py-10">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Event</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {event.description || "No description available for this event."}
                    </p>
                  </CardContent>
                </Card>

                {event.website && !isPast && (
                  <div className="flex gap-4">
                    <Button size="lg" asChild>
                      <a href={event.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="mr-2 h-5 w-5" />
                        Visit Official Website
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Event Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date</p>
                      <p className="font-semibold">{formatEventDate(event.start_date, event.end_date)}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="font-semibold">{event.location}</p>
                    </div>

                    {event.venue && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Venue</p>
                        <p className="font-semibold">{event.venue}</p>
                      </div>
                    )}

                    {event.attendees_count && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Expected Attendees</p>
                        <p className="font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {event.attendees_count}
                        </p>
                      </div>
                    )}

                    {event.exhibitors_count && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Exhibitors</p>
                        <p className="font-semibold flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {event.exhibitors_count}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {event.website && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Quick Links
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full" asChild>
                        <a href={event.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="mr-2 h-4 w-4" />
                          Official Website
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default EventDetail;
