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
    <div className="my-6 pl-4 border-l-2 border-accent/60 not-prose">
      <p className="font-semibold text-foreground text-lg">{name}</p>
      {headquarters && (
        <p className="text-sm text-muted-foreground mb-1">{headquarters}</p>
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