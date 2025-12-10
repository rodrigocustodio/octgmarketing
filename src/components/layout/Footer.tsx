import { Link } from "react-router-dom";
import pipeIcon from "@/assets/logo-side-icon.png";

const footerLinks = {
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
    { name: "Accessories", href: "/octg-directory/accessories" },
  ],
  directories: [
    { name: "Company Directory", href: "/directory" },
    { name: "CEO Directory", href: "/ceo-directory" },
    { name: "Product Directory", href: "/octg-directory" },
    { name: "Events Calendar", href: "/events" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Newsletter Terms", href: "/newsletter-terms" },
    { name: "Admin", href: "/auth" },
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
            <h4 className="font-display text-base font-semibold tracking-tight mb-4 text-accent">Products</h4>
            <ul className="space-y-2">
              {footerLinks.products.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-base font-semibold tracking-tight mb-4 text-accent">Directories</h4>
            <ul className="space-y-2">
              {footerLinks.directories.map((link) => (
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
            <img src={pipeIcon} alt="" className="h-8 w-8" />
            <span className="font-display font-bold tracking-tight">OCTG Index</span>
          </div>
          <p className="text-xs text-muted-foreground">
            OCTG Marketing Group
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} OCTG Index. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
