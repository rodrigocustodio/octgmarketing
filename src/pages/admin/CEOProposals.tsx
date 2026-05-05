import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface Proposal {
  id: string;
  executive_id: string;
  change_type: string;
  current_data: any;
  proposed_data: any;
  diff: Record<string, { from: any; to: any }>;
  confidence: number | null;
  sources: string[];
  reasoning: string | null;
  status: string;
  created_at: string;
}

const typeColor = (t: string) => {
  if (t === "verified_no_change") return "bg-green-500/15 text-green-600 border-green-500/30";
  if (t === "replacement") return "bg-red-500/15 text-red-600 border-red-500/30";
  if (t === "flag_inactive") return "bg-orange-500/15 text-orange-600 border-orange-500/30";
  return "bg-blue-500/15 text-blue-600 border-blue-500/30";
};

function ProposalCard({ p }: { p: Proposal }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const apply = useMutation({
    mutationFn: async () => {
      // Apply diff to executive
      const updates: Record<string, any> = {};
      for (const [k, v] of Object.entries(p.diff)) updates[k] = v.to;
      if (p.change_type === "flag_inactive") updates.is_active = false;
      if (Object.keys(updates).length > 0) {
        const { error: e1 } = await supabase.from("executives").update(updates).eq("id", p.executive_id);
        if (e1) throw e1;
      }
      const { error } = await supabase
        .from("executive_change_proposals")
        .update({ status: "applied", reviewed_at: new Date().toISOString() })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Applied", description: "Directory updated." });
      qc.invalidateQueries({ queryKey: ["ceo-proposals"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const reject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("executive_change_proposals")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Rejected" });
      qc.invalidateQueries({ queryKey: ["ceo-proposals"] });
    },
  });

  const exec = p.current_data;
  const diffEntries = Object.entries(p.diff ?? {});

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">
            {exec.name} <span className="text-muted-foreground">— {exec.title}</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            <Badge variant="outline" className={typeColor(p.change_type)}>{p.change_type}</Badge>
            <span className="ml-2">confidence: {p.confidence != null ? `${Math.round(p.confidence * 100)}%` : "—"}</span>
            <span className="ml-2">• {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => reject.mutate()} disabled={reject.isPending}>
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => apply.mutate()} disabled={apply.isPending || diffEntries.length === 0}>
            {apply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            <span className="ml-1">Apply</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {diffEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No field changes.</p>
        ) : (
          <div className="space-y-2">
            {diffEntries.map(([k, v]) => (
              <div key={k} className="text-sm border rounded p-2">
                <p className="font-mono text-xs text-muted-foreground mb-1">{k}</p>
                <p className="text-red-600 line-through">{String(v.from ?? "(empty)").slice(0, 300)}</p>
                <p className="text-green-600">{String(v.to ?? "(empty)").slice(0, 300)}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setExpanded((x) => !x)} className="text-xs underline text-muted-foreground">
          {expanded ? "Hide" : "Show"} reasoning & sources
        </button>
        {expanded && (
          <div className="space-y-2 text-xs">
            {p.reasoning && <p className="italic text-muted-foreground">{p.reasoning}</p>}
            {p.sources?.length > 0 && (
              <ul className="space-y-1">
                {p.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> {s}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CEOProposals() {
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["ceo-proposals", filter],
    queryFn: async () => {
      let q = supabase.from("executive_change_proposals").select("*").order("created_at", { ascending: false }).limit(100);
      if (filter === "pending") q = q.eq("status", "pending");
      const { data, error } = await q;
      if (error) throw error;
      return data as Proposal[];
    },
    refetchInterval: 30000,
  });

  return (
    <AdminLayout>
      <Helmet><title>CEO Proposals | OCTG Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CEO Change Proposals</h1>
            <p className="text-muted-foreground mt-1">Review AI-detected directory changes before applying.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={filter === "pending" ? "default" : "outline"} size="sm" onClick={() => setFilter("pending")}>Pending</Button>
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All</Button>
          </div>
        </div>

        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : !data || data.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No proposals.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {data.map((p) => <ProposalCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
