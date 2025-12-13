import { useState, useRef } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { useCompaniesAdmin, useUpdateCompany, Company } from "@/hooks/useCompanies";
import { useRegions, INDUSTRY_ROLES } from "@/hooks/useDirectory";
import { useAuditCompanies, AuditResult, AuditSummary } from "@/hooks/useCompanyAudit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Play, 
  Square, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Building2,
  ChevronLeft,
  Wrench,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const BATCH_SIZE = 3;

const CompanyAudit = () => {
  const { data: companies, isLoading: loadingCompanies } = useCompaniesAdmin();
  const { data: regions } = useRegions();
  const auditMutation = useAuditCompanies();
  const updateCompany = useUpdateCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showFilter, setShowFilter] = useState<string>("all"); // all, issues, perfect

  // Audit state
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0, current: "" });
  const [fixingIds, setFixingIds] = useState<Set<string>>(new Set());
  const shouldStop = useRef(false);

  // Filter companies for audit
  const filteredCompanies = companies?.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = regionFilter === "all" || c.region_id === regionFilter;
    const matchesRole = roleFilter === "all" || c.industry_role === roleFilter;
    return matchesSearch && matchesRegion && matchesRole;
  }) || [];

  // Filter audit results for display
  const filteredResults = auditResults.filter(r => {
    if (showFilter === "issues") return r.overall_score < 80;
    if (showFilter === "perfect") return r.overall_score >= 90;
    return true;
  });

  const runAudit = async () => {
    if (filteredCompanies.length === 0) {
      toast({ title: "No companies to audit", variant: "destructive" });
      return;
    }

    setIsAuditing(true);
    setAuditResults([]);
    setAuditSummary(null);
    shouldStop.current = false;

    const allResults: AuditResult[] = [];
    const total = Math.min(filteredCompanies.length, 100); // Limit to 100 for performance
    const companiesToAudit = filteredCompanies.slice(0, total);

    setProgress({ completed: 0, total, current: "" });

    // Process in batches
    for (let i = 0; i < companiesToAudit.length; i += BATCH_SIZE) {
      if (shouldStop.current) break;

      const batch = companiesToAudit.slice(i, i + BATCH_SIZE);
      
      flushSync(() => {
        setProgress(prev => ({ ...prev, current: batch.map(c => c.name).join(", ") }));
      });

      try {
        const { results } = await auditMutation.mutateAsync(
          batch.map(c => ({
            id: c.id,
            name: c.name,
            website: c.website,
            description: c.description,
            industry_role: c.industry_role,
            headquarters: c.headquarters,
            country: c.country,
            year_founded: c.year_founded,
            region: regions?.find(r => r.id === c.region_id)?.name,
          }))
        );

        allResults.push(...results);
        
        flushSync(() => {
          setAuditResults([...allResults]);
          setProgress(prev => ({ ...prev, completed: prev.completed + batch.length }));
        });

        // Delay between batches
        if (i + BATCH_SIZE < companiesToAudit.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error("Audit batch failed:", error);
        toast({ 
          title: "Batch failed", 
          description: `Failed to audit: ${batch.map(c => c.name).join(", ")}`,
          variant: "destructive" 
        });
      }
    }

    // Calculate summary
    const summary: AuditSummary = {
      total: allResults.length,
      averageScore: allResults.length > 0 
        ? Math.round(allResults.reduce((sum, r) => sum + r.overall_score, 0) / allResults.length) 
        : 0,
      companiesExist: allResults.filter(r => r.company_exists).length,
      websitesCorrect: allResults.filter(r => r.website_correct).length,
      websiteSuggestions: allResults.filter(r => r.website_suggestion).length,
      industryRoleCorrect: allResults.filter(r => r.industry_role_correct).length,
      headquartersCorrect: allResults.filter(r => r.headquarters_correct).length,
      yearFoundedCorrect: allResults.filter(r => r.year_founded_correct).length,
      excellentDescriptions: allResults.filter(r => r.description_quality === "excellent").length,
      goodDescriptions: allResults.filter(r => r.description_quality === "good").length,
      fairDescriptions: allResults.filter(r => r.description_quality === "fair").length,
      poorDescriptions: allResults.filter(r => r.description_quality === "poor").length,
      missingDescriptions: allResults.filter(r => r.description_quality === "missing").length,
      errors: allResults.filter(r => r.error).length,
    };

    setAuditSummary(summary);
    setIsAuditing(false);

    if (!shouldStop.current) {
      toast({ 
        title: "Audit complete", 
        description: `Audited ${allResults.length} companies. Average score: ${summary.averageScore}%` 
      });
    }
  };

  const stopAudit = () => {
    shouldStop.current = true;
    setIsAuditing(false);
  };

  const VALID_INDUSTRY_ROLES = ['mill', 'yard', 'inspection', 'drilling', 'logistics', 'software', 'trading'];

  const applyFix = async (result: AuditResult, field: 'website' | 'industry_role' | 'headquarters' | 'year_founded') => {
    const fixId = `${result.company_id}-${field}`;
    setFixingIds(prev => new Set(prev).add(fixId));

    try {
      const updateData: Record<string, any> = {};
      
      if (field === 'website' && result.website_suggestion) {
        updateData.website = result.website_suggestion;
      } else if (field === 'industry_role' && result.industry_role_suggestion) {
        // Validate industry role before applying
        if (!VALID_INDUSTRY_ROLES.includes(result.industry_role_suggestion)) {
          toast({ 
            title: "Invalid suggestion", 
            description: `"${result.industry_role_suggestion}" is not a valid industry role. Valid: ${VALID_INDUSTRY_ROLES.join(', ')}`,
            variant: "destructive" 
          });
          return;
        }
        updateData.industry_role = result.industry_role_suggestion;
      } else if (field === 'headquarters' && result.headquarters_suggestion) {
        updateData.headquarters = result.headquarters_suggestion;
      } else if (field === 'year_founded' && result.year_founded_suggestion) {
        updateData.year_founded = result.year_founded_suggestion;
      }

      if (Object.keys(updateData).length > 0) {
        await updateCompany.mutateAsync({
          id: result.company_id,
          data: updateData,
        });

        // Update local result to reflect fix - only after successful save
        setAuditResults(prev => prev.map(r => {
          if (r.company_id === result.company_id) {
            const updated = { ...r };
            if (field === 'website') {
              updated.website_correct = true;
              updated.website_suggestion = null;
            } else if (field === 'industry_role') {
              updated.industry_role_correct = true;
              updated.industry_role_suggestion = null;
            } else if (field === 'headquarters') {
              updated.headquarters_correct = true;
              updated.headquarters_suggestion = null;
            } else if (field === 'year_founded') {
              updated.year_founded_correct = true;
              updated.year_founded_suggestion = null;
            }
            return updated;
          }
          return r;
        }));

        toast({ title: "Fixed", description: `Updated ${field} for ${result.company_name}` });
      }
    } catch (error) {
      console.error("Fix failed:", error);
      toast({ 
        title: "Fix failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setFixingIds(prev => {
        const next = new Set(prev);
        next.delete(fixId);
        return next;
      });
    }
  };

  const applyAllFixes = async (result: AuditResult) => {
    const fixId = `${result.company_id}-all`;
    setFixingIds(prev => new Set(prev).add(fixId));

    try {
      const updateData: Record<string, any> = {};
      
      if (result.website_suggestion) updateData.website = result.website_suggestion;
      // Validate industry role before including
      if (result.industry_role_suggestion && VALID_INDUSTRY_ROLES.includes(result.industry_role_suggestion)) {
        updateData.industry_role = result.industry_role_suggestion;
      }
      if (result.headquarters_suggestion) updateData.headquarters = result.headquarters_suggestion;
      if (result.year_founded_suggestion) updateData.year_founded = result.year_founded_suggestion;

      if (Object.keys(updateData).length > 0) {
        await updateCompany.mutateAsync({
          id: result.company_id,
          data: updateData,
        });

        // Update local result - only after successful save
        setAuditResults(prev => prev.map(r => {
          if (r.company_id === result.company_id) {
            const updated = { ...r };
            if (updateData.website) {
              updated.website_correct = true;
              updated.website_suggestion = null;
            }
            if (updateData.industry_role) {
              updated.industry_role_correct = true;
              updated.industry_role_suggestion = null;
            }
            if (updateData.headquarters) {
              updated.headquarters_correct = true;
              updated.headquarters_suggestion = null;
            }
            if (updateData.year_founded) {
              updated.year_founded_correct = true;
              updated.year_founded_suggestion = null;
            }
            return updated;
          }
          return r;
        }));

        toast({ title: "Fixes applied", description: `Updated ${Object.keys(updateData).length} fields for ${result.company_name}` });
      }
    } catch (error) {
      console.error("Fix all failed:", error);
      toast({ 
        title: "Fix failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setFixingIds(prev => {
        const next = new Set(prev);
        next.delete(fixId);
        return next;
      });
    }
  };

  const exportCSV = () => {
    if (auditResults.length === 0) return;

    const headers = ["Company", "Score", "Exists", "Website OK", "Website Suggestion", "Industry OK", "Industry Suggestion", "HQ OK", "HQ Suggestion", "Year OK", "Year Suggestion", "Description Quality", "Recommendations"];
    const rows = auditResults.map(r => [
      r.company_name,
      r.overall_score,
      r.company_exists ? "Yes" : "No",
      r.website_correct ? "Yes" : "No",
      r.website_suggestion || "",
      r.industry_role_correct ? "Yes" : "No",
      r.industry_role_suggestion || "",
      r.headquarters_correct ? "Yes" : "No",
      r.headquarters_suggestion || "",
      r.year_founded_correct ? "Yes" : "No",
      r.year_founded_suggestion || "",
      r.description_quality,
      r.recommendations?.join("; ") || "",
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `company-audit-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "bg-green-500/20 text-green-700 dark:text-green-300";
    if (score >= 60) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
    return "bg-red-500/20 text-red-700 dark:text-red-300";
  };

  const hasIssues = (result: AuditResult) => {
    return result.website_suggestion || result.industry_role_suggestion || 
           result.headquarters_suggestion || result.year_founded_suggestion;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/companies">
              <Button variant="ghost" size="icon" aria-label="Back to companies">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold">Company Quality Audit</h1>
              <p className="text-muted-foreground">AI-powered verification of company data using Perplexity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {auditResults.length > 0 && (
              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
            {isAuditing ? (
              <Button variant="destructive" onClick={stopAudit}>
                <Square className="h-4 w-4 mr-2" />
                Stop Audit
              </Button>
            ) : (
              <Button onClick={runAudit} disabled={filteredCompanies.length === 0}>
                <Play className="h-4 w-4 mr-2" />
                Run Audit ({Math.min(filteredCompanies.length, 100)} companies)
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions?.map(region => (
                    <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {INDUSTRY_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {auditResults.length > 0 && (
                <Select value={showFilter} onValueChange={setShowFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Show All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Show All</SelectItem>
                    <SelectItem value="issues">Issues Only</SelectItem>
                    <SelectItem value="perfect">Perfect Only (90+)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        {isAuditing && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Auditing: {progress.current}</span>
                  <span>{progress.completed} / {progress.total}</span>
                </div>
                <Progress value={(progress.completed / progress.total) * 100} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {auditSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <div className={cn("text-3xl font-bold", getScoreColor(auditSummary.averageScore))}>
                  {auditSummary.averageScore}%
                </div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-3xl font-bold">{auditSummary.total}</div>
                <p className="text-sm text-muted-foreground">Audited</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {auditSummary.websitesCorrect}
                </div>
                <p className="text-sm text-muted-foreground">Websites OK</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {auditSummary.websiteSuggestions}
                </div>
                <p className="text-sm text-muted-foreground">Website Fixes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {auditSummary.excellentDescriptions + auditSummary.goodDescriptions}
                </div>
                <p className="text-sm text-muted-foreground">Good Descriptions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {auditSummary.errors}
                </div>
                <p className="text-sm text-muted-foreground">Errors</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Table */}
        {auditResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Audit Results ({filteredResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-center w-20">Score</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Headquarters</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map(result => (
                      <TableRow key={result.company_id}>
                        <TableCell>
                          <Link 
                            to={`/admin/companies/${result.company_id}`}
                            className="font-medium hover:underline"
                          >
                            {result.company_name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-xs", getScoreBadge(result.overall_score))}>
                            {result.overall_score}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {result.website_correct ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-4 w-4" /> OK
                            </span>
                          ) : result.website_suggestion ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                              onClick={() => applyFix(result, 'website')}
                              disabled={fixingIds.has(`${result.company_id}-website`)}
                            >
                              {fixingIds.has(`${result.company_id}-website`) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-1" />
                              )}
                              <span className="text-xs truncate max-w-[120px]">
                                Fix: {result.website_suggestion}
                              </span>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.industry_role_correct ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-4 w-4" /> OK
                            </span>
                          ) : result.industry_role_suggestion ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                              onClick={() => applyFix(result, 'industry_role')}
                              disabled={fixingIds.has(`${result.company_id}-industry_role`)}
                            >
                              {fixingIds.has(`${result.company_id}-industry_role`) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-1" />
                              )}
                              <span className="text-xs">Fix: {result.industry_role_suggestion}</span>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.headquarters_correct ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-4 w-4" /> OK
                            </span>
                          ) : result.headquarters_suggestion ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                              onClick={() => applyFix(result, 'headquarters')}
                              disabled={fixingIds.has(`${result.company_id}-headquarters`)}
                            >
                              {fixingIds.has(`${result.company_id}-headquarters`) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-1" />
                              )}
                              <span className="text-xs truncate max-w-[100px]">
                                Fix: {result.headquarters_suggestion}
                              </span>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.year_founded_correct ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-4 w-4" /> OK
                            </span>
                          ) : result.year_founded_suggestion ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                              onClick={() => applyFix(result, 'year_founded')}
                              disabled={fixingIds.has(`${result.company_id}-year_founded`)}
                            >
                              {fixingIds.has(`${result.company_id}-year_founded`) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-1" />
                              )}
                              <span className="text-xs">Fix: {result.year_founded_suggestion}</span>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-xs",
                              result.description_quality === "excellent" && "border-green-500 text-green-600",
                              result.description_quality === "good" && "border-green-400 text-green-500",
                              result.description_quality === "fair" && "border-yellow-500 text-yellow-600",
                              result.description_quality === "poor" && "border-red-500 text-red-600",
                              result.description_quality === "missing" && "border-gray-500 text-gray-600",
                            )}
                          >
                            {result.description_quality}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {hasIssues(result) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => applyAllFixes(result)}
                              disabled={fixingIds.has(`${result.company_id}-all`)}
                              className="gap-1"
                            >
                              {fixingIds.has(`${result.company_id}-all`) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Wrench className="h-3 w-3" />
                              )}
                              Apply All
                            </Button>
                          ) : (
                            <span className="text-green-600 dark:text-green-400 text-xs flex items-center gap-1 justify-end">
                              <CheckCircle2 className="h-4 w-4" /> Perfect
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isAuditing && auditResults.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Audit Results</h3>
              <p className="text-muted-foreground mb-4">
                Filter companies above and click "Run Audit" to verify data quality with AI
              </p>
              <p className="text-sm text-muted-foreground">
                {filteredCompanies.length} companies selected for audit
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default CompanyAudit;
