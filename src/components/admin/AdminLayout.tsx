import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-end px-6 sticky top-0 z-10">
          <ThemeToggle />
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;