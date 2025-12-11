import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PriceTicker } from "./PriceTicker";
import { SearchDialog } from "@/components/search/SearchDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import pipeIcon from "@/assets/logo-side-icon.png";

const regions = [
  { name: "Americas", slug: "americas" },
  { name: "Europe", slug: "europe" },
  { name: "Africa", slug: "africa" },
  { name: "Middle East", slug: "middle-east" },
  { name: "Asia-Pacific", slug: "asia-pacific" },
  { name: "Australia", slug: "australia" },
];

const mobileMenuLinks = {
  regions: [
    { name: "Americas", href: "/region/americas" },
    { name: "Europe", href: "/region/europe" },
    { name: "Africa", href: "/region/africa" },
    { name: "Middle East", href: "/region/middle-east" },
    { name: "Asia-Pacific", href: "/region/asia-pacific" },
    { name: "Australia", href: "/region/australia" },
  ],
  products: [
    { name: "All Products", href: "/octg-directory" },
    { name: "Pipe Types", href: "/octg-directory/pipe-types" },
    { name: "Material Grades", href: "/octg-directory/grades" },
    { name: "Connections", href: "/octg-directory/connections" },
  ],
  directories: [
    { name: "Companies", href: "/directory" },
    { name: "Global Leaders", href: "/ceo-directory" },
    { name: "Events", href: "/events" },
    { name: "Pricing", href: "/pricing-index" },
  ],
};

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut: ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/98 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={pipeIcon} alt="" className="h-7 w-7" />
            <div>
              <span className="font-display text-xl font-bold tracking-tight">OCTG</span>
              <span className="ml-1 text-xl text-muted-foreground">Index</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="nav" size="sm" className="gap-1">
                  Regions
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {regions.map((region) => (
                  <DropdownMenuItem key={region.slug} asChild>
                    <Link to={`/region/${region.slug}`} className="w-full cursor-pointer">
                      {region.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/directory">
              <Button variant="nav" size="sm">Companies</Button>
            </Link>
            <Link to="/octg-directory">
              <Button variant="nav" size="sm">Products</Button>
            </Link>
            <Link to="/ceo-directory">
              <Button variant="nav" size="sm">Global Leaders</Button>
            </Link>
            <Link to="/events">
              <Button variant="nav" size="sm">Events</Button>
            </Link>
            <Link to="/contact">
              <Button variant="nav" size="sm">Contact</Button>
            </Link>
            <Link to="/pricing-index">
              <Button variant="nav" size="sm">Pricing</Button>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
              onClick={() => setSearchOpen(true)}
              aria-label="Search (⌘K)"
            >
              <Search className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Full-width bronze divider */}
        <div className="w-full border-b-2 border-accent/30" />

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background p-4 animate-fade-in">
            {/* Search button - full width */}
            <Button
              variant="outline"
              className="w-full justify-start mb-4"
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>

            {/* Grid layout matching footer */}
            <div className="grid grid-cols-2 gap-6">
              {/* Regions */}
              <div>
                <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-3">Regions</h3>
                <ul className="space-y-2">
                  {mobileMenuLinks.regions.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Products */}
              <div>
                <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-3">Products</h3>
                <ul className="space-y-2">
                  {mobileMenuLinks.products.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Directories */}
              <div className="col-span-2">
                <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-3">Directories</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {mobileMenuLinks.directories.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <PriceTicker />
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
