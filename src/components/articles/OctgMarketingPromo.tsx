import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import octgMarketingTeam from "/images/octg-marketing-team.jpg";

export function OctgMarketingPromo() {
  return (
    <Card className="overflow-hidden border-border/50 bg-card">
      {/* Image Section */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={octgMarketingTeam}
          alt="OCTG Marketing creative team"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-4">
        <h3 className="font-display text-lg font-bold leading-snug text-foreground">
          Struggling with Marketing for Your Energy Business?
        </h3>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          OCTG Marketing delivers creative solutions tailored for the Energy & Oil Gas sector — from branding to digital campaigns.
        </p>

        <Button
          asChild
          className="w-full bg-gradient-to-r from-octg-bronze via-octg-gold to-octg-copper hover:opacity-90 text-white font-semibold"
        >
          <a
            href="https://octgmarketing.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            Transform Your Brand
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </Card>
  );
}
