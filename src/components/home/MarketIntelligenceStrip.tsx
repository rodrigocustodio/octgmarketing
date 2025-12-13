import { useSteelPrices } from "@/hooks/useSteelPrices";
import { TrendingUp, TrendingDown, Minus, Info, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PressureLevel = "rising" | "stable" | "softening";

function calculatePressureLevel(
  commodities: Array<{ change_percent: number }>
): PressureLevel {
  if (commodities.length === 0) return "stable";
  const avg = commodities.reduce((sum, c) => sum + c.change_percent, 0) / commodities.length;
  if (avg > 0.5) return "rising";
  if (avg < -0.5) return "softening";
  return "stable";
}

const pressureConfig: Record<PressureLevel, {
  label: string;
  bg: string;
  text: string;
  icon: typeof TrendingUp;
}> = {
  rising: {
    label: "Tightening",
    bg: "bg-red-500/20 dark:bg-red-500/30",
    text: "text-red-600 dark:text-red-300",
    icon: TrendingUp,
  },
  stable: {
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

export function MarketIntelligenceStrip() {
  const { data: prices, isLoading } = useSteelPrices();

  // Filter commodities only
  const commodities = prices?.filter(p => p.category === "commodity") ?? [];
  const level = calculatePressureLevel(commodities);
  const config = pressureConfig[level];
  const Icon = config.icon;

  if (isLoading) {
    return (
      <section className="border-b border-border/30 bg-muted/30">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-border/30 bg-muted/30">
      <div className="container py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Market Intelligence</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Indicative benchmarks. Not transactional prices.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Link 
            to="/pricing-index" 
            className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
          >
            View Full Market Data <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Content Grid - Commodities + Cost Pressure Index */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-3">
          {/* Commodities Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {commodities.slice(0, 5).map((commodity) => {
              const isPositive = commodity.change_percent > 0;
              const isNegative = commodity.change_percent < 0;
              
              return (
                <div
                  key={commodity.id}
                  className="bg-background border border-border/50 rounded-lg p-3 border-l-2 border-l-amber-500/70"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                      {commodity.symbol}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                      INPUT
                    </span>
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    ${commodity.price.toFixed(0)}
                    <span className="text-[10px] font-normal text-muted-foreground">/ton</span>
                  </div>
                  <div className={cn(
                    "text-xs font-medium",
                    isPositive && "text-red-500",
                    isNegative && "text-green-500",
                    !isPositive && !isNegative && "text-muted-foreground"
                  )}>
                    {isPositive ? "+" : ""}{commodity.change_percent.toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact Cost Pressure Index */}
          <div className={cn("rounded-lg p-3 flex flex-col justify-center items-center", config.bg)}>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Cost Pressure
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Editorial indicator based on commodity trends. Not transactional.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <Icon className={cn("h-5 w-5", config.text)} />
              <span className={cn("text-lg font-bold", config.text)}>
                {config.label}
              </span>
            </div>
            <span className="text-[9px] text-muted-foreground mt-1">Editorial Indicator</span>
          </div>
        </div>

        {/* Source Attribution */}
        <p className="text-[10px] text-muted-foreground mt-2">
          Source: Exchange data, public market feeds. Indicative—not transactional.
        </p>
      </div>
    </section>
  );
}
