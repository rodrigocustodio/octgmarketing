import AdminLayout from "@/components/admin/AdminLayout";
import { useEditorialStats } from "@/hooks/useEditorialStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Newspaper, 
  Globe, 
  Building2, 
  Tag, 
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3
} from "lucide-react";
import CoverageHeatmap from "@/components/admin/CoverageHeatmap";
import CompanyMentions from "@/components/admin/CompanyMentions";
import TopicSuggestions from "@/components/admin/TopicSuggestions";

function StatCard({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  subValue?: string; 
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subValue && (
              <div className="flex items-center gap-1 mt-1">
                {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
                {trend === "neutral" && <Minus className="h-3 w-3 text-muted-foreground" />}
                <p className="text-xs text-muted-foreground">{subValue}</p>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EditorialRoom() {
  const { data: stats, isLoading } = useEditorialStats();

  const getTrend = () => {
    if (!stats) return "neutral";
    if (stats.articlesThisWeek > stats.articlesLastWeek) return "up";
    if (stats.articlesThisWeek < stats.articlesLastWeek) return "down";
    return "neutral";
  };

  const getWeeklyChange = () => {
    if (!stats) return "";
    const diff = stats.articlesThisWeek - stats.articlesLastWeek;
    if (diff > 0) return `+${diff} from last week`;
    if (diff < 0) return `${diff} from last week`;
    return "Same as last week";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Editorial Room
          </h1>
          <p className="text-muted-foreground mt-1">
            Content planning hub with analytics, gap analysis, and AI-powered topic suggestions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Published Articles"
                value={stats?.totalArticles || 0}
                subValue={getWeeklyChange()}
                icon={Newspaper}
                trend={getTrend() as "up" | "down" | "neutral"}
              />
              <StatCard
                title="Regions Covered"
                value={`${stats?.regionsCount || 0}/${stats?.totalRegions || 0}`}
                subValue={stats?.regionsCount === stats?.totalRegions ? "Full coverage" : "Gaps exist"}
                icon={Globe}
                trend={stats?.regionsCount === stats?.totalRegions ? "up" : "down"}
              />
              <StatCard
                title="Companies Mentioned"
                value={`${stats?.companiesMentioned || 0}/${stats?.totalCompanies || 0}`}
                subValue={`${Math.round(((stats?.companiesMentioned || 0) / (stats?.totalCompanies || 1)) * 100)}% coverage`}
                icon={Building2}
                trend={(stats?.companiesMentioned || 0) / (stats?.totalCompanies || 1) > 0.5 ? "up" : "down"}
              />
              <StatCard
                title="This Week"
                value={stats?.articlesThisWeek || 0}
                subValue={`${stats?.articlesLastWeek || 0} last week`}
                icon={Tag}
                trend={getTrend() as "up" | "down" | "neutral"}
              />
            </>
          )}
        </div>

        {/* Coverage Heatmap */}
        <CoverageHeatmap />

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Company Mentions */}
          <CompanyMentions />

          {/* AI Topic Suggestions */}
          <TopicSuggestions />
        </div>
      </div>
    </AdminLayout>
  );
}
