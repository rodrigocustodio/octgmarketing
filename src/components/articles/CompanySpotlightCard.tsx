import { Link } from "react-router-dom";
import { MapPin, Globe } from "lucide-react";
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
    <div className="my-8 rounded-xl bg-muted/50 p-6 not-prose text-center">
      {/* Company name as main title */}
      <h4 className="font-display text-xl font-bold text-foreground mb-3">
        {name}
      </h4>
      
      {/* Details - centered with inline icons */}
      <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
        {headquarters && (
          <div className="flex items-center justify-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{headquarters}</span>
          </div>
        )}
        
        {website && (
          <div className="flex items-center justify-center gap-1.5">
            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
            <a 
              href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent hover:underline"
            >
              {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          </div>
        )}
      </div>
      
      {/* Full-width accent button */}
      <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        <Link to={`/directory/company/${slug}`}>
          View Company Profile
        </Link>
      </Button>
    </div>
  );
}
