import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Search, Star } from "lucide-react";
import { useEvents, Event } from "@/hooks/useEvents";
import { format } from "date-fns";

function formatDateRange(startDate: string, endDate: string | null): string {
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

function isUpcoming(startDate: string): boolean {
  return new Date(startDate) >= new Date(new Date().toDateString());
}

function groupEventsByMonth(events: Event[]): Record<string, Event[]> {
  return events.reduce((groups, event) => {
    const monthKey = format(new Date(event.start_date), "MMMM yyyy").toUpperCase();
    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey].push(event);
    return groups;
  }, {} as Record<string, Event[]>);
}

function EventRow({ event, isPast = false }: { event: Event; isPast?: boolean }) {
  const startDate = new Date(event.start_date);
  
  return (
    <Link 
      to={`/events/${event.slug}`}
      className={`block group ${isPast ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-4 md:gap-6 py-5 px-4 rounded-lg hover:bg-card/80 transition-colors border-b border-border/50 last:border-b-0">
        {/* Large Date Block */}
        <div className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg flex flex-col items-center justify-center ${isPast ? 'bg-muted' : 'bg-accent/15'}`}>
          <span className={`text-2xl md:text-3xl font-bold ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
            {format(startDate, "d")}
          </span>
          <span className={`text-xs font-semibold uppercase tracking-wide ${isPast ? 'text-muted-foreground' : 'text-accent'}`}>
            {format(startDate, "MMM")}
          </span>
        </div>

        {/* Event Details */}
        <div className="flex-1 min-w-0">
          {/* Event Name */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-display text-lg md:text-xl font-bold group-hover:text-accent transition-colors line-clamp-2">
              {event.name}
            </h3>
            <div className="flex-shrink-0 flex items-center gap-2">
              {event.is_featured && !isPast && (
                <Star className="h-4 w-4 text-accent fill-accent" />
              )}
              {event.region?.name && (
                <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                  {event.region.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Inline Details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatDateRange(event.start_date, event.end_date)}</span>
            </div>
            {event.attendees_count && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{event.attendees_count} attendees</span>
              </div>
            )}
            {event.exhibitors_count && (
              <div className="flex items-center gap-1.5 text-accent">
                <span>{event.exhibitors_count} exhibitors</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function MonthSection({ month, events, isPast = false }: { month: string; events: Event[]; isPast?: boolean }) {
  return (
    <div className="mb-8">
      {/* Month Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-3 mb-2">
        <h2 className="font-display text-lg font-bold tracking-wide text-muted-foreground">
          {month}
        </h2>
      </div>
      
      {/* Events List */}
      <div className="bg-card/30 rounded-xl border border-border/30">
        {events.map((event) => (
          <EventRow key={event.id} event={event} isPast={isPast} />
        ))}
      </div>
    </div>
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

  const upcomingByMonth = useMemo(() => groupEventsByMonth(filteredUpcoming), [filteredUpcoming]);
  const pastByMonth = useMemo(() => groupEventsByMonth(filteredPast), [filteredPast]);

  return (
    <>
      <SEOHead
        title="Oil & Gas Events 2026 | OCTG Industry Calendar"
        description="Find 60+ oil, gas, and OCTG industry events for 2026. Discover energy conferences, petroleum exhibitions, and pipe & tube trade shows including ADIPEC, OTC, and Gastech."
        canonical="https://octgindex.com/events"
      />
      <div className="min-h-screen bg-background">
        <Header />

        <main>
          {/* Hero Section */}
          <section className="relative py-16 overflow-hidden">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/images/events-hero-default.jpg')" }}
            />
            
            {/* Theme-Aware Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/90 to-background/80" />
            
            {/* Content */}
            <div className="container relative z-10">
              <div className="max-w-3xl">
                <Badge variant="outline" className="mb-4 border-border">2026 Event Calendar</Badge>
                <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                  OCTG & Energy Events
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
                    className="pl-10 bg-card/50 border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedRegion === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRegion("all")}
                    className={selectedRegion === "all" ? "" : "border-border hover:bg-accent/10"}
                  >
                    All Regions
                  </Button>
                  {regions.map((region) => (
                    <Button
                      key={region}
                      variant={selectedRegion === region ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRegion(region)}
                      className={selectedRegion === region ? "" : "border-border hover:bg-accent/10"}
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
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : (
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="mb-8">
                  <TabsTrigger value="upcoming">
                    Upcoming ({filteredUpcoming.length})
                  </TabsTrigger>
                  <TabsTrigger value="past">
                    Past ({filteredPast.length})
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
                    <div>
                      {Object.entries(upcomingByMonth).map(([month, monthEvents]) => (
                        <MonthSection key={month} month={month} events={monthEvents} />
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
                    <div>
                      {Object.entries(pastByMonth).map(([month, monthEvents]) => (
                        <MonthSection key={month} month={month} events={monthEvents} isPast />
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
