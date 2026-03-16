import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for safe rendering
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Convert markdown to sanitized HTML to prevent XSS attacks
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  // Remove "Last Updated" lines from legacy article content
  markdown = markdown.replace(/\*?\*?Last Updated:?\*?\*?:?\s*.+/gi, '');
  const rawHtml = marked.parse(markdown) as string;
  // Sanitize HTML to prevent XSS - allow safe tags for article content
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'ul', 'ol', 'li', 
                   'strong', 'em', 'b', 'i', 'u', 'a', 'blockquote', 'code', 'pre', 
                   'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'figure', 'figcaption'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Split markdown content at the middle H2 heading for inserting inline content
 * Returns [firstHalf, secondHalf] - if not enough sections, secondHalf is empty
 */
export function splitMarkdownAtMiddle(markdown: string): [string, string] {
  if (!markdown) return ['', ''];
  
  // Find all H2 (##) heading positions using regex
  const h2Regex = /^##\s+.+$/gm;
  const matches = [...markdown.matchAll(h2Regex)];
  
  // Need at least 2 H2 sections to split
  if (matches.length < 2) {
    return [markdown, ''];
  }
  
  // Find the middle H2 position (favor later half)
  const middleIndex = Math.ceil(matches.length / 2);
  const splitMatch = matches[middleIndex];
  
  if (!splitMatch || splitMatch.index === undefined) {
    return [markdown, ''];
  }
  
  const splitPoint = splitMatch.index;
  
  return [
    markdown.slice(0, splitPoint).trim(),
    markdown.slice(splitPoint).trim()
  ];
}
