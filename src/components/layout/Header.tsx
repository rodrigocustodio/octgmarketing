import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PriceTicker } from "./PriceTicker";

const regions = [
  { name: "Americas", slug: "americas" },
  { name: "Europe", slug: "europe" },
  { name: "Africa", slug: "africa" },
  { name: "Middle East", slug: "middle-east" },
  { name: "Asia-Pacific", slug: "asia-pacific" },
  { name: "Australia", slug: "australia" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/98 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div>
            <span className="font-display text-xl font-bold tracking-tight">OCTG</span>
            <span className="ml-1 text-xl text-muted-foreground">Index</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {regions.map((region) => (
            <Link key={region.slug} to={`/region/${region.slug}`}>
              <Button variant="nav" size="sm">{region.name}</Button>
            </Link>
          ))}
          <Link to="/directory">
            <Button variant="nav" size="sm">OCTG Directory</Button>
          </Link>
          <Link to="/ceo-directory">
            <Button variant="nav" size="sm">Leadership</Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Full-width bronze divider */}
      <div className="w-full border-b-2 border-accent/30" />

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background p-4 animate-fade-in">
          <nav className="flex flex-col gap-2">
            {regions.map((region) => (
              <Link key={region.slug} to={`/region/${region.slug}`} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="nav" className="w-full justify-start">{region.name}</Button>
              </Link>
            ))}
            <Link to="/directory" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="nav" className="w-full justify-start">OCTG Directory</Button>
            </Link>
            <Link to="/ceo-directory" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="nav" className="w-full justify-start">Leadership</Button>
            </Link>
          </nav>
        </div>
      )}

      <PriceTicker />
    </header>
  );
}
