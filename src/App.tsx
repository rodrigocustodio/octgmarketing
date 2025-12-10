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
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Topic from "./pages/Topic";
import Topics from "./pages/Topics";
import Directory from "./pages/Directory";
import DirectoryCategory from "./pages/DirectoryCategory";
import DirectoryRegion from "./pages/DirectoryRegion";
import CompanyDetail from "./pages/CompanyDetail";
import CEODirectory from "./pages/CEODirectory";
import CEODetail from "./pages/CEODetail";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import NewsletterTerms from "./pages/NewsletterTerms";
import OctgDirectory from "./pages/OctgDirectory";
import OctgCategory from "./pages/OctgCategory";
import ProductDetail from "./pages/ProductDetail";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import PricingIndex from "./pages/PricingIndex";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Pipeline from "./pages/admin/Pipeline";
import Sources from "./pages/admin/Sources";
import SourcesConfig from "./pages/admin/SourcesConfig";
import Drafts from "./pages/admin/Drafts";
import DraftDetail from "./pages/admin/DraftDetail";
import Articles from "./pages/admin/Articles";
import ArticleEdit from "./pages/admin/ArticleEdit";
import CreateArticle from "./pages/admin/CreateArticle";
import Companies from "./pages/admin/Companies";
import CompanyEdit from "./pages/admin/CompanyEdit";
import Executives from "./pages/admin/Executives";
import ExecutiveEdit from "./pages/admin/ExecutiveEdit";
import AdminProducts from "./pages/admin/Products";
import ProductEdit from "./pages/admin/ProductEdit";
import AdminEvents from "./pages/admin/Events";
import EventEdit from "./pages/admin/EventEdit";
import Settings from "./pages/admin/Settings";

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
                <Route path="/topics" element={<Topics />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/directory/region/:slug" element={<DirectoryRegion />} />
                <Route path="/directory/category/:slug" element={<DirectoryCategory />} />
                <Route path="/directory/company/:slug" element={<CompanyDetail />} />
                <Route path="/ceo-directory" element={<CEODirectory />} />
                <Route path="/ceo/:slug" element={<CEODetail />} />
                <Route path="/octg-directory" element={<OctgDirectory />} />
                <Route path="/octg-directory/:categorySlug" element={<OctgCategory />} />
                <Route path="/octg-directory/:categorySlug/:productSlug" element={<ProductDetail />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:slug" element={<EventDetail />} />
                <Route path="/pricing-index" element={<PricingIndex />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/newsletter-terms" element={<NewsletterTerms />} />
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
                <Route path="/admin/create" element={<ProtectedRoute><CreateArticle /></ProtectedRoute>} />
                <Route path="/admin/executives" element={<ProtectedRoute><Executives /></ProtectedRoute>} />
                <Route path="/admin/executives/:id" element={<ProtectedRoute><ExecutiveEdit /></ProtectedRoute>} />
                <Route path="/admin/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
                <Route path="/admin/companies/:id" element={<ProtectedRoute><CompanyEdit /></ProtectedRoute>} />
                <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
                <Route path="/admin/products/:id" element={<ProtectedRoute><ProductEdit /></ProtectedRoute>} />
                <Route path="/admin/events" element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} />
                <Route path="/admin/events/:id" element={<ProtectedRoute><EventEdit /></ProtectedRoute>} />
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