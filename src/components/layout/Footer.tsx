import { Link } from "react-router-dom";
import pipeIcon from "@/assets/logo-side-icon.png";

// Footer links organized by NEWS-FIRST strategy priority
const footerLinks = {
  news: [
    { name: "All News", href: "/news" },
    { name: "Americas", href: "/region/americas" },
    { name: "Europe", href: "/region/europe" },
    { name: "Africa", href: "/region/africa" },
    { name: "Middle East", href: "/region/middle-east" },
    { name: "Asia-Pacific", href: "/region/asia-pacific" },
    { name: "Australia", href: "/region/australia" },
  ],
  events: [
    { name: "Events Calendar", href: "/events" },
    { name: "Market Prices", href: "/pricing-index" },
    { name: "All Topics", href: "/topics" },
  ],
  directory: [
    { name: "Company Directory", href: "/directory" },
    { name: "Product Directory", href: "/octg-directory" },
    { name: "Global Leaders", href: "/ceo-directory" },
  ],
  connect: [
    { name: "Contact Us", href: "/contact" },
    { name: "About Us", href: "/about" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Editorial Policy", href: "/editorial-policy" },
    { name: "Newsletter Terms", href: "/newsletter-terms" },
    { name: "Admin", href: "/auth" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div>
            <h4 className="font-display text-base font-semibold tracking-tight mb-4 text-accent">News</h4>
            <ul className="space-y-2">
              {footerLinks.news.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-base font-semibold tracking-tight mb-4 text-accent">Events & Market</h4>
            <ul className="space-y-2">
              {footerLinks.events.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-base font-semibold tracking-tight mb-4 text-accent">Directory</h4>
            <ul className="space-y-2">
              {footerLinks.directory.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-base font-semibold tracking-tight mb-4 text-accent">Connect</h4>
            <ul className="space-y-2">
              {footerLinks.connect.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-base font-semibold tracking-tight mb-4 text-accent">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border">
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Logo + Company Description for E-E-A-T - News-first positioning */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <img src={pipeIcon} alt="OCTG Index logo" className="h-8 w-8" />
                <span className="font-display font-bold tracking-tight">OCTG Index</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                OCTG Index is a global energy industry news platform covering OCTG markets, 
                supply chains, pricing intelligence, and major energy events worldwide. 
                Founded in 2024 in Houston, Texas, our editorial team delivers accurate, 
                timely reporting across all major oil and gas markets to energy professionals globally.
              </p>
            </div>
            
            {/* Contact Info */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Contact Us</p>
              <p>info@octgindex.com</p>
              <p>Houston, Texas, USA</p>
              <p className="text-xs">Global Coverage • 24/7 News Desk</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-border/50 pt-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} OCTG Index. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-muted-foreground">
              <span>Trusted by Energy Professionals</span>
              <span>•</span>
              <span>Independent Editorial</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
