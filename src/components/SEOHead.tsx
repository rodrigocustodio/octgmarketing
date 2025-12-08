import { Helmet } from "react-helmet-async";

const DEFAULT_OG_IMAGE = "https://octgindex.com/og-default.png";
const SITE_NAME = "OCTG Index";
const TWITTER_HANDLE = "@OCTGMarketing";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  section?: string;
}

export function SEOHead({
  title,
  description,
  canonical,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  publishedTime,
  section,
}: SEOHeadProps) {
  // Ensure image is absolute URL
  const ogImage = image.startsWith("http") ? image : DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {section && <meta property="article:section" content={section} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
