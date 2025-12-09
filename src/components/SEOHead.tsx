import { Helmet } from "react-helmet-async";
import { formatSEOTitle, formatSEODescription } from "@/lib/seo-utils";

const DEFAULT_OG_IMAGE = "https://octgindex.com/og-default.png";
const SITE_NAME = "OCTG Index";
const TWITTER_HANDLE = "@OCTGMarketing";
const SITE_URL = "https://octgindex.com";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  section?: string;
  noindex?: boolean;
}

export function SEOHead({
  title,
  description,
  canonical,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  publishedTime,
  section,
  noindex = false,
}: SEOHeadProps) {
  // Format title and description to meet SEO requirements
  const formattedTitle = formatSEOTitle(title, SITE_NAME);
  const formattedDescription = formatSEODescription(description);
  
  // Ensure image is absolute URL
  const ogImage = image.startsWith("http") ? image : DEFAULT_OG_IMAGE;
  
  // Ensure canonical is absolute URL
  const canonicalUrl = canonical.startsWith("http") 
    ? canonical 
    : `${SITE_URL}${canonical.startsWith("/") ? canonical : `/${canonical}`}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{formattedTitle}</title>
      <meta name="description" content={formattedDescription} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={formattedDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Article specific OG tags */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {section && <meta property="article:section" content={section} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={formattedDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
