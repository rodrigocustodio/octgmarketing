import { useState } from "react";
import { useCoverageMatrix } from "@/hooks/useEditorialStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import OpportunityResearchDialog from "./OpportunityResearchDialog";

interface SelectedCell {
  regionId: string;
  regionName: string;
  topicId: string;
  topicName: string;
  articleCount: number;
}

export default function CoverageHeatmap() {
  const { data, isLoading } = useCoverageMatrix();
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coverage Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { regions, topics, matrix } = data;

  const getColor = (count: number) => {
    if (count === 0) return "bg-destructive/20 text-destructive hover:bg-destructive/30";
    if (count < 3) return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/30";
    if (count < 6) return "bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30";
    return "bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30";
  };

  const getCellData = (regionId: string, topicId: string) => {
    const cell = matrix.find(m => m.regionId === regionId && m.topicId === topicId);
    return {
      count: cell?.articleCount || 0,
      regionName: cell?.regionName || '',
      topicName: cell?.topicName || '',
    };
  };

  const handleCellClick = (regionId: string, topicId: string) => {
    const cellData = getCellData(regionId, topicId);
    setSelectedCell({
      regionId,
      regionName: cellData.regionName,
      topicId,
      topicName: cellData.topicName,
      articleCount: cellData.count,
    });
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Topic × Region Coverage</CardTitle>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-muted-foreground">Click cell to research</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-destructive/20" />
              <span>0</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-500/20" />
              <span>1-2</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500/20" />
              <span>3-5</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500/20" />
              <span>6+</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 font-medium text-muted-foreground sticky left-0 bg-card z-10">Topic</th>
                  {regions.map(region => (
                    <th key={region.id} className="p-2 font-medium text-muted-foreground text-center">
                      {region.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topics.map(topic => (
                  <tr key={topic.id} className="border-t border-border">
                    <td className="p-2 font-medium sticky left-0 bg-card">{topic.name}</td>
                    {regions.map(region => {
                      const cellData = getCellData(region.id, topic.id);
                      return (
                        <td key={region.id} className="p-1 text-center">
                          <button
                            onClick={() => handleCellClick(region.id, topic.id)}
                            className={cn(
                              "inline-flex items-center justify-center w-8 h-8 rounded text-xs font-medium transition-all cursor-pointer",
                              "hover:ring-2 hover:ring-primary/50 hover:scale-110",
                              getColor(cellData.count)
                            )}
                            title={`${cellData.regionName} × ${cellData.topicName}: ${cellData.count} articles`}
                          >
                            {cellData.count}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Research Dialog */}
      {selectedCell && (
        <OpportunityResearchDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          regionName={selectedCell.regionName}
          topicName={selectedCell.topicName}
          regionId={selectedCell.regionId}
          topicId={selectedCell.topicId}
          articleCount={selectedCell.articleCount}
        />
      )}
    </>
  );
}