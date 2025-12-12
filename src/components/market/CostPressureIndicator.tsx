import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CostPressureIndicatorProps {
  commodities: Array<{
    change: number;
    change_percent: number;
  }>;
  stocks?: Array<{
    change: number;
    change_percent: number;
  }>;
}

type PressureLevel = "rising" | "stable" | "softening";

function calculatePressureLevel(
  commodities: CostPressureIndicatorProps["commodities"],
  stocks?: CostPressureIndicatorProps["stocks"]
): PressureLevel {
  if (commodities.length === 0) return "stable";

  // Calculate weighted average of commodity changes (70% weight)
  const commodityAvg =
    commodities.reduce((sum, c) => sum + c.change_percent, 0) / commodities.length;

  // Calculate stock sentiment if available (30% weight)
  const stockAvg =
    stocks && stocks.length > 0
      ? stocks.reduce((sum, s) => sum + s.change_percent, 0) / stocks.length
      : 0;

  // Combined score: commodities have higher weight as direct cost drivers
  const combinedScore = commodityAvg * 0.7 + stockAvg * 0.3;

  // Thresholds for classification
  if (combinedScore > 0.5) return "rising";
  if (combinedScore < -0.5) return "softening";
  return "stable";
}

const pressureConfig: Record<
  PressureLevel,
  { label: string; color: string; bgColor: string; icon: typeof TrendingUp }
> = {
  rising: {
    label: "Rising",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    icon: TrendingUp,
  },
  stable: {
    label: "Stable",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    icon: Minus,
  },
  softening: {
    label: "Softening",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    icon: TrendingDown,
  },
};

export function CostPressureIndicator({
  commodities,
  stocks,
}: CostPressureIndicatorProps) {
  const level = calculatePressureLevel(commodities, stocks);
  const config = pressureConfig[level];
  const Icon = config.icon;

  return (
    <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-display text-lg font-semibold">
                OCTG Cost Pressure Index
              </h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Directional indicator based on steel commodity trends and
                      energy equity sentiment. Not a transactional price.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Based on steel commodity trends, scrap prices, and energy equity sentiment
            </p>
            <span className="inline-block px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
              Editorial Indicator
            </span>
          </div>

          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-xl p-4 min-w-[120px]",
              config.bgColor
            )}
          >
            <Icon className={cn("h-8 w-8 mb-1", config.color)} />
            <span className={cn("text-xl font-bold", config.color)}>
              {config.label}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
