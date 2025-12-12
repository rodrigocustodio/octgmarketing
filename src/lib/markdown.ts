import { marked } from 'marked';

// Configure marked for safe rendering
marked.setOptions({
  gfm: true,
  breaks: true,
});

export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  return marked.parse(markdown) as string;
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
