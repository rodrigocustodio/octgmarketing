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

// NEWS-FIRST navigation priority order
const regions = [
  { name: "Americas", slug: "americas" },
  { name: "Europe", slug: "europe" },
  { name: "Africa", slug: "africa" },
  { name: "Middle East", slug: "middle-east" },
  { name: "Asia-Pacific", slug: "asia-pacific" },
  { name: "Australia", slug: "australia" },
];

// Directory links grouped for dropdown
const directoryLinks = [
  { name: "Companies", href: "/directory" },
  { name: "Products", href: "/octg-directory" },
  { name: "Global Leaders", href: "/ceo-directory" },
];

// Mobile menu organized by NEWS-FIRST priority
const mobileMenuLinks = {
  news: [
    { name: "All News", href: "/news" },
    { name: "Americas", href: "/region/americas" },
    { name: "Europe", href: "/region/europe" },
    { name: "Africa", href: "/region/africa" },
    { name: "Middle East", href: "/region/middle-east" },
    { name: "Asia-Pacific", href: "/region/asia-pacific" },
    { name: "Australia", href: "/region/australia" },
  ],
  eventsMarket: [
    { name: "Events Calendar", href: "/events" },
    { name: "Market Prices", href: "/pricing-index" },
  ],
  directory: [
    { name: "Companies", href: "/directory" },
    { name: "Products", href: "/octg-directory" },
    { name: "Global Leaders", href: "/ceo-directory" },
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

          {/* Desktop Navigation - NEWS-FIRST priority order */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link to="/news">
              <Button variant="nav" size="sm">News</Button>
            </Link>
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
            <Link to="/events">
              <Button variant="nav" size="sm">Events</Button>
            </Link>
            <Link to="/pricing-index">
              <Button variant="nav" size="sm">Market Prices</Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="nav" size="sm" className="gap-1">
                  Directory
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {directoryLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link to={link.href} className="w-full cursor-pointer">
                      {link.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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

            {/* Grid layout - NEWS-FIRST priority */}
            <div className="grid grid-cols-2 gap-6">
              {/* News & Regions */}
              <div>
                <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-3">News</h3>
                <ul className="space-y-2">
                  {mobileMenuLinks.news.map((link) => (
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

              {/* Events & Market */}
              <div>
                <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-3">Events & Market</h3>
                <ul className="space-y-2">
                  {mobileMenuLinks.eventsMarket.map((link) => (
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

              {/* Directory */}
              <div className="col-span-2">
                <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-3">Directory</h3>
                <ul className="grid grid-cols-3 gap-2">
                  {mobileMenuLinks.directory.map((link) => (
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
