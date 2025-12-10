import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PriceTicker } from "./PriceTicker";
import { SearchDialog } from "@/components/search/SearchDialog";
import pipeIcon from "@/assets/logo-side-icon.png";

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
            {regions.map((region) => (
              <Link key={region.slug} to={`/region/${region.slug}`}>
                <Button variant="nav" size="sm">{region.name}</Button>
              </Link>
            ))}
            <Link to="/directory">
              <Button variant="nav" size="sm">Companies</Button>
            </Link>
            <Link to="/octg-directory">
              <Button variant="nav" size="sm">Products</Button>
            </Link>
            <Link to="/ceo-directory">
              <Button variant="nav" size="sm">Leadership</Button>
            </Link>
            <Link to="/events">
              <Button variant="nav" size="sm">Events</Button>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
              onClick={() => setSearchOpen(true)}
              title="Search (⌘K)"
            >
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
              <Button
                variant="nav"
                className="w-full justify-start"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              {regions.map((region) => (
                <Link key={region.slug} to={`/region/${region.slug}`} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="nav" className="w-full justify-start">{region.name}</Button>
                </Link>
              ))}
              <Link to="/directory" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="nav" className="w-full justify-start">Companies</Button>
              </Link>
              <Link to="/octg-directory" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="nav" className="w-full justify-start">Products</Button>
              </Link>
              <Link to="/ceo-directory" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="nav" className="w-full justify-start">Leadership</Button>
              </Link>
              <Link to="/events" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="nav" className="w-full justify-start">Events</Button>
              </Link>
            </nav>
          </div>
        )}

        <PriceTicker />
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
