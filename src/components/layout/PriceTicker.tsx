import { useSteelPrices } from "@/hooks/useSteelPrices";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function PriceItem({ symbol, price, change, changePercent, currency }: {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const formatPrice = (p: number, curr: string) => {
    const num = p >= 100 ? p.toFixed(0) : p.toFixed(2);
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', JPY: '¥', GBP: '£', INR: '₹', TWD: 'NT$'
    };
    const symbol = symbols[curr] || `${curr} `;
    return `${symbol}${num}`;
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 whitespace-nowrap">
      <span className="font-medium text-foreground">{symbol}</span>
      <span className="text-foreground/70">
        {formatPrice(price, currency)}
      </span>
      <span className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        isPositive && "text-emerald-600",
        isNegative && "text-rose-600",
        isNeutral && "text-muted-foreground"
      )}>
        {isPositive && <TrendingUp className="h-3 w-3" />}
        {isNegative && <TrendingDown className="h-3 w-3" />}
        {isNeutral && <Minus className="h-3 w-3" />}
        {isPositive && '+'}
        {changePercent.toFixed(2)}%
      </span>
    </div>
  );
}

function TickerSkeleton() {
  return (
    <div className="flex items-center gap-4 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-3">
          <div className="h-3 w-8 bg-muted rounded" />
          <div className="h-3 w-12 bg-muted rounded" />
          <div className="h-3 w-10 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

// Fixed height to prevent CLS
const TICKER_HEIGHT = "h-8"; // 32px to accommodate label

export function PriceTicker() {
  const { data: prices, isLoading } = useSteelPrices();
  
  // Filter out anchors (state-owned entities with no public equity) and zero prices
  const displayPrices = prices?.filter(p => p.price > 0 && p.category !== 'anchor') || [];

  // Always render with fixed height to prevent CLS
  if (isLoading) {
    return (
      <div className={`sticky top-16 z-40 w-full border-b border-border bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20 ${TICKER_HEIGHT}`}>
        <div className={`${TICKER_HEIGHT} flex items-center overflow-hidden`}>
          <TickerSkeleton />
        </div>
      </div>
    );
  }

  if (displayPrices.length === 0) {
    return (
      <div className={`sticky top-16 z-40 w-full border-b border-border bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20 ${TICKER_HEIGHT}`}>
        <div className={`${TICKER_HEIGHT} flex items-center justify-center text-xs text-muted-foreground`}>
          No price data available
        </div>
      </div>
    );
  }

  return (
    <div className={`sticky top-16 z-40 w-full border-b border-border/50 bg-muted/20 backdrop-blur-sm ${TICKER_HEIGHT}`}>
      <div className={`${TICKER_HEIGHT} flex items-center overflow-hidden`}>
        {/* Ticker Label with Tooltip */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 border-r border-border/50 h-full bg-muted/30">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
            Market Indicators
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Price ticker information">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Displays selected steel benchmarks and energy-sector indicators influencing OCTG market conditions. Not direct OCTG prices.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Scrolling Ticker */}
        <div className="ticker-wrapper flex-1">
          <div className="ticker-content text-[11px] font-mono text-muted-foreground">
            {/* Double the content for seamless loop */}
            {[...displayPrices, ...displayPrices].map((price, index) => (
              <PriceItem
                key={`${price.symbol}-${index}`}
                symbol={price.symbol}
                price={price.price}
                change={price.change}
                changePercent={price.change_percent}
                currency={price.currency}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
