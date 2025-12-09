/**
 * SEO Utilities for title and meta description validation
 * Ensures compliance with search engine best practices
 */

// Title length constraints (35-60 characters)
const MIN_TITLE_LENGTH = 35;
const MAX_TITLE_LENGTH = 60;

// Description length constraints (120-155 characters)
const MIN_DESCRIPTION_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 155;

/**
 * Truncates text to a maximum length while preserving whole words
 */
function truncateToLength(text: string, maxLength: number, suffix = "..."): string {
  if (text.length <= maxLength) return text;
  
  const truncated = text.slice(0, maxLength - suffix.length);
  const lastSpace = truncated.lastIndexOf(" ");
  
  // Prefer to break at word boundary if possible
  if (lastSpace > maxLength * 0.5) {
    return truncated.slice(0, lastSpace) + suffix;
  }
  
  return truncated + suffix;
}

/**
 * Validates and formats a title to meet SEO requirements
 * Target: 35-60 characters
 */
export function formatSEOTitle(title: string, siteName = "OCTG Index"): string {
  const cleanTitle = title.trim();
  
  // If title already includes site name, use as-is
  if (cleanTitle.includes(siteName)) {
    return truncateToLength(cleanTitle, MAX_TITLE_LENGTH);
  }
  
  // Combine title with site name
  const fullTitle = `${cleanTitle} | ${siteName}`;
  
  if (fullTitle.length <= MAX_TITLE_LENGTH) {
    return fullTitle;
  }
  
  // Truncate the main title part to fit with site name
  const availableLength = MAX_TITLE_LENGTH - ` | ${siteName}`.length;
  const truncatedMain = truncateToLength(cleanTitle, availableLength, "...");
  
  return `${truncatedMain} | ${siteName}`;
}

/**
 * Validates and formats a description to meet SEO requirements
 * Target: 120-155 characters
 */
export function formatSEODescription(description: string): string {
  const cleanDesc = description.trim();
  
  if (cleanDesc.length >= MIN_DESCRIPTION_LENGTH && cleanDesc.length <= MAX_DESCRIPTION_LENGTH) {
    return cleanDesc;
  }
  
  if (cleanDesc.length > MAX_DESCRIPTION_LENGTH) {
    return truncateToLength(cleanDesc, MAX_DESCRIPTION_LENGTH);
  }
  
  // If too short, return as-is (better than nothing)
  return cleanDesc;
}

/**
 * Generates a default title for company pages
 */
export function generateCompanyTitle(companyName: string, category?: string): string {
  if (category) {
    return formatSEOTitle(`${companyName} - ${category}`);
  }
  return formatSEOTitle(`${companyName} - OCTG Company`);
}

/**
 * Generates a default description for company pages
 */
export function generateCompanyDescription(
  companyName: string,
  category?: string | null,
  country?: string | null,
  description?: string | null
): string {
  // If there's a description, use it
  if (description && description.length >= MIN_DESCRIPTION_LENGTH) {
    return formatSEODescription(description);
  }
  
  // Generate a default description
  const categoryText = category ? ` ${category}` : " OCTG";
  const locationText = country ? ` based in ${country}` : "";
  
  const generated = `${companyName} is a${categoryText} company${locationText}. View contact details, operations, and industry information on OCTG Index.`;
  
  return formatSEODescription(generated);
}

/**
 * Generates a default title for article pages
 */
export function generateArticleTitle(title: string): string {
  return formatSEOTitle(title);
}

/**
 * Generates a default description for article pages
 */
export function generateArticleDescription(
  subtitle?: string | null,
  body?: string | null
): string {
  // Use subtitle if available
  if (subtitle && subtitle.length >= MIN_DESCRIPTION_LENGTH) {
    return formatSEODescription(subtitle);
  }
  
  // Use first portion of body
  if (body) {
    // Strip markdown formatting
    const cleanBody = body
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, " ")
      .trim();
    
    return formatSEODescription(cleanBody);
  }
  
  // Fallback
  return "Read the latest OCTG industry news, analysis, and market insights on OCTG Index.";
}

/**
 * Generates a default title for CEO pages
 */
export function generateCEOTitle(name: string, title?: string, company?: string): string {
  if (title && company) {
    return formatSEOTitle(`${name}, ${title} at ${company}`);
  }
  return formatSEOTitle(`${name} - OCTG Industry Leader`);
}

/**
 * Generates a default description for CEO pages
 */
export function generateCEODescription(
  name: string,
  title?: string | null,
  company?: string | null,
  bio?: string | null
): string {
  // Use bio if available
  if (bio && bio.length >= MIN_DESCRIPTION_LENGTH) {
    // Strip markdown and get first portion
    const cleanBio = bio
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\n+/g, " ")
      .trim();
    
    return formatSEODescription(cleanBio);
  }
  
  // Generate default
  const titleText = title ? `, ${title}` : "";
  const companyText = company ? ` at ${company}` : "";
  
  return formatSEODescription(
    `Learn about ${name}${titleText}${companyText}. Biography, career highlights, and industry leadership in the OCTG sector on OCTG Index.`
  );
}

/**
 * Generates a default title for region pages
 */
export function generateRegionTitle(regionName: string, type: "news" | "directory" = "news"): string {
  if (type === "directory") {
    return formatSEOTitle(`OCTG Companies in ${regionName}`);
  }
  return formatSEOTitle(`${regionName} OCTG News & Updates`);
}

/**
 * Generates a default description for region pages
 */
export function generateRegionDescription(regionName: string, type: "news" | "directory" = "news", count?: number): string {
  if (type === "directory") {
    const countText = count ? `${count}+ ` : "";
    return formatSEODescription(
      `Discover ${countText}OCTG companies in ${regionName}. Find mills, manufacturers, distributors, inspection services, and drilling contractors.`
    );
  }
  
  return formatSEODescription(
    `Browse OCTG industry news, company directory, and market insights for the ${regionName} region on OCTG Index.`
  );
}

/**
 * Generates a default title for category pages
 */
export function generateCategoryTitle(categoryName: string): string {
  return formatSEOTitle(`${categoryName} Companies - OCTG Directory`);
}

/**
 * Generates a default description for category pages
 */
export function generateCategoryDescription(categoryName: string, categoryDesc?: string, count?: number): string {
  if (categoryDesc) {
    const countText = count ? ` Find ${count}+ companies in this category.` : "";
    return formatSEODescription(`${categoryDesc}${countText}`);
  }
  
  const countText = count ? `${count}+ ` : "";
  return formatSEODescription(
    `Find ${countText}${categoryName.toLowerCase()} companies in the OCTG industry. Connect with manufacturers and suppliers globally.`
  );
}

/**
 * Generates a default title for topic pages
 */
export function generateTopicTitle(topicName: string): string {
  return formatSEOTitle(`${topicName} News & Analysis`);
}

/**
 * Generates a default description for topic pages
 */
export function generateTopicDescription(topicName: string, topicDesc?: string): string {
  if (topicDesc) {
    return formatSEODescription(topicDesc);
  }
  
  return formatSEODescription(
    `Latest ${topicName} news, analysis, and market insights for the OCTG industry. Stay updated with OCTG Index.`
  );
}
