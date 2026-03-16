import { NextRequest, NextResponse } from "next/server";

// Social media crawler user agents that don't execute JavaScript
const CRAWLER_USER_AGENTS = [
  "linkedinbot",
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "whatsapp",
  "telegrambot",
  "slackbot",
  "discordbot",
  "pinterest",
  "redditbot",
  "embedly",
  "quora link preview",
  "showyoubot",
  "outbrain",
  "rogerbot",
  "baiduspider",
  "yandex",
  "googlebot",
];

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some((crawler) => ua.includes(crawler));
}

export default function middleware(req: NextRequest) {
  const userAgent = req.headers.get("user-agent");

  // Only rewrite for social media crawlers
  if (!isCrawler(userAgent)) {
    return NextResponse.next();
  }

  const url = req.nextUrl;
  const pathname = url.pathname;

  // Match /article/{slug} paths
  const articleMatch = pathname.match(/^\/article\/([^/]+)$/);
  if (!articleMatch) {
    return NextResponse.next();
  }

  const slug = articleMatch[1];

  // Rewrite crawler requests to the serve-og edge function
  const ogUrl = `https://mlhngmnuxoetnlesnxgu.supabase.co/functions/v1/serve-og/article/${slug}`;

  return NextResponse.rewrite(ogUrl);
}

export const config = {
  matcher: "/article/:path*",
};
