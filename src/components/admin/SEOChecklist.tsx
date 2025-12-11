import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  isTitleValid, 
  isDescriptionValid, 
  isWordCountValid, 
  getWordCount, 
  getFAQCount, 
  getHeadingCounts,
  hasFAQSection 
} from "./SEOIndicator";

interface SEOChecklistProps {
  title: string;
  description: string | null | undefined;
  body: string | null | undefined;
  className?: string;
}

interface CheckItem {
  label: string;
  status: "pass" | "fail" | "warning";
  detail: string;
}

export const SEOChecklist = ({ title, description, body, className }: SEOChecklistProps) => {
  const wordCount = getWordCount(body);
  const faqCount = getFAQCount(body);
  const headings = getHeadingCounts(body);
  const hasFAQ = hasFAQSection(body);

  const checks: CheckItem[] = [
    {
      label: "Title length (50-60 chars)",
      status: isTitleValid(title) ? "pass" : title.length > 60 ? "fail" : "warning",
      detail: `${title.length} characters`
    },
    {
      label: "Meta description (150-160 chars)",
      status: isDescriptionValid(description) ? "pass" : !description ? "fail" : description.length > 160 ? "fail" : "warning",
      detail: description ? `${description.length} characters` : "Missing"
    },
    {
      label: "Word count (1,800-2,200)",
      status: isWordCountValid(wordCount) ? "pass" : wordCount < 1800 ? "warning" : "warning",
      detail: `${wordCount.toLocaleString()} words`
    },
    {
      label: "Heading structure (4+ H2, 6+ H3)",
      status: headings.h2 >= 4 && headings.h3 >= 6 ? "pass" : "warning",
      detail: `${headings.h2} H2s, ${headings.h3} H3s`
    },
    {
      label: "FAQ section (3-5 questions)",
      status: hasFAQ && faqCount >= 3 ? "pass" : faqCount > 0 ? "warning" : "fail",
      detail: hasFAQ ? `${faqCount} questions` : "Missing FAQ section"
    }
  ];

  const passCount = checks.filter(c => c.status === "pass").length;
  const totalChecks = checks.length;

  const getStatusIcon = (status: CheckItem["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusColor = (status: CheckItem["status"]) => {
    switch (status) {
      case "pass":
        return "text-green-500";
      case "fail":
        return "text-red-500";
      case "warning":
        return "text-amber-500";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">SEO Checklist</h4>
        <span className={cn(
          "text-xs font-medium px-2 py-0.5 rounded",
          passCount === totalChecks 
            ? "bg-green-500/20 text-green-500" 
            : passCount >= 3 
              ? "bg-amber-500/20 text-amber-500"
              : "bg-red-500/20 text-red-500"
        )}>
          {passCount}/{totalChecks} passed
        </span>
      </div>
      
      <div className="space-y-2">
        {checks.map((check, index) => (
          <div key={index} className="flex items-start gap-2 text-sm">
            {getStatusIcon(check.status)}
            <div className="flex-1 min-w-0">
              <span className="text-foreground">{check.label}</span>
              <span className={cn("ml-2 text-xs", getStatusColor(check.status))}>
                ({check.detail})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SEOChecklist;
