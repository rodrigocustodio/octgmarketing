import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import ShareButtons from "@/components/articles/ShareButtons";
import RelatedArticles from "@/components/articles/RelatedArticles";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { Badge } from "@/components/ui/badge";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Calendar, Clock, User } from "lucide-react";

// Sample article data - in production this would come from Supabase
const sampleArticle = {
  title: "Vallourec Announces $2.3B Strategic Investment in Seamless Pipe Production",
  subtitle: "French steelmaker doubles down on premium OCTG for deepwater applications amid growing offshore demand",
  body: `
    <p class="lead">In a move that signals renewed confidence in the offshore drilling sector, Vallourec has unveiled plans for a comprehensive expansion of its seamless pipe manufacturing capabilities, targeting the premium OCTG segment that serves deepwater and high-pressure, high-temperature (HPHT) applications.</p>

    <h2>Strategic Expansion Details</h2>
    
    <p>The investment, spread across facilities in Brazil, France, and Indonesia, represents one of the largest capital commitments in the OCTG industry this decade. Company executives emphasized that the expansion directly responds to operator demand for advanced metallurgical solutions capable of withstanding extreme subsea conditions.</p>

    <blockquote>
      "The offshore renaissance is real, and operators are increasingly turning to premium connections and proprietary grades that can handle the challenges of ultra-deepwater development. This investment positions Vallourec as the partner of choice for the most demanding applications."
      <cite>— Philippe Crouzet, Chairman of the Board, Vallourec</cite>
    </blockquote>

    <p>The Brazilian facility in Jeceaba will receive the largest share of the investment, with new heat treatment lines and threading capabilities expected to increase premium OCTG capacity by 40%. The facility already serves as a key supplier to Petrobras and other operators in the prolific pre-salt basins.</p>

    <h2>Market Context and Demand Drivers</h2>

    <p>The announcement comes at a pivotal moment for the global OCTG market. After years of subdued offshore activity, exploration and production spending is accelerating, particularly in deepwater basins off Brazil, Guyana, and West Africa. Industry analysts project offshore drilling expenditure to exceed $95 billion annually by 2027.</p>

    <p>Premium OCTG products—characterized by proprietary connections, advanced steel grades, and enhanced corrosion resistance—command significant price premiums over standard API products. Margins on these specialty items can exceed 25%, compared to single-digit margins on commodity tubulars.</p>

    <h2>Competitive Implications</h2>

    <p>The investment intensifies competition in the premium OCTG segment, where Vallourec faces rivals including Tenaris, Nippon Steel, and JFE Steel. Each competitor has announced expansion plans or technology partnerships aimed at capturing growing offshore demand.</p>

    <p>Tenaris recently completed a $1.8 billion bay facility in Texas optimized for shale applications but with flexibility for offshore products. Meanwhile, Japanese manufacturers have focused on proprietary grades for extreme sour service conditions prevalent in Middle Eastern developments.</p>

    <h2>Environmental and Regulatory Considerations</h2>

    <p>Vallourec emphasized that the expansion incorporates state-of-the-art emissions reduction technology, aligning with European Union sustainability requirements and the company's 2030 carbon neutrality commitments. The Brazilian operations will utilize renewable energy sources, including hydroelectric power, for a significant portion of production.</p>

    <p>Industry observers note that environmental credentials increasingly influence operator procurement decisions, particularly among European majors like Equinor, Shell, and TotalEnergies, who face stakeholder pressure to decarbonize supply chains.</p>

    <h2>Timeline and Expected Impact</h2>

    <p>Construction is scheduled to commence in Q2 2025, with initial production increases expected by late 2026. Full capacity utilization is projected for 2028, coinciding with anticipated peak demand from current offshore development projects in the planning stages.</p>

    <p>Vallourec expects the investment to generate approximately 800 direct jobs across the three facilities, with significant additional employment in supporting industries and logistics.</p>
  `,
  heroImage: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1600",
  author: {
    name: "Marcus Chen",
    role: "Senior Industry Analyst",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
  },
  publishDate: "December 7, 2024",
  readingTime: "6 min read",
  region: "Europe",
  regionSlug: "europe",
  topic: "Mills",
  slug: "vallourec-strategic-investment",
  companies: ["Vallourec", "Tenaris", "Petrobras", "Nippon Steel"],
};

const relatedArticles = [
  {
    title: "Tenaris Expands U.S. Manufacturing Capacity",
    region: "Americas",
    date: "December 6, 2024",
    slug: "tenaris-us-expansion",
  },
  {
    title: "Middle East Rig Count Reaches Five-Year High",
    region: "Middle East",
    date: "December 5, 2024",
    slug: "middle-east-rig-count",
  },
  {
    title: "EU Carbon Regulations Impact Steel Pricing",
    region: "Europe",
    date: "December 4, 2024",
    slug: "eu-carbon-regulations",
  },
];

