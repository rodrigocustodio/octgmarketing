import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, Info, ArrowRight } from "lucide-react";
import { useMarketPulse } from "@/hooks/useMarketPulse";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Pressure = "tightening" | "neutral" | "softening";

const pressureConfig: Record<
  Pressure,
  { label: string; bg: string; text: string; icon: typeof TrendingUp }
> = {
  tightening: {
    label: "Tightening",
    bg: "bg-red-500/20 dark:bg-red-500/30",
    text: "text-red-600 dark:text-red-300",
    icon: TrendingUp,
  },
  neutral: {
    label: "Neutral",
    bg: "bg-yellow-500/20 dark:bg-yellow-500/30",
    text: "text-yellow-600 dark:text-yellow-300",
    icon: Minus,
  },
  softening: {
    label: "Softening",
    bg: "bg-green-500/20 dark:bg-green-500/30",
    text: "text-green-600 dark:text-green-300",
    icon: TrendingDown,
  },
};

function formatAsOf(iso: string | null): string {
  if (!iso) return "";
  // Parse YYYY-MM-DD as local, not UTC, to avoid drift
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function DeltaPill({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null || value === undefined) return null;
  const up = value > 0;
  const down = value < 0;
  // For rig count, up = active drilling = "good" (green). For coverage, neutral coloring.
  const colorClass = invert
    ? up
      ? "text-red-500"
      : down
      ? "text-green-500"
      : "text-muted-foreground"
    : up
    ? "text-green-500"
    : down
    ? "text-red-500"
    : "text-muted-foreground";
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium", colorClass)}>
      <Icon className="h-3.5 w-3.5" />
      {up ? "+" : ""}
      {value}
    </span>
  );
}

export function MarketPulseStrip() {
  const { data: pulse, isLoading } = useMarketPulse();

  if (isLoading) {
    return (
      <section className="border-b border-border/30 bg-muted/30">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!pulse) return null;

  const pressure = pressureConfig[pulse.cost_pressure];
  const PressureIcon = pressure.icon;
  const top = pulse.newsroom_focus?.[0];
  const second = pulse.newsroom_focus?.[1];

  return (
    <section className="border-b border-border/30 bg-muted/30">
      <div className="container py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              This Week in OCTG
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Weekly editorial snapshot. Directional indicators only — not transactional pricing.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Link
            to="/news"
            className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
          >
            Latest Coverage <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Four-tile grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Tile 1 — US Rig Count */}
          <div className="bg-background border border-border/50 rounded-lg p-4 border-l-2 border-l-amber-500/70">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              US Rig Count
            </div>
            {pulse.rig_count_us !== null ? (
              <>
                <div className="text-3xl font-bold text-foreground leading-tight">
                  {pulse.rig_count_us}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <DeltaPill value={pulse.rig_count_us_delta} />
                  <span className="text-xs text-muted-foreground">wow</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-2">
                  Baker Hughes · {formatAsOf(pulse.rig_count_as_of)}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground italic mt-2">
                Refreshing Friday
              </div>
            )}
          </div>

          {/* Tile 2 — Cost Pressure (Editorial) */}
          <div className={cn("rounded-lg p-4 flex flex-col", pressure.bg)}>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Cost Pressure
            </div>
            <div className="flex items-center gap-2">
              <PressureIcon className={cn("h-6 w-6", pressure.text)} />
              <span className={cn("text-2xl font-bold", pressure.text)}>
                {pressure.label}
              </span>
            </div>
            {pulse.cost_pressure_rationale && (
              <p className="text-xs text-muted-foreground mt-2 leading-snug line-clamp-3">
                {pulse.cost_pressure_rationale}
              </p>
            )}
            <div className="text-[10px] text-muted-foreground mt-auto pt-2">
              Editorial Indicator
            </div>
          </div>

          {/* Tile 3 — Newsroom Focus */}
          <div className="bg-background border border-border/50 rounded-lg p-4 border-l-2 border-l-accent/70">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Newsroom Focus
            </div>
            {top ? (
              <div className="space-y-2">
                <Link
                  to={`/topics/${top.slug}`}
                  className="block group"
                >
                  <div className="text-base font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                    {top.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{top.count} stories</span>
                    <DeltaPill value={top.delta} />
                  </div>
                </Link>
                {second && (
                  <Link
                    to={`/topics/${second.slug}`}
                    className="block group pt-1 border-t border-border/40"
                  >
                    <div className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
                      {second.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{second.count} stories</span>
                      <DeltaPill value={second.delta} />
                    </div>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                Awaiting coverage
              </div>
            )}
          </div>

          {/* Tile 4 — Editorial Read */}
          <div className="bg-background border border-border/50 rounded-lg p-4 border-l-2 border-l-primary/70">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Editorial Read
            </div>
            {pulse.editorial_read ? (
              <>
                <p className="text-sm text-foreground leading-snug line-clamp-4">
                  {pulse.editorial_read}
                </p>
                <div className="text-[10px] text-muted-foreground mt-auto pt-2 italic">
                  — OCTG Index Newsroom
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                Synthesizing this week's coverage
              </div>
            )}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mt-2">
          Updated weekly. Directional editorial indicators — not transactional pricing.
        </p>
      </div>
    </section>
  );
}
