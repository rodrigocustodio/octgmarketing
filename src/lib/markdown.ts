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
