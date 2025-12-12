import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator,
  BreadcrumbPage
} from "@/components/ui/breadcrumb";
import { Globe, Users, Newspaper, Building2, Calendar, TrendingUp } from "lucide-react";
import pipeIcon from "@/assets/logo-side-icon.png";

const About = () => {
  const stats = [
    { label: "Articles Published", value: "500+", icon: Newspaper },
    { label: "Companies Tracked", value: "200+", icon: Building2 },
    { label: "Industry Events", value: "60+", icon: Calendar },
    { label: "Global Regions", value: "6", icon: Globe },
  ];

  const teamMembers = [
    {
      name: "Rodrigo Santos",
      title: "CEO & Founder",
      bio: "Leading OCTG Index's mission to provide comprehensive industry intelligence to energy professionals worldwide.",
      photo: "/images/team/rodrigo-santos.jpg",
    },
    {
      name: "Franklin Clarke",
      title: "Regional Coverage Director",
      bio: "Overseeing coverage across Europe, Australia, and Africa with deep expertise in global OCTG markets.",
      photo: "/images/team/franklin-clarke.jpg",
    },
    {
      name: "Oliver Duncan",
      title: "Events & Calendar Director",
      bio: "Managing event coverage and industry calendar for Middle East and Asia-Pacific regions.",
      photo: "/images/team/oliver-duncan.jpg",
    },
    {
      name: "Maria Oliveira",
      title: "Americas Correspondent",
      bio: "Providing in-depth coverage of North and South American OCTG markets and developments.",
      photo: "/images/team/maria-oliveira.jpg",
    },
  ];

  // Organization Schema for SEO
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://octgindex.com/#organization",
    "name": "OCTG Index",
    "url": "https://octgindex.com",
    "logo": "https://octgindex.com/favicon.png",
    "description": "The leading news and intelligence platform for the global OCTG (Oil Country Tubular Goods) industry.",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Houston",
      "addressRegion": "Texas",
      "addressCountry": "USA"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "info@octgindex.com",
      "contactType": "customer service"
    },
    "sameAs": [
      "https://twitter.com/OCTGMarketing"
    ]
  };

  return (
    <>
      <SEOHead
        title="About OCTG Index | Industry News & Intelligence Platform"
        description="OCTG Index is the leading source for Oil Country Tubular Goods industry news, market analysis, company directory, and global event coverage. Learn about our mission and team."
        canonical="https://octgindex.com/about"
      />
      
      {/* Inject Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-background via-background to-accent/5 py-16 sm:py-24">
            <div className="container">
              {/* Breadcrumbs */}
              <Breadcrumb className="mb-8">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/" className="text-muted-foreground hover:text-accent">
                        Home
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>About</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex items-center gap-4 mb-6">
                <img src={pipeIcon} alt="OCTG Index" className="h-16 w-16" />
                <div>
                  <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                    About OCTG Index
                  </h1>
                </div>
              </div>
              
              <p className="text-xl text-muted-foreground max-w-3xl">
                The leading news and intelligence platform for the global Oil Country Tubular Goods industry, 
                providing comprehensive coverage of market trends, company developments, and industry events.
              </p>
            </div>
          </section>

          {/* Mission Section */}
          <section className="container py-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-6">
                  Our Mission
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    OCTG Index was founded with a clear mission: to become the definitive source of 
                    intelligence for professionals in the Oil Country Tubular Goods industry. We recognize 
                    that the OCTG sector plays a critical role in global energy infrastructure, yet 
                    comprehensive, accessible information has historically been fragmented.
                  </p>
                  <p>
                    Our platform bridges this gap by aggregating and analyzing news from across the globe, 
                    tracking developments at major manufacturers and distributors, and providing actionable 
                    insights that help industry professionals make informed decisions.
                  </p>
                  <p>
                    From Houston to Abu Dhabi, from Singapore to Rotterdam, OCTG Index delivers the 
                    intelligence that matters to pipe and tube professionals worldwide.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-card border border-border rounded-xl p-6 text-center">
                    <stat.icon className="h-8 w-8 text-accent mx-auto mb-3" />
                    <div className="font-display text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* What We Cover Section */}
          <section className="bg-card border-y border-border py-16">
            <div className="container">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-8 text-center">
                What We Cover
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h3 className="font-display text-lg font-semibold mb-2">Market Intelligence</h3>
                  <p className="text-muted-foreground text-sm">
                    Daily coverage of OCTG pricing trends, trade flows, tariffs, and market dynamics 
                    across all major regions including Americas, Europe, Middle East, and Asia-Pacific.
                  </p>
                </div>
                <div className="text-center">
                  <Building2 className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h3 className="font-display text-lg font-semibold mb-2">Company Profiles</h3>
                  <p className="text-muted-foreground text-sm">
                    Comprehensive directory of 200+ OCTG manufacturers, distributors, inspection companies, 
                    and service providers with detailed operational information.
                  </p>
                </div>
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h3 className="font-display text-lg font-semibold mb-2">Industry Events</h3>
                  <p className="text-muted-foreground text-sm">
                    Complete calendar of oil & gas conferences, exhibitions, and trade shows including 
                    ADIPEC, OTC, and regional OCTG gatherings worldwide.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Editorial Team Section */}
          <section className="container py-16">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-8 text-center">
              Our Editorial Team
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              Our team of industry specialists brings decades of combined experience in OCTG markets, 
              energy journalism, and market analysis.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member) => (
                <div key={member.name} className="bg-card border border-border rounded-xl p-6">
                  <div className="w-24 h-24 rounded-xl overflow-hidden mb-4 mx-auto">
                    <img 
                      src={member.photo} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-display font-semibold text-center mb-1">{member.name}</h3>
                  <p className="text-sm text-accent text-center mb-3">{member.title}</p>
                  <p className="text-sm text-muted-foreground text-center">{member.bio}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact CTA */}
          <section className="bg-accent/5 border-t border-border py-16">
            <div className="container text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Get in Touch
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Have questions about our coverage? Interested in advertising or partnerships? 
                We'd love to hear from you.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  to="/contact" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-accent text-accent-foreground h-10 px-6 hover:bg-accent/90 transition-colors"
                >
                  Contact Us
                </Link>
                <Link 
                  to="/editorial-policy" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background h-10 px-6 hover:bg-muted transition-colors"
                >
                  Editorial Policy
                </Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default About;