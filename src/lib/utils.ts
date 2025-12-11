import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Bunny CDN Image Optimizer utility
 * Appends optimization parameters to Bunny CDN URLs for automatic resizing and format conversion
 * Also handles Supabase Storage URLs by routing through Bunny optimizer
 */
interface ImageOptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
}

export function optimizeImageUrl(
  url: string | null | undefined,
  options: ImageOptimizeOptions = {}
): string | undefined {
  if (!url) return undefined;
  
  // Bunny CDN URLs - apply optimizer params directly
  if (url.includes('tukia-cdn.b-cdn.net')) {
    const params = new URLSearchParams();
    
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', options.quality.toString());
    
    const paramString = params.toString();
    if (!paramString) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${paramString}`;
  }
  
  // Supabase Storage URLs - apply same optimization params
  // Supabase supports image transformation via URL params
  if (url.includes('supabase.co/storage')) {
    const params = new URLSearchParams();
    
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', options.quality.toString());
    
    const paramString = params.toString();
    if (!paramString) return url;
    
    // Supabase uses /render/image/public/ for transformations
    // Convert storage URL to render URL format
    const renderUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    const separator = renderUrl.includes('?') ? '&' : '?';
    return `${renderUrl}${separator}${paramString}`;
  }
  
  return url;
}

/**
 * Parse date string as local time to avoid timezone shifts.
 * Date-only strings like "2026-01-13" are parsed as UTC by default,
 * which can shift to the previous day in local timezones behind UTC.
 */
export function parseLocalDate(dateString: string): Date {
  // If it's a date-only string (YYYY-MM-DD), append time to force local parsing
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString + "T00:00:00");
  }
  return new Date(dateString);
}
