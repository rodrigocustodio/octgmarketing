import { Link } from "react-router-dom";

const footerLinks = {
  regions: [
    { name: "Americas", href: "/region/americas" },
    { name: "Europe", href: "/region/europe" },
    { name: "Africa", href: "/region/africa" },
    { name: "Middle East", href: "/region/middle-east" },
    { name: "Asia-Pacific", href: "/region/asia-pacific" },
  ],
  topics: [
    { name: "Mills & Manufacturing", href: "/topic/mills-manufacturing" },
    { name: "Yards & Supply Chain", href: "/topic/yards-supply-chain" },
    { name: "Pricing & Market", href: "/topic/pricing-market" },
    { name: "Projects & Contracts", href: "/topic/projects-contracts" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Advertise", href: "/advertise" },
    { name: "Careers", href: "/careers" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-display text-base font-semibold tracking-tight mb-4 text-accent">Regions</h4>
            <ul className="space-y-2">
              {footerLinks.regions.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-base font-semibold tracking-tight mb-4 text-accent">Topics</h4>
            <ul className="space-y-2">
              {footerLinks.topics.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-base font-semibold tracking-tight mb-4 text-accent">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
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
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent">
              <span className="font-display text-sm font-black text-accent-foreground">O</span>
            </div>
            <span className="font-display font-bold tracking-tight">OCTG Marketing</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} OCTG Marketing. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
