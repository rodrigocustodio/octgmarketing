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

  const formatPrice = (p: number) => {
    if (p >= 100) return p.toFixed(0);
    return p.toFixed(2);
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 whitespace-nowrap">
      <span className="font-semibold text-foreground">{symbol}</span>
      <span className="text-muted-foreground">
        {currency === 'USD' ? '$' : currency}{formatPrice(price)}
      </span>
      <span className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        isPositive && "text-emerald-500",
        isNegative && "text-red-500",
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

  if (isLoading || !prices || prices.length === 0) {
    return (
      <div className="sticky top-16 z-40 w-full border-b border-border bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20">
        <div className="h-8 flex items-center overflow-hidden">
          <TickerSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-16 z-40 w-full border-b border-border bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20">
      <div className="h-8 flex items-center overflow-hidden">
        <div className="ticker-wrapper">
          <div className="ticker-content text-xs font-mono">
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
