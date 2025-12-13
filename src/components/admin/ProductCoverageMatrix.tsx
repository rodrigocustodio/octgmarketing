import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import OpportunityResearchDialog from "./OpportunityResearchDialog";

interface ProductCoverage {
  productId: string;
  productName: string;
  categoryName: string;
  articleCount: number;
}

export default function ProductCoverageMatrix() {
  const [selectedProduct, setSelectedProduct] = useState<ProductCoverage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["product-coverage-matrix"],
    queryFn: async () => {
      const [productsResult, categoriesResult, productArticlesResult] = await Promise.all([
        supabase.from("products").select("id, name, category_id").order("name"),
        supabase.from("product_categories").select("id, name"),
        supabase.from("product_articles").select("product_id, article_id"),
      ]);

      const products = productsResult.data || [];
      const categories = categoriesResult.data || [];
      const productArticles = productArticlesResult.data || [];

      const categoryMap = new Map(categories.map(c => [c.id, c.name]));

      // Count articles per product
      const articleCountMap = new Map<string, number>();
      for (const pa of productArticles) {
        articleCountMap.set(pa.product_id, (articleCountMap.get(pa.product_id) || 0) + 1);
      }

      const coverage: ProductCoverage[] = products.map(product => ({
        productId: product.id,
        productName: product.name,
        categoryName: categoryMap.get(product.category_id || '') || 'Uncategorized',
        articleCount: articleCountMap.get(product.id) || 0,
      }));

      // Sort by article count (lowest first to show gaps)
      coverage.sort((a, b) => a.articleCount - b.articleCount);

      // Group by category
      const byCategory = new Map<string, ProductCoverage[]>();
      for (const item of coverage) {
        const existing = byCategory.get(item.categoryName) || [];
        existing.push(item);
        byCategory.set(item.categoryName, existing);
      }

      const uncoveredCount = coverage.filter(p => p.articleCount === 0).length;
      const totalProducts = coverage.length;

      return {
        coverage,
        byCategory: Object.fromEntries(byCategory),
        uncoveredCount,
        totalProducts,
      };
    },
  });

  const getColor = (count: number) => {
    if (count === 0) return "bg-destructive/20 text-destructive";
    if (count < 2) return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
    return "bg-green-500/20 text-green-600 dark:text-green-400";
  };

  const handleProductClick = (product: ProductCoverage) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OCTG Product Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              OCTG Product Coverage
            </div>
            <div className="flex items-center gap-4 text-xs font-normal">
              <Badge variant="outline">
                {data.uncoveredCount} uncovered / {data.totalProducts} products
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Click any product to research article ideas. Products with 0 articles need coverage priority.
          </p>

          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {Object.entries(data.byCategory).map(([categoryName, products]) => (
                <div key={categoryName}>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    {categoryName}
                    <Badge variant="secondary" className="text-xs">
                      {products.filter((p: ProductCoverage) => p.articleCount === 0).length} gaps
                    </Badge>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {products.map((product: ProductCoverage) => (
                      <button
                        key={product.productId}
                        onClick={() => handleProductClick(product)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:ring-2 hover:ring-primary/50",
                          getColor(product.articleCount)
                        )}
                      >
                        {product.productName}
                        <span className="ml-1 opacity-70">({product.articleCount})</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-destructive/20" />
              <span>0 articles</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-500/20" />
              <span>1 article</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500/20" />
              <span>2+ articles</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Research Dialog */}
      {selectedProduct && (
        <OpportunityResearchDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          regionName={null}
          topicName={selectedProduct.productName}
          regionId={null}
          topicId={null}
          articleCount={selectedProduct.articleCount}
        />
      )}
    </>
  );
}