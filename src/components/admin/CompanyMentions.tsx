import { useState } from "react";
import { useCompanyMentions } from "@/hooks/useEditorialStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Building2, TrendingUp, AlertCircle, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CompanyMentions() {
  const { data, isLoading } = useCompanyMentions();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Mentions</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { mentioned, unmentioned } = data;

  const filteredMentioned = mentioned.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUnmentioned = unmentioned.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;
    const colors: Record<string, string> = {
      mill: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      drilling: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      yard: "bg-green-500/10 text-green-600 dark:text-green-400",
      inspection: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      logistics: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      trading: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
      software: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    };
    return (
      <Badge variant="secondary" className={colors[role] || ""}>
        {role}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Coverage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="mentioned">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mentioned" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Mentioned ({mentioned.length})
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Opportunities ({unmentioned.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mentioned" className="mt-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredMentioned.slice(0, 30).map((company) => (
                <div
                  key={company.companyId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                      {company.mentionCount}
                    </div>
                    <div>
                      <p className="font-medium">{company.companyName}</p>
                      {company.lastMentioned && (
                        <p className="text-xs text-muted-foreground">
                          Last: {formatDistanceToNow(new Date(company.lastMentioned), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                  {getRoleBadge(company.industryRole)}
                </div>
              ))}
              {filteredMentioned.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No companies found</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="opportunities" className="mt-4">
            <div className="mb-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                These {unmentioned.length} companies have never been mentioned in any article
              </p>
            </div>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {filteredUnmentioned.slice(0, 50).map((company) => (
                <div
                  key={company.companyId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <p className="font-medium">{company.companyName}</p>
                  {getRoleBadge(company.industryRole)}
                </div>
              ))}
              {filteredUnmentioned.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No companies found</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
