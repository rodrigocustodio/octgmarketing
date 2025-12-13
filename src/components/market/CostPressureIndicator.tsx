import { useState, useEffect, useRef } from "react";
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
  {
    label: string;
    cardBg: string;
    textColor: string;
    mutedText: string;
    badgeBg: string;
    indicatorBg: string;
    indicatorColor: string;
    pulseClass: string;
    icon: typeof TrendingUp;
  }
> = {
  rising: {
    label: "Tightening",
    cardBg: "bg-red-500/15 dark:bg-red-500/25 border-red-500/40",
    textColor: "text-red-900 dark:text-red-50",
    mutedText: "text-red-800/80 dark:text-red-200/80",
    badgeBg: "bg-red-500/20 text-red-900 dark:text-red-100",
    indicatorBg: "bg-red-500/20 dark:bg-red-500/30",
    indicatorColor: "text-red-600 dark:text-red-300",
    pulseClass: "animate-pulse-status-red",
    icon: TrendingUp,
  },
  stable: {
    label: "Neutral",
    cardBg: "bg-yellow-400/15 dark:bg-yellow-500/20 border-yellow-500/40",
    textColor: "text-yellow-900 dark:text-yellow-50",
    mutedText: "text-yellow-800/80 dark:text-yellow-200/80",
    badgeBg: "bg-yellow-500/20 text-yellow-900 dark:text-yellow-100",
    indicatorBg: "bg-yellow-500/20 dark:bg-yellow-500/30",
    indicatorColor: "text-yellow-600 dark:text-yellow-300",
    pulseClass: "animate-pulse-status-yellow",
    icon: Minus,
  },
  softening: {
    label: "Softening",
    cardBg: "bg-green-500/15 dark:bg-green-500/20 border-green-500/40",
    textColor: "text-green-900 dark:text-green-50",
    mutedText: "text-green-800/80 dark:text-green-200/80",
    badgeBg: "bg-green-500/20 text-green-900 dark:text-green-100",
    indicatorBg: "bg-green-500/20 dark:bg-green-500/30",
    indicatorColor: "text-green-600 dark:text-green-300",
    pulseClass: "animate-pulse-status-green",
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
  
  const [isAnimating, setIsAnimating] = useState(false);
  const prevLevelRef = useRef<PressureLevel | null>(null);
  
  useEffect(() => {
    if (prevLevelRef.current !== null && prevLevelRef.current !== level) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = level;
  }, [level]);

  return (
    <Card className={cn("border transition-all duration-300", config.cardBg, isAnimating && config.pulseClass)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={cn("font-display text-lg font-semibold", config.textColor)}>
                OCTG Cost Pressure Index
              </h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className={cn("transition-colors", config.mutedText, "hover:opacity-80")}>
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
            <p className={cn("text-sm mb-4", config.mutedText)}>
              Based on steel commodity trends, scrap prices, and energy equity sentiment
            </p>
            <span className={cn("inline-block px-2 py-0.5 text-xs rounded", config.badgeBg)}>
              Editorial Indicator
            </span>
          </div>

          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-xl p-4 min-w-[120px]",
              config.indicatorBg
            )}
          >
            <Icon className={cn("h-8 w-8 mb-1", config.indicatorColor)} />
            <span className={cn("text-xl font-bold", config.indicatorColor)}>
              {config.label}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
