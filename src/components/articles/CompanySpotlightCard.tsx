import { Link } from "react-router-dom";
import { Building2, ArrowRight } from "lucide-react";

interface CompanySpotlightCardProps {
  name: string;
  slug: string;
  headquarters?: string | null;
  website?: string | null;
}

export function CompanySpotlightCard({ 
  name, 
  slug, 
  headquarters 
}: CompanySpotlightCardProps) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-muted/60 via-muted/40 to-background border border-border/50 p-4 flex gap-3">
      {/* Accent bar */}
      <div className="w-1 bg-accent/70 rounded-full flex-shrink-0" />
      
      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="flex items-start gap-2">
          <Building2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground text-base leading-snug">{name}</p>
            {headquarters && (
              <p className="text-sm text-muted-foreground leading-snug">{headquarters}</p>
            )}
          </div>
        </div>
        
        <Link 
          to={`/directory/company/${slug}`} 
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors group"
        >
          View company profile
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}