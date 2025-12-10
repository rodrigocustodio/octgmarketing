import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Building2, ExternalLink, Search, Globe } from "lucide-react";
import { useEvents, Event } from "@/hooks/useEvents";
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

function EventCard({ event, isPast = false }: { event: Event; isPast?: boolean }) {
  return (
    <Link to={`/events/${event.slug}`}>
      <Card className={`h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 ${isPast ? 'opacity-70' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center ${isPast ? 'bg-muted' : 'bg-accent/20'}`}>
                <span className={`text-xs font-semibold ${isPast ? 'text-muted-foreground' : 'text-accent'}`}>
                  {format(new Date(event.start_date), "MMM")}
                </span>
                <span className="text-xl font-bold">
                  {format(new Date(event.start_date), "d")}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isPast && <Badge variant="outline" className="text-xs">Passed</Badge>}
              {event.is_featured && !isPast && <Badge variant="featured" className="text-xs">Featured</Badge>}
              {event.region?.name && (
                <Badge variant="secondary" className="text-xs">{event.region.name}</Badge>
              )}
            </div>
          </div>

          <h3 className="font-display font-bold text-lg mb-2 line-clamp-2">
            {event.name}
          </h3>

          {event.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{formatEventDate(event.start_date, event.end_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">{event.venue}</span>
              </div>
            )}
            {event.attendees_count && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>{event.attendees_count} attendees</span>
              </div>
            )}
          </div>

          {event.website && !isPast && (
            <div className="mt-4 pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="w-full" asChild onClick={(e) => e.stopPropagation()}>
                <a href={event.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  Official Website
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

const Events = () => {
  const { data: events, isLoading } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  const { upcomingEvents, pastEvents, regions } = useMemo(() => {
    if (!events) return { upcomingEvents: [], pastEvents: [], regions: [] };

    const upcoming = events.filter((e) => isUpcoming(e.start_date));
    const past = events.filter((e) => !isUpcoming(e.start_date)).reverse();

    const uniqueRegions = [...new Set(events.map((e) => e.region?.name).filter(Boolean))] as string[];

    return { upcomingEvents: upcoming, pastEvents: past, regions: uniqueRegions };
  }, [events]);

  const filteredUpcoming = useMemo(() => {
    return upcomingEvents.filter((event) => {
      const matchesSearch =
        searchQuery === "" ||
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion = selectedRegion === "all" || event.region?.name === selectedRegion;

      return matchesSearch && matchesRegion;
    });
  }, [upcomingEvents, searchQuery, selectedRegion]);

  const filteredPast = useMemo(() => {
    return pastEvents.filter((event) => {
      const matchesSearch =
        searchQuery === "" ||
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion = selectedRegion === "all" || event.region?.name === selectedRegion;

      return matchesSearch && matchesRegion;
    });
  }, [pastEvents, searchQuery, selectedRegion]);

  return (
    <>
      <SEOHead
        title="Industry Events Calendar 2026 | OCTG Index"
        description="Browse 60+ major oil, gas, and energy industry events worldwide including ADIPEC, OTC, CERAWeek, Gastech, and World Petroleum Congress. Find conferences, exhibitions, and networking opportunities."
        canonical="https://octgindex.com/events"
      />
      <div className="min-h-screen bg-background">
        <Header />

        <main>
          {/* Hero Section */}
          <section className="bg-gradient-to-b from-card to-background py-16">
            <div className="container">
              <div className="max-w-3xl">
                <Badge variant="outline" className="mb-4">2026 Event Calendar</Badge>
                <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  Industry Events
                </h1>
                <p className="text-xl text-muted-foreground">
                  Discover major oil, gas, and energy conferences, exhibitions, and networking events worldwide.
                </p>
              </div>

              {/* Filters */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedRegion === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRegion("all")}
                  >
                    All Regions
                  </Button>
                  {regions.map((region) => (
                    <Button
                      key={region}
                      variant={selectedRegion === region ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRegion(region)}
                    >
                      {region}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Events Content */}
          <section className="container py-12">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : (
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-8">
                  <TabsTrigger value="upcoming">
                    Upcoming Events ({filteredUpcoming.length})
                  </TabsTrigger>
                  <TabsTrigger value="past">
                    Past Events ({filteredPast.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                  {filteredUpcoming.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-display text-xl font-semibold mb-2">No upcoming events found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery || selectedRegion !== "all"
                          ? "Try adjusting your search or filters"
                          : "Check back later for new events"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredUpcoming.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="past">
                  {filteredPast.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-display text-xl font-semibold mb-2">No past events found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery || selectedRegion !== "all"
                          ? "Try adjusting your search or filters"
                          : "Past events will appear here after they occur"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPast.map((event) => (
                        <EventCard key={event.id} event={event} isPast />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Events;
