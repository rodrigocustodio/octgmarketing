import { Link } from "react-router-dom";
import { MapPin, Globe, ArrowRight } from "lucide-react";
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
    <div className="my-8 flex w-full rounded-xl shadow-lg overflow-hidden border border-border bg-muted hover:shadow-xl transition-shadow duration-300 not-prose">
      
      {/* Left accent bar */}
      <div className="w-1.5 bg-accent flex-shrink-0" />

      {/* Main content */}
      <div className="flex-1 px-6 py-4 flex flex-col justify-between">
        <div>
          {/* Company name */}
          <h3 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
            {name}
          </h3>

          {/* Location */}
          {headquarters && (
            <div className="flex items-center text-muted-foreground mb-2">
              <MapPin className="w-4 h-4 mr-2 text-accent" />
              <span className="text-sm font-medium">{headquarters}</span>
            </div>
          )}

          {/* Website */}
          {website && (
            <div className="flex items-center text-muted-foreground mb-6">
              <Globe className="w-4 h-4 mr-2 text-accent" />
              <a 
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:text-accent transition-colors"
              >
                {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </div>
          )}
        </div>

        {/* Action button with animated arrow */}
        <Button asChild className="w-full group bg-accent hover:bg-accent/90 !text-white">
          <Link to={`/directory/company/${slug}`} className="flex items-center justify-center gap-2">
            <span>View Company Profile</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  );
}