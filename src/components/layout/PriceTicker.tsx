import { useSteelPrices } from "@/hooks/useSteelPrices";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function PriceTicker() {
  const { data: prices, isLoading } = useSteelPrices();

  if (isLoading) {
    return (
      <div className="sticky top-16 z-40 w-full border-b border-border bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20">
        <div className="h-8 flex items-center overflow-hidden">
          <TickerSkeleton />
        </div>
      </div>
    );
  }

  if (!prices || prices.length === 0) {
    return (
      <div className="sticky top-16 z-40 w-full border-b border-border bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20">
        <div className="h-8 flex items-center justify-center text-xs text-muted-foreground">
          No price data available
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-16 z-40 w-full border-b border-border/50 bg-muted/20 backdrop-blur-sm">
      <div className="h-7 flex items-center overflow-hidden">
        <div className="ticker-wrapper">
          <div className="ticker-content text-[11px] font-mono text-muted-foreground">
            {/* Double the content for seamless loop */}
            {[...prices, ...prices].map((price, index) => (
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
