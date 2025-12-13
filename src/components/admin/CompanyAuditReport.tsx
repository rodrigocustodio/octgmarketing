import { useState } from "react";
import { AuditResult, AuditSummary, useAuditCompanies } from "@/hooks/useCompanyAudit";
import { useUpdateCompany, Company } from "@/hooks/useCompanies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ClipboardCheck, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Globe,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Sparkles,
  ArrowRight,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CompanyAuditReportProps {
  companies: Company[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBadgeVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
}

function getQualityBadge(quality: string) {
  switch (quality) {
    case 'excellent': return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">Excellent</Badge>;
    case 'good': return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">Good</Badge>;
    case 'fair': return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">Fair</Badge>;
    case 'poor': return <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-300">Poor</Badge>;
    case 'missing': return <Badge variant="destructive">Missing</Badge>;
    default: return <Badge variant="outline">Unknown</Badge>;
  }
}

export function CompanyAuditReport({ companies }: CompanyAuditReportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, name: "" });
  const [applyingIds, setApplyingIds] = useState<Set<string>>(new Set());
  
  const auditMutation = useAuditCompanies();
  const updateCompany = useUpdateCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const BATCH_SIZE = 3;

  const handleRunAudit = async () => {
    const selectedCompanies = companies.slice(0, 50); // Limit to 50 for now
    const totalBatches = Math.ceil(selectedCompanies.length / BATCH_SIZE);
    
    setResults([]);
    setSummary(null);
    setProgress({ current: 0, total: selectedCompanies.length, name: "" });

    const allResults: AuditResult[] = [];

    for (let i = 0; i < selectedCompanies.length; i += BATCH_SIZE) {
      const batch = selectedCompanies.slice(i, i + BATCH_SIZE);
      setProgress({ 
        current: i, 
        total: selectedCompanies.length, 
        name: batch.map(c => c.name).join(", ") 
      });

      try {
        const { results: batchResults } = await auditMutation.mutateAsync(
          batch.map(c => ({
            id: c.id,
            name: c.name,
            website: c.website,
            description: c.description,
            industry_role: c.industry_role as string | null,
            headquarters: c.headquarters,
            country: c.country,
            year_founded: c.year_founded,
            region: c.regions?.name,
          }))
        );
        
        allResults.push(...batchResults);
        setResults([...allResults]);
      } catch (error) {
        console.error("Batch audit error:", error);
      }

      // Delay between batches
      if (i + BATCH_SIZE < selectedCompanies.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // Calculate final summary
    const finalSummary: AuditSummary = {
      total: allResults.length,
      averageScore: Math.round(allResults.reduce((sum, r) => sum + r.overall_score, 0) / allResults.length),
      companiesExist: allResults.filter(r => r.company_exists).length,
      websitesCorrect: allResults.filter(r => r.website_correct).length,
      websiteSuggestions: allResults.filter(r => r.website_suggestion).length,
      industryRoleCorrect: allResults.filter(r => r.industry_role_correct).length,
      headquartersCorrect: allResults.filter(r => r.headquarters_correct).length,
      yearFoundedCorrect: allResults.filter(r => r.year_founded_correct).length,
      excellentDescriptions: allResults.filter(r => r.description_quality === 'excellent').length,
      goodDescriptions: allResults.filter(r => r.description_quality === 'good').length,
      fairDescriptions: allResults.filter(r => r.description_quality === 'fair').length,
      poorDescriptions: allResults.filter(r => r.description_quality === 'poor').length,
      missingDescriptions: allResults.filter(r => r.description_quality === 'missing').length,
      errors: allResults.filter(r => r.error).length,
    };
    
    setSummary(finalSummary);
    setProgress({ current: selectedCompanies.length, total: selectedCompanies.length, name: "Complete" });
    
    toast({ 
      title: "Audit complete", 
      description: `Audited ${allResults.length} companies. Average score: ${finalSummary.averageScore}` 
    });
  };

  const handleApplySuggestion = async (result: AuditResult, field: string) => {
    setApplyingIds(prev => new Set(prev).add(`${result.company_id}-${field}`));
    
    try {
      const updateData: Record<string, any> = {};
      
      if (field === 'website' && result.website_suggestion) {
        updateData.website = result.website_suggestion.startsWith('http') 
          ? result.website_suggestion 
          : `https://${result.website_suggestion}`;
      }
      if (field === 'industry_role' && result.industry_role_suggestion) {
        updateData.industry_role = result.industry_role_suggestion;
      }
      if (field === 'headquarters' && result.headquarters_suggestion) {
        updateData.headquarters = result.headquarters_suggestion;
      }
      if (field === 'year_founded' && result.year_founded_suggestion) {
        updateData.year_founded = result.year_founded_suggestion;
      }

      if (Object.keys(updateData).length > 0) {
        await updateCompany.mutateAsync({
          id: result.company_id,
          data: updateData,
        });
        
        queryClient.invalidateQueries({ queryKey: ["companies-admin"] });
        toast({ title: "Applied suggestion", description: `Updated ${field} for ${result.company_name}` });
      }
    } catch (error) {
      toast({ 
        title: "Failed to apply", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setApplyingIds(prev => {
        const next = new Set(prev);
        next.delete(`${result.company_id}-${field}`);
        return next;
      });
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;
    
    const headers = ['Company', 'Score', 'Exists', 'Website OK', 'Website Suggestion', 'Industry OK', 'Industry Suggestion', 'HQ OK', 'HQ Suggestion', 'Year OK', 'Year Suggestion', 'Description Quality', 'Recommendations'];
    const rows = results.map(r => [
      r.company_name,
      r.overall_score,
      r.company_exists ? 'Yes' : 'No',
      r.website_correct ? 'Yes' : 'No',
      r.website_suggestion || '',
      r.industry_role_correct ? 'Yes' : 'No',
      r.industry_role_suggestion || '',
      r.headquarters_correct ? 'Yes' : 'No',
      r.headquarters_suggestion || '',
      r.year_founded_correct ? 'Yes' : 'No',
      r.year_founded_suggestion || '',
      r.description_quality,
      r.recommendations.join('; ')
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `company-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ClipboardCheck className="h-4 w-4" />
          Quality Audit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Company Quality Audit Report
          </DialogTitle>
          <DialogDescription>
            AI-powered verification of company data using Perplexity
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleRunAudit} 
              disabled={auditMutation.isPending || progress.current > 0 && progress.current < progress.total}
              className="gap-2"
            >
              {auditMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ClipboardCheck className="h-4 w-4" />
              )}
              Run Audit (First 50 Companies)
            </Button>
            
            {results.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Progress */}
          {progress.total > 0 && progress.current < progress.total && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Auditing: {progress.name}</span>
                    <span>{progress.current} / {progress.total}</span>
                  </div>
                  <Progress value={(progress.current / progress.total) * 100} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {summary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(summary.averageScore)}`}>
                      {summary.averageScore}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{summary.companiesExist}/{summary.total}</div>
                    <div className="text-xs text-muted-foreground">Verified</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{summary.websitesCorrect}/{summary.total}</div>
                    <div className="text-xs text-muted-foreground">Websites OK</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{summary.industryRoleCorrect}/{summary.total}</div>
                    <div className="text-xs text-muted-foreground">Industry OK</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold">{summary.headquartersCorrect}/{summary.total}</div>
                    <div className="text-xs text-muted-foreground">HQ OK</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-red-500">{summary.errors}</div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Table */}
          {results.length > 0 && (
            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Company</TableHead>
                    <TableHead className="w-[80px]">Score</TableHead>
                    <TableHead className="w-[80px]">Exists</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>HQ</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.company_id}>
                      <TableCell className="font-medium">{result.company_name}</TableCell>
                      <TableCell>
                        <Badge variant={getScoreBadgeVariant(result.overall_score)}>
                          {result.overall_score}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {result.company_exists ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {result.website_correct ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {result.website_suggestion && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs gap-1"
                              disabled={applyingIds.has(`${result.company_id}-website`)}
                              onClick={() => handleApplySuggestion(result, 'website')}
                            >
                              {applyingIds.has(`${result.company_id}-website`) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Globe className="h-3 w-3" />
                                  {result.website_suggestion}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {result.industry_role_correct ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {result.industry_role_suggestion && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs gap-1"
                              disabled={applyingIds.has(`${result.company_id}-industry_role`)}
                              onClick={() => handleApplySuggestion(result, 'industry_role')}
                            >
                              {applyingIds.has(`${result.company_id}-industry_role`) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Building2 className="h-3 w-3" />
                                  {result.industry_role_suggestion}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {result.headquarters_correct ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {result.headquarters_suggestion && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs gap-1 max-w-[150px] truncate"
                              disabled={applyingIds.has(`${result.company_id}-headquarters`)}
                              onClick={() => handleApplySuggestion(result, 'headquarters')}
                              title={result.headquarters_suggestion}
                            >
                              {applyingIds.has(`${result.company_id}-headquarters`) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{result.headquarters_suggestion}</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {result.year_founded_correct ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {result.year_founded_suggestion && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs gap-1"
                              disabled={applyingIds.has(`${result.company_id}-year_founded`)}
                              onClick={() => handleApplySuggestion(result, 'year_founded')}
                            >
                              {applyingIds.has(`${result.company_id}-year_founded`) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Calendar className="h-3 w-3" />
                                  {result.year_founded_suggestion}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getQualityBadge(result.description_quality)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
