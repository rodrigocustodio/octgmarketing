import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, XCircle, FileText, Hash, ListChecks } from "lucide-react";

interface SEOIndicatorProps {
  length: number;
  min: number;
  max: number;
  label: string;
  className?: string;
}

export const SEOIndicator = ({ length, min, max, label, className }: SEOIndicatorProps) => {
  const isValid = length >= min && length <= max;
  const isTooShort = length < min;
  const isTooLong = length > max;
  
  let statusText = "Valid";
  let statusColor = "text-green-500";
  
  if (isTooShort) {
    statusText = `Too short (min ${min})`;
    statusColor = "text-amber-500";
  } else if (isTooLong) {
    statusText = `Too long (max ${max})`;
    statusColor = "text-red-500";
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-medium tabular-nums",
              isValid 
                ? "bg-green-500/20 text-green-500" 
                : isTooLong 
                  ? "bg-red-500/20 text-red-500"
                  : "bg-amber-500/20 text-amber-500",
              className
            )}
          >
            {length}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{label}</p>
          <p className={statusColor}>{statusText}</p>
          <p className="text-muted-foreground text-xs">Target: {min}-{max} chars</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Word count indicator for article body
interface WordCountIndicatorProps {
  wordCount: number;
  className?: string;
}

export const WordCountIndicator = ({ wordCount, className }: WordCountIndicatorProps) => {
  const min = 1800;
  const max = 2200;
  const isValid = wordCount >= min && wordCount <= max;
  const isTooShort = wordCount < min;
  const isTooLong = wordCount > max;
  
  let statusText = "Optimal length";
  let statusColor = "text-green-500";
  let Icon = CheckCircle2;
  
  if (isTooShort) {
    statusText = `Too short (min ${min})`;
    statusColor = "text-amber-500";
    Icon = AlertCircle;
  } else if (isTooLong) {
    statusText = `Too long (max ${max})`;
    statusColor = "text-amber-500";
    Icon = AlertCircle;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
              isValid 
                ? "bg-green-500/20 text-green-500" 
                : "bg-amber-500/20 text-amber-500",
              className
            )}
          >
            <FileText className="h-3 w-3" />
            <span className="tabular-nums">{wordCount.toLocaleString()} words</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Article Length</p>
          <p className={statusColor}>{statusText}</p>
          <p className="text-muted-foreground text-xs">Target: {min.toLocaleString()}-{max.toLocaleString()} words</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// FAQ section indicator
interface FAQIndicatorProps {
  hasFAQ: boolean;
  faqCount: number;
  className?: string;
}

export const FAQIndicator = ({ hasFAQ, faqCount, className }: FAQIndicatorProps) => {
  const isValid = hasFAQ && faqCount >= 3;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
              isValid 
                ? "bg-green-500/20 text-green-500" 
                : "bg-amber-500/20 text-amber-500",
              className
            )}
          >
            <ListChecks className="h-3 w-3" />
            <span>FAQ: {faqCount}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">FAQ Section</p>
          <p className={isValid ? "text-green-500" : "text-amber-500"}>
            {isValid ? "Valid (3+ questions)" : "Needs 3+ FAQ questions"}
          </p>
          <p className="text-muted-foreground text-xs">Include 3-5 FAQ questions for SEO</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// H2/H3 heading structure indicator
interface HeadingStructureIndicatorProps {
  h2Count: number;
  h3Count: number;
  className?: string;
}

export const HeadingStructureIndicator = ({ h2Count, h3Count, className }: HeadingStructureIndicatorProps) => {
  const isValid = h2Count >= 4 && h3Count >= 6;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
              isValid 
                ? "bg-green-500/20 text-green-500" 
                : "bg-amber-500/20 text-amber-500",
              className
            )}
          >
            <Hash className="h-3 w-3" />
            <span>H2:{h2Count} H3:{h3Count}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Heading Structure</p>
          <p className={isValid ? "text-green-500" : "text-amber-500"}>
            {isValid ? "Good hierarchy" : "Needs more headings"}
          </p>
          <p className="text-muted-foreground text-xs">Target: 4+ H2s, 6+ H3s</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Utility functions for validation
export const isTitleValid = (title: string): boolean => {
  return title.length >= 50 && title.length <= 60;
};

export const isDescriptionValid = (desc: string | null | undefined): boolean => {
  if (!desc) return false;
  return desc.length >= 150 && desc.length <= 160;
};

export const isWordCountValid = (wordCount: number): boolean => {
  return wordCount >= 1800 && wordCount <= 2200;
};

export const getWordCount = (text: string | null | undefined): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const getFAQCount = (text: string | null | undefined): number => {
  if (!text) return 0;
  // Count H3 headings that look like questions (contain ?)
  const h3Matches = text.match(/^###\s+[^#\n]*\?/gm);
  return h3Matches ? h3Matches.length : 0;
};

export const getHeadingCounts = (text: string | null | undefined): { h2: number; h3: number } => {
  if (!text) return { h2: 0, h3: 0 };
  const h2Matches = text.match(/^##\s+[^#]/gm);
  const h3Matches = text.match(/^###\s+[^#]/gm);
  return {
    h2: h2Matches ? h2Matches.length : 0,
    h3: h3Matches ? h3Matches.length : 0
  };
};

export const hasFAQSection = (text: string | null | undefined): boolean => {
  if (!text) return false;
  return /##\s*(Frequently Asked Questions|FAQ)/i.test(text);
};

export default SEOIndicator;
