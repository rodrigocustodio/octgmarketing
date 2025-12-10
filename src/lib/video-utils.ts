/**
 * Video embed types supported by the platform
 */
export interface VideoEmbed {
  type: 'youtube' | 'bunny-iframe' | 'bunny-direct';
  embedUrl: string;
}

/**
 * Extracts YouTube video ID from various URL formats
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    // Standard watch URL: youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Shortened URL: youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // Embed URL: youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // Live URL: youtube.com/live/VIDEO_ID
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Returns privacy-enhanced YouTube embed URL
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/**
 * Detects video type and returns appropriate embed info
 * Supports: YouTube, Bunny.net Stream iframe, Bunny.net direct video URLs
 */
export function getVideoEmbed(url: string): VideoEmbed | null {
  if (!url) return null;

  // Check YouTube first
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`
    };
  }

  // Check Bunny.net Stream iframe embed URLs
  if (url.includes('mediadelivery.net/embed') || url.includes('bunnycdn.com/embed')) {
    return {
      type: 'bunny-iframe',
      embedUrl: url
    };
  }

  // Check for direct Bunny CDN video URL (mp4/webm)
  if (url.includes('.b-cdn.net') && (url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('.mp4?') || url.includes('.webm?'))) {
    return {
      type: 'bunny-direct',
      embedUrl: url
    };
  }

  return null;
}