const moreArticles = [
  {
    title: "Norwegian Continental Shelf Activity Surges",
    subtitle: "Equinor leads development push with new Johan Sverdrup phase",
    imageUrl: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800",
    region: "Europe",
    topic: "Exploration",
    date: "December 3, 2024",
    slug: "norwegian-shelf-activity",
  },
  {
    title: "ArcelorMittal Secures Major North Sea Contract",
    subtitle: "Five-year supply agreement covers premium casing and tubing",
    imageUrl: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800",
    region: "Europe",
    topic: "Contracts",
    date: "December 2, 2024",
    slug: "arcelormittal-north-sea",
  },
  {
    title: "UK Carbon Capture Projects Boost Tubular Demand",
    subtitle: "Net-zero initiatives create new market opportunities",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    region: "Europe",
    topic: "Markets",
    date: "December 1, 2024",
    slug: "uk-carbon-capture",
  },
];

const Article = () => {
  const { slug } = useParams();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      <Helmet>
        <title>{sampleArticle.title} | OCTG Intelligence</title>
        <meta name="description" content={sampleArticle.subtitle} />
        <meta property="og:title" content={sampleArticle.title} />
        <meta property="og:description" content={sampleArticle.subtitle} />
        <meta property="og:image" content={sampleArticle.heroImage} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={sampleArticle.title} />
        <meta name="twitter:description" content={sampleArticle.subtitle} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent z-10" />
            <div 
              className="absolute inset-0 opacity-40 dark:opacity-50"
              style={{
                backgroundImage: `url(${sampleArticle.heroImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center right',
              }}
            />
            
            <div className="container relative z-20 py-12 sm:py-20">
              {/* Breadcrumbs */}
              <Breadcrumb className="mb-6">
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
                    <BreadcrumbLink asChild>
                      <Link 
                        to={`/region/${sampleArticle.regionSlug}`} 
                        className="text-muted-foreground hover:text-accent"
                      >
                        {sampleArticle.region}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-foreground/70 truncate max-w-[200px] sm:max-w-none">
                      {sampleArticle.title}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {/* Badges */}
              <div className="flex gap-2 mb-4">
                <Badge variant="default" className="bg-accent text-accent-foreground">
                  {sampleArticle.region}
                </Badge>
                <Badge variant="outline">
                  {sampleArticle.topic}
                </Badge>
              </div>

              {/* Title */}
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 max-w-4xl">
                {sampleArticle.title}
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mb-6">
                {sampleArticle.subtitle}
              </p>

              {/* Author & Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <img 
                    src={sampleArticle.author.avatar} 
                    alt={sampleArticle.author.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-accent/30"
                  />
                  <div>
                    <p className="font-medium text-foreground">{sampleArticle.author.name}</p>
                    <p className="text-xs">{sampleArticle.author.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{sampleArticle.publishDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{sampleArticle.readingTime}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="container py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Article Body */}
              <div className="lg:col-span-2">
                <article 
                  className="prose dark:prose-invert prose-lg max-w-none
                    prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                    prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                    prose-p:text-foreground/85 prose-p:leading-relaxed
                    prose-p.lead:text-xl prose-p.lead:text-foreground/90 prose-p.lead:font-medium
                    prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:pl-6 
                    prose-blockquote:italic prose-blockquote:text-foreground/80
                    prose-blockquote:not-italic prose-blockquote:font-normal
                    [&_blockquote_cite]:block [&_blockquote_cite]:mt-3 [&_blockquote_cite]:text-sm 
                    [&_blockquote_cite]:text-accent [&_blockquote_cite]:not-italic
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: sampleArticle.body }}
                />

                {/* Companies Mentioned */}
                {sampleArticle.companies.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-border">
                    <h3 className="font-display text-base font-semibold tracking-tight mb-4 text-muted-foreground">
                      Companies Mentioned
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {sampleArticle.companies.map((company) => (
                        <Badge key={company} variant="secondary" className="text-sm">
                          {company}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="space-y-6">
                {/* Share Buttons */}
                <ShareButtons 
                  url={currentUrl}
                  title={sampleArticle.title}
                  subtitle={sampleArticle.subtitle}
                />

                {/* Related Articles */}
                <RelatedArticles 
                  articles={relatedArticles}
                  currentRegion={sampleArticle.region}
                />

                {/* Newsletter Mini */}
                <div className="hidden lg:block">
                  <NewsletterSignup />
                </div>
              </aside>
            </div>
          </section>

          {/* More from Region */}
          <section className="border-t border-border">
            <div className="container py-12">
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-8">
                More from {sampleArticle.region}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {moreArticles.map((article, index) => (
                  <ArticleCard key={index} {...article} />
                ))}
              </div>
            </div>
          </section>

          {/* Newsletter CTA */}
          <section className="bg-card border-t border-border">
            <div className="container py-12 sm:py-16">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-4">
                  Stay Informed
                </h2>
                <p className="text-muted-foreground mb-8">
                  Get the latest OCTG industry news and analysis delivered to your inbox weekly.
                </p>
                <div className="max-w-md mx-auto">
                  <NewsletterSignup />
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Article;
