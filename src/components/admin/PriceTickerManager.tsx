import { useState, useEffect, useRef, useCallback } from "react";
import { useSteelPrices, SteelPrice } from "@/hooks/useSteelPrices";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, TrendingUp, TrendingDown, Minus, Clock, AlertCircle, CheckCircle2, Database, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const REFRESH_INTERVAL_SECONDS = 15 * 60; // 15 minutes (matches server cron)
const STORAGE_KEY = "priceTickerNextRefresh";

// Helper functions for localStorage persistence
const getStoredNextRefresh = (): number | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
};

const setStoredNextRefresh = (timestamp: number) => {
  try {
    localStorage.setItem(STORAGE_KEY, timestamp.toString());
  } catch {
    // localStorage not available
  }
};

const getInitialSeconds = (): number => {
  const storedTimestamp = getStoredNextRefresh();
  if (storedTimestamp) {
    const remaining = Math.floor((storedTimestamp - Date.now()) / 1000);
    if (remaining > 0 && remaining <= REFRESH_INTERVAL_SECONDS) {
      return remaining;
    }
  }
  // No valid stored time - set new one
  const newTimestamp = Date.now() + REFRESH_INTERVAL_SECONDS * 1000;
  setStoredNextRefresh(newTimestamp);
  return REFRESH_INTERVAL_SECONDS;
};

export function PriceTickerManager() {
  const { data: prices, isLoading, refetch } = useSteelPrices();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(getInitialSeconds);
  const { toast } = useToast();
  const isRefreshingRef = useRef(false);

  // Format countdown as MM:SS
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get freshness status based on most recent update
  const getMostRecentUpdate = () => {
    if (!prices || prices.length === 0) return null;
    const dates = prices.map(p => new Date(p.updated_at).getTime());
    return new Date(Math.max(...dates));
  };

  const lastUpdate = getMostRecentUpdate();
  
  const getFreshnessStatus = () => {
    if (!lastUpdate) return { status: "unknown", color: "bg-muted", label: "No Data" };
    
    const now = new Date();
    const diffHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return { status: "fresh", color: "bg-emerald-500", label: "Live Data" };
    } else if (diffHours < 6) {
      return { status: "stale", color: "bg-amber-500", label: "Stale Data" };
    } else {
      return { status: "outdated", color: "bg-destructive", label: "Outdated" };
    }
  };

  const freshness = getFreshnessStatus();

  // Count by category
  const stockCount = prices?.filter(p => p.category === "stock").length ?? 0;
  const commodityCount = prices?.filter(p => p.category === "commodity").length ?? 0;

  // Refresh prices from API
  const handleRefreshPrices = useCallback(async () => {
    if (isRefreshingRef.current) return; // Prevent concurrent refreshes
    
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    
    // Reset countdown and store new timestamp
    const newTimestamp = Date.now() + REFRESH_INTERVAL_SECONDS * 1000;
    setStoredNextRefresh(newTimestamp);
    setSecondsRemaining(REFRESH_INTERVAL_SECONDS);
    
    try {
      const { data, error } = await supabase.functions.invoke("fetch-steel-prices");
      
      if (error) throw error;
      
      toast({
        title: "Prices Updated",
        description: `Successfully refreshed ${data?.updated ?? 0} price entries.`,
      });
      
      // Refetch local data
      await refetch();
    } catch (error) {
      console.error("Error refreshing prices:", error);
      toast({
        title: "Refresh Failed",
        description: "Could not fetch latest prices. Check API configuration.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [refetch, toast]);

  // Countdown timer — purely informational. The server cron job
  // (auto-refresh-steel-prices-15min) is the source of truth and runs
  // every 15 minutes regardless of whether this tab is open.
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Server just refreshed — pull the latest prices into the UI
          refetch();
          const newTimestamp = Date.now() + REFRESH_INTERVAL_SECONDS * 1000;
          setStoredNextRefresh(newTimestamp);
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Format price with currency
  const formatPrice = (price: number, currency: string) => {
    if (currency === "USD") {
      return price >= 100 ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`;
    }
    return `${price.toFixed(2)} ${currency}`;
  };

  // Get trend icon
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-rose-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  // Get change color class
  const getChangeColor = (change: number) => {
    if (change > 0) return "text-emerald-500";
    if (change < 0) return "text-rose-500";
    return "text-muted-foreground";
  };

  // Preview prices - show top 8 mixed
  const previewPrices = prices?.slice(0, 8) ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Price Ticker Management
            </CardTitle>
            <CardDescription>
              Prices refresh automatically every 15 minutes on the server — no clicks required.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* Countdown Timer */}
            <div className="flex items-center gap-2 text-sm font-mono bg-muted/80 px-3 py-1.5 rounded-md border">
              <Timer className="h-4 w-4 text-accent" />
              <span className="tabular-nums font-semibold">{formatCountdown(secondsRemaining)}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">next auto-refresh</span>
            </div>
            <Button 
              onClick={handleRefreshPrices} 
              disabled={isRefreshing}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Prices"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Row */}
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-muted/50">
          {/* Freshness Indicator */}
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${freshness.color}`} />
            <span className="font-medium">{freshness.label}</span>
          </div>
          
          <div className="h-4 w-px bg-border" />
          
          {/* Last Updated */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {lastUpdate ? (
              <span>Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}</span>
            ) : (
              <span>Never updated</span>
            )}
          </div>
          
          <div className="h-4 w-px bg-border" />
          
          {/* Counts */}
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {stockCount} Stocks
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Database className="h-3 w-3" />
              {commodityCount} Commodities
            </Badge>
          </div>
        </div>

        {/* Freshness Warning */}
        {freshness.status === "outdated" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Price data is over 6 hours old. Click "Refresh Prices" to update.</span>
          </div>
        )}

        {freshness.status === "fresh" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Price data is current and reliable.</span>
          </div>
        )}

        {/* Price Preview Table */}
        <div>
          <h4 className="text-sm font-medium mb-3">Price Preview</h4>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading prices...</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewPrices.map((price) => (
                    <TableRow key={price.id}>
                      <TableCell className="font-mono font-medium">{price.symbol}</TableCell>
                      <TableCell className="text-muted-foreground">{price.name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(price.price, price.currency)}
                      </TableCell>
                      <TableCell className={`text-right ${getChangeColor(price.change_percent)}`}>
                        {price.change_percent > 0 ? "+" : ""}
                        {price.change_percent.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {getTrendIcon(price.change_percent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* API Note */}
        <p className="text-xs text-muted-foreground">
          Note: Alpha Vantage free tier limits API calls to 5/minute. Commodity prices are simulated for demonstration.
        </p>
      </CardContent>
    </Card>
  );
}
