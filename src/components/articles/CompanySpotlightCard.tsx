import { Link } from "react-router-dom";

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
    <div className="pl-3 border-l-2 border-accent/60 space-y-0.5">
      <p className="font-semibold text-foreground text-base leading-snug">{name}</p>
      {headquarters && (
        <p className="text-sm text-muted-foreground leading-snug">{headquarters}</p>
      )}
      <Link 
        to={`/directory/company/${slug}`} 
        className="text-sm text-accent hover:underline inline-flex items-center gap-1"
      >
        View company profile →
      </Link>
    </div>
  );
}