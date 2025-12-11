import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Newspaper, 
  FileEdit, 
  Settings, 
  LogOut,
  ChevronLeft,
  Workflow,
  Globe,
  PenSquare,
  FilePlus,
  Users,
  Building2,
  CalendarDays,
  Package,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Editorial Room",
    href: "/admin/editorial-room",
    icon: BarChart3,
  },
  {
    title: "Create Article",
    href: "/admin/create",
    icon: FilePlus,
  },
  {
    title: "Pipeline",
    href: "/admin/pipeline",
    icon: Workflow,
  },
  {
    title: "Source Queue",
    href: "/admin/sources",
    icon: Newspaper,
  },
  {
    title: "Source Config",
    href: "/admin/sources-config",
    icon: Globe,
  },
  {
    title: "Draft Review",
    href: "/admin/drafts",
    icon: FileEdit,
  },
  {
    title: "Edit Articles",
    href: "/admin/articles",
    icon: PenSquare,
  },
  {
    title: "CEO Directory",
    href: "/admin/executives",
    icon: Users,
  },
  {
    title: "Companies",
    href: "/admin/companies",
    icon: Building2,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Events",
    href: "/admin/events",
    icon: CalendarDays,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

const AdminSidebar = () => {
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <Link to="/admin" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight">OCTG</span>
          <span className="text-muted-foreground">Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/admin" && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-border space-y-4">
        <div className="px-4 py-2 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium truncate text-foreground">{user?.email}</p>
          <p className="text-xs text-foreground/70">
            {isAdmin ? "Administrator" : "Editor"}
          </p>
        </div>

        <div className="space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Site
          </Link>
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 text-foreground hover:bg-muted"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;