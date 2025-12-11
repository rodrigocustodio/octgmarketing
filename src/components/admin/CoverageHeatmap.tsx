import { useCoverageMatrix } from "@/hooks/useEditorialStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function CoverageHeatmap() {
  const { data, isLoading } = useCoverageMatrix();

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
    if (count === 0) return "bg-destructive/20 text-destructive";
    if (count < 3) return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
    if (count < 6) return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
    return "bg-green-500/20 text-green-600 dark:text-green-400";
  };

  const getCellValue = (regionId: string, topicId: string) => {
    const cell = matrix.find(m => m.regionId === regionId && m.topicId === topicId);
    return cell?.articleCount || 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Region × Topic Coverage</span>
          <div className="flex items-center gap-4 text-xs font-normal">
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 font-medium text-muted-foreground">Region</th>
                {topics.map(topic => (
                  <th
                    key={topic.id}
                    className="p-2 font-medium text-muted-foreground text-center min-w-[80px]"
                  >
                    <span className="text-xs">{topic.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regions.map(region => (
                <tr key={region.id} className="border-t border-border">
                  <td className="p-2 font-medium">{region.name}</td>
                  {topics.map(topic => {
                    const count = getCellValue(region.id, topic.id);
                    return (
                      <td key={topic.id} className="p-1 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded text-xs font-medium",
                            getColor(count)
                          )}
                        >
                          {count}
                        </span>
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
  );
}
