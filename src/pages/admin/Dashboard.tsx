import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, FileEdit, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Stats {
  newSources: number;
  pendingDrafts: number;
  approvedDrafts: number;
  failedSources: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    newSources: 0,
    pendingDrafts: 0,
    approvedDrafts: 0,
    failedSources: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch source article stats
        const { data: sources, error: sourcesError } = await supabase
          .from("source_articles")
          .select("status");

        if (sourcesError) throw sourcesError;

        // Fetch draft article stats
        const { data: drafts, error: draftsError } = await supabase
          .from("draft_articles")
          .select("status");

        if (draftsError) throw draftsError;

        const newSources = sources?.filter(s => s.status === "new").length ?? 0;
        const failedSources = sources?.filter(s => s.status === "failed").length ?? 0;
        const pendingDrafts = drafts?.filter(d => d.status === "pending_review").length ?? 0;
        const approvedDrafts = drafts?.filter(d => d.status === "approved").length ?? 0;

        setStats({
          newSources,
          failedSources,
          pendingDrafts,
          approvedDrafts,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "New Sources",
      value: stats.newSources,
      description: "Awaiting AI processing",
      icon: Newspaper,
      href: "/admin/sources",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Pending Review",
      value: stats.pendingDrafts,
      description: "AI drafts ready for review",
      icon: FileEdit,
      href: "/admin/drafts",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Approved",
      value: stats.approvedDrafts,
      description: "Published articles",
      icon: CheckCircle,
      href: "/admin/drafts?status=approved",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Failed",
      value: stats.failedSources,
      description: "Sources that failed processing",
      icon: AlertCircle,
      href: "/admin/sources?status=failed",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            AI Editorial Pipeline Overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Link key={stat.title} to={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.description}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest changes in the editorial pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No recent activity. Run the scraper to start collecting articles.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>
                Get started with the AI editorial system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Configure API Keys</p>
                  <p className="text-sm text-muted-foreground">
                    Set up Firecrawl and OpenAI API keys in settings
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Run Scraper</p>
                  <p className="text-sm text-muted-foreground">
                    Trigger the scraper to collect OCTG news
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Review & Publish</p>
                  <p className="text-sm text-muted-foreground">
                    Review AI-generated drafts and approve for publishing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;