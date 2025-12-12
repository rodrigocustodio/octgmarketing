import { Link } from "react-router-dom";
import { Building2, MapPin, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompanySpotlightCardProps {
  name: string;
  slug: string;
  headquarters?: string | null;
  website?: string | null;
}

export function CompanySpotlightCard({ 
  name, 
  slug, 
  headquarters, 
  website 
}: CompanySpotlightCardProps) {
  return (
    <div className="my-8 rounded-lg border-l-4 border-accent bg-muted/30 p-5 not-prose">
      {/* Title row - icon aligned */}
      <div className="flex items-center gap-2.5 mb-3">
        <Building2 className="h-4 w-4 text-accent flex-shrink-0" />
        <h4 className="font-display text-base font-semibold text-foreground">
          Learn More About {name}
        </h4>
      </div>
      
      {/* Details - icons vertically aligned with title icon */}
      <div className="space-y-2 text-sm text-muted-foreground mb-4">
        {headquarters && (
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 flex-shrink-0 opacity-70" />
            <span>{headquarters}</span>
          </div>
        )}
        
        {website && (
          <div className="flex items-center gap-2.5">
            <Globe className="h-4 w-4 flex-shrink-0 opacity-70" />
            <a 
              href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline truncate"
            >
              {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          </div>
        )}
      </div>
      
      {/* Button - indented to align with text start */}
      <div className="ml-[26px]">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link to={`/directory/company/${slug}`}>
            View Company Profile
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
