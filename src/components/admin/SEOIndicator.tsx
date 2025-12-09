import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

export const isTitleValid = (title: string): boolean => {
  return title.length >= 35 && title.length <= 60;
};

export const isDescriptionValid = (desc: string | null | undefined): boolean => {
  if (!desc) return false;
  return desc.length >= 120 && desc.length <= 155;
};

export default SEOIndicator;
