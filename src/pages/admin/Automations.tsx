import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface Job {
  name: string;
  function: string;
  description: string;
  schedule: string;
}

const JOBS: Job[] = [
  {
    name: "refresh-market-pulse",
    function: "refresh-market-pulse",
    description: "Weekly Editorial Market Pulse refresh: scrapes Baker Hughes US rig count, tallies newsroom topic focus, and generates the editorial read via Lovable AI.",
    schedule: "Fridays 14:00 UTC",
  },
  {
    name: "auto-article-pipeline",
    function: "auto-article-pipeline",
    description: "3-agent pipeline (Researcher → Editor → Publisher) producing one draft article per run from a rotating topic backlog.",
    schedule: "4×/day (02:15, 08:15, 14:15, 20:15 UTC) — drafts only",
  },
  {
    name: "auto-ceo-refresh",
    function: "auto-ceo-refresh",
    description: "3-agent CEO directory verification (Perplexity researcher → Gemini editor → diff publisher). Writes proposals for admin review; never auto-mutates the directory.",
    schedule: "Mon & Thu 06:00 UTC — Tier-1 (8) + Tier-2 rotation (4)",
  },
  {
    name: "auto-energy-events",
    function: "auto-energy-events",
    description: "Monthly discovery of upcoming global energy conferences (Perplexity → Gemini → events table). Dedupes by slug + month.",
    schedule: "1st of each month, 05:00 UTC",
  },
];

interface Run {
  id: string;
  job_name: string;
  status: string;
  items_processed: number | null;
  items_succeeded: number | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
  payload: any;
}

function statusColor(s: string) {
  if (s === "success") return "bg-green-500/15 text-green-600 border-green-500/30";
  if (s === "partial") return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  if (s === "failed") return "bg-red-500/15 text-red-600 border-red-500/30";
  return "bg-muted text-muted-foreground";
}

function JobCard({ job }: { job: Job }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showError, setShowError] = useState(false);

  const { data: runs, isLoading } = useQuery({
    queryKey: ["automation-runs", job.name],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_runs")
        .select("*")
        .eq("job_name", job.name)
        .order("started_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as Run[];
    },
    refetchInterval: 15000,
  });

  const runNow = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke(job.function, { body: {} });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Job triggered", description: `${job.name} is running.` });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["automation-runs", job.name] }), 1500);
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const last = runs?.[0];
  const last7 = runs?.filter((r) => Date.now() - new Date(r.started_at).getTime() < 7 * 86400_000) ?? [];
  const successRate = last7.length ? Math.round((last7.filter((r) => r.status === "success").length / last7.length) * 100) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="font-mono text-base">{job.name}</CardTitle>
          <CardDescription className="mt-1">{job.description}</CardDescription>
          <p className="text-xs text-muted-foreground mt-2">Schedule: {job.schedule}</p>
        </div>
        <Button onClick={() => runNow.mutate()} disabled={runNow.isPending} size="sm">
          {runNow.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          <span className="ml-2">Run now</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Last run</p>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mt-1" />
            ) : last ? (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={statusColor(last.status)}>{last.status}</Badge>
                <span className="text-xs">{formatDistanceToNow(new Date(last.started_at), { addSuffix: true })}</span>
              </div>
            ) : (
              <p className="text-muted-foreground mt-1">Never</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground text-xs">7-day success rate</p>
            <p className="font-semibold mt-1">{successRate === null ? "—" : `${successRate}% (${last7.length} runs)`}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Items processed (last)</p>
            <p className="font-semibold mt-1">{last?.items_succeeded ?? 0} / {last?.items_processed ?? 0}</p>
          </div>
        </div>

        {/* Sparkline */}
        <div className="flex items-center gap-1">
          {(runs ?? []).slice(0, 30).reverse().map((r) => (
            <div
              key={r.id}
              title={`${r.status} • ${new Date(r.started_at).toLocaleString()}`}
              className={`h-2 w-2 rounded-full ${
                r.status === "success" ? "bg-green-500" : r.status === "partial" ? "bg-amber-500" : "bg-red-500"
              }`}
            />
          ))}
        </div>

        {last?.error && (
          <div>
            <button onClick={() => setShowError((v) => !v)} className="flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" /> {showError ? "Hide" : "Show"} last error
            </button>
            {showError && (
              <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">{last.error}</pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Automations() {
  return (
    <AdminLayout>
      <Helmet><title>Automations | OCTG Admin</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground mt-1">Scheduled background jobs and their health.</p>
        </div>
        <div className="space-y-4">
          {JOBS.map((j) => <JobCard key={j.name} job={j} />)}
        </div>
      </div>
    </AdminLayout>
  );
}
