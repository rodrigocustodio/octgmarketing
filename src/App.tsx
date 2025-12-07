import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ScrollRestoration from "@/components/ScrollRestoration";
import Index from "./pages/Index";
import Article from "./pages/Article";
import Region from "./pages/Region";
import Topic from "./pages/Topic";
import Auth from "./pages/Auth";
import Dashboard from "./pages/admin/Dashboard";
import Pipeline from "./pages/admin/Pipeline";
import Sources from "./pages/admin/Sources";
import SourcesConfig from "./pages/admin/SourcesConfig";
import Drafts from "./pages/admin/Drafts";
import DraftDetail from "./pages/admin/DraftDetail";
import Articles from "./pages/admin/Articles";
import ArticleEdit from "./pages/admin/ArticleEdit";
import Settings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <ScrollRestoration />
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/article/:slug" element={<Article />} />
                <Route path="/region/:slug" element={<Region />} />
                <Route path="/topic/:slug" element={<Topic />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
                <Route path="/admin/sources" element={<ProtectedRoute><Sources /></ProtectedRoute>} />
                <Route path="/admin/sources-config" element={<ProtectedRoute><SourcesConfig /></ProtectedRoute>} />
                <Route path="/admin/drafts" element={<ProtectedRoute><Drafts /></ProtectedRoute>} />
                <Route path="/admin/drafts/:id" element={<ProtectedRoute><DraftDetail /></ProtectedRoute>} />
                <Route path="/admin/articles" element={<ProtectedRoute><Articles /></ProtectedRoute>} />
                <Route path="/admin/articles/:id" element={<ProtectedRoute><ArticleEdit /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;