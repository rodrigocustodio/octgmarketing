import { useState, useRef } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { useCompaniesAdmin, useGenerateCompanyDescription, useUpdateCompany, useEnrichCompanyProfile, useFindCompanyWebsite, useScrapeAdipecExhibitors, useCleanupJunkCompanies, Company, EnrichedCompanyData } from "@/hooks/useCompanies";
import { useRegions } from "@/hooks/useDirectory";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Search, Plus, Building2, Edit, AlertCircle, CheckCircle2, Sparkles, Loader2, Check, Square, Zap, Globe, Phone, Calendar, Briefcase, MapPin, Download, Trash2 } from "lucide-react";
import { INDUSTRY_ROLES } from "@/hooks/useDirectory";

import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const BATCH_SIZE = 10; // Increased batch size for better throughput

const Companies = () => {
  const { data: companies, isLoading } = useCompaniesAdmin();
  const { data: regions } = useRegions();
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [descFilter, setDescFilter] = useState<string>("all");
  const [enrichFilter, setEnrichFilter] = useState<string>("all");
  const [websiteFilter, setWebsiteFilter] = useState<string>("all");
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  
  // Cleanup dialog state
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  
  // Bulk generation state
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [isBulkEnriching, setIsBulkEnriching] = useState(false);
  const [isFindingWebsites, setIsFindingWebsites] = useState(false);
  const [isFindingCompanies, setIsFindingCompanies] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({
    completed: 0,
    total: 0,
    current: "",
    batchCurrent: 0,
    currentBatch: 0,
    totalBatches: 0,
    fieldsUpdated: 0,
  });
  const shouldStopBulk = useRef(false);
  
  const generateDescription = useGenerateCompanyDescription();
  const enrichCompany = useEnrichCompanyProfile();
  const findWebsite = useFindCompanyWebsite();
  const scrapeAdipec = useScrapeAdipecExhibitors();
  const cleanupJunk = useCleanupJunkCompanies();
  const updateCompany = useUpdateCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Count junk entries (starts with underscore or contains "/_")
  const junkCount = companies?.filter(c => c.name.startsWith("_") || c.name.includes("/_")).length || 0;

  // Handle Find Companies from ADIPEC
  const handleFindCompanies = async () => {
    setIsFindingCompanies(true);
    
    try {
      toast({ title: "Scraping ADIPEC exhibitor list...", description: "This may take a moment" });
      
      const result = await scrapeAdipec.mutateAsync();
      
      if (result.success) {
        toast({ 
          title: "Company discovery complete!", 
          description: `Found ${result.totalFound} companies, skipped ${result.duplicatesSkipped} duplicates, added ${result.newCompaniesAdded} new companies` 
        });
      } else {
        toast({ 
          title: "Scrape failed", 
          description: result.error || "Unknown error",
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Error scraping ADIPEC:', error);
      toast({ 
        title: "Scrape failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsFindingCompanies(false);
    }
  };

  // Handle Cleanup Junk Companies
  const handleCleanupJunk = async () => {
    setIsCleaningUp(true);
    
    try {
      const result = await cleanupJunk.mutateAsync();
      
      if (result.success) {
        toast({ 
          title: "Cleanup complete!", 
          description: `Deleted ${result.deletedCount} junk entries` 
        });
        setShowCleanupDialog(false);
      } else {
        toast({ 
          title: "Cleanup failed", 
          description: result.error || "Unknown error",
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Error cleaning up junk companies:', error);
      toast({ 
        title: "Cleanup failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Count missing data
  const missingCount = companies?.filter(c => !c.description || c.description.length === 0).length || 0;
  const missingWebsite = companies?.filter(c => !c.website).length || 0;
  const missingRole = companies?.filter(c => !c.industry_role).length || 0;
  const missingRegion = companies?.filter(c => !c.region_id).length || 0;
  const missingSolutions = companies?.filter(c => !c.solutions || (c.solutions as any[]).length === 0).length || 0;
  
  // Helper to count missing critical fields for a company
  const getMissingFieldCount = (c: Company) => {
    return [
      !c.description,
      !c.website, 
      !c.industry_role,
      !c.region_id,
      !c.headquarters,
      !c.solutions || (c.solutions as any[]).length === 0
    ].filter(Boolean).length;
  };
  
  // Only count companies with 2+ missing fields as truly incomplete
  const incompleteCount = companies?.filter(c => getMissingFieldCount(c) >= 2).length || 0;

  const handleQuickGenerate = async (company: Company) => {
    setGeneratingIds(prev => new Set(prev).add(company.id));
    
    try {
      const result = await generateDescription.mutateAsync({
        companyName: company.name,
        website: company.website || undefined,
      });
      
      await updateCompany.mutateAsync({
        id: company.id,
        data: { description: result.description },
      });
      
      queryClient.invalidateQueries({ queryKey: ["companies-admin"] });
      
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(company.id);
        return next;
      });
      setCompletedIds(prev => new Set(prev).add(company.id));
      
      toast({ title: "Description generated and saved" });
      
      setTimeout(() => {
        setCompletedIds(prev => {
          const next = new Set(prev);
          next.delete(company.id);
          return next;
        });
      }, 3000);
    } catch (error) {
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(company.id);
        return next;
      });
      toast({ 
        title: "Generation failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const handleBulkGenerate = async () => {
    const missingCompanies = companies?.filter(c => !c.description || c.description.length === 0) || [];
    
    if (missingCompanies.length === 0) return;
    
    const totalBatches = Math.ceil(missingCompanies.length / BATCH_SIZE);
    
    setIsBulkGenerating(true);
    setBulkProgress({
      completed: 0,
      total: missingCompanies.length,
      current: "",
      batchCurrent: 0,
      currentBatch: 1,
      totalBatches,
      fieldsUpdated: 0,
    });
    shouldStopBulk.current = false;
    
    let successCount = 0;
    let failCount = 0;
    let batchNumber = 1;
    
    // Process in batches
    for (let i = 0; i < missingCompanies.length; i += BATCH_SIZE) {
      if (shouldStopBulk.current) break;
      
      const batch = missingCompanies.slice(i, i + BATCH_SIZE);
      flushSync(() => {
        setBulkProgress(prev => ({ ...prev, currentBatch: batchNumber }));
      });
      
      // Process each company in the batch
      for (let j = 0; j < batch.length; j++) {
        if (shouldStopBulk.current) {
          toast({ title: "Bulk generation stopped", description: `Completed ${successCount} of ${missingCompanies.length}` });
          break;
        }
        
        const company = batch[j];
        flushSync(() => {
          setBulkProgress(prev => ({
            ...prev,
            current: company.name,
            batchCurrent: j + 1,
          }));
        });
        
        try {
          const result = await generateDescription.mutateAsync({
            companyName: company.name,
            website: company.website || undefined,
          });
          
          await updateCompany.mutateAsync({
            id: company.id,
            data: { description: result.description },
          });
          
          successCount++;
        } catch (error) {
          console.error(`Failed to generate for ${company.name}:`, error);
          failCount++;
        }
        
        flushSync(() => {
          setBulkProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
        });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Refresh data after each batch
      queryClient.invalidateQueries({ queryKey: ["companies-admin"] });
      batchNumber++;
      
      // Pause between batches to avoid rate limiting
      if (!shouldStopBulk.current && i + BATCH_SIZE < missingCompanies.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ["companies-admin"] });
    setIsBulkGenerating(false);
    
    if (!shouldStopBulk.current) {
      toast({ 
        title: "Bulk generation complete", 
        description: `Generated ${successCount} descriptions${failCount > 0 ? `, ${failCount} failed` : ""}` 
      });
    }
  };

  // Single company enrichment
  const handleEnrich = async (company: Company) => {
    setEnrichingIds(prev => new Set(prev).add(company.id));
    
    try {
      const result = await enrichCompany.mutateAsync({
        companyName: company.name,
        existingData: {
          website: company.website,
          description: company.description,
          industry_role: company.industry_role,
          headquarters: company.headquarters,
          country: company.country,
        },
      });
      
      // Map region slug to region_id
      let region_id = company.region_id;
      if (result.region && regions) {
        const matchedRegion = regions.find(r => 
          r.slug.toLowerCase() === result.region?.toLowerCase() ||
          r.name.toLowerCase().includes(result.region?.toLowerCase() || "")
        );
        if (matchedRegion) {
          region_id = matchedRegion.id;
        }
      }
      
      // Build update object with only new/missing fields
      const updateData: Record<string, any> = {};
      if (result.description && !company.description) updateData.description = result.description;
      if (result.website && !company.website) updateData.website = result.website;
      if (result.industry_role && !company.industry_role) updateData.industry_role = result.industry_role;
      if (region_id && !company.region_id) updateData.region_id = region_id;
      if (result.year_founded && !company.year_founded) updateData.year_founded = result.year_founded;
      if (result.phone && !company.phone) updateData.phone = result.phone;
      if (result.email && !company.email) updateData.email = result.email;
      if (result.headquarters && !company.headquarters) updateData.headquarters = result.headquarters;
      if (result.country && !company.country) updateData.country = result.country;
      if (result.solutions && result.solutions.length > 0 && (!company.solutions || (company.solutions as any[]).length === 0)) {
        updateData.solutions = result.solutions;
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateCompany.mutateAsync({
          id: company.id,
          data: updateData,
        });
        toast({ 
          title: "Profile enriched", 
          description: `Updated ${Object.keys(updateData).length} field(s)` 
        });
      } else {
        toast({ title: "No new data found", description: "Company profile is already complete" });
      }
      
      queryClient.invalidateQueries({ queryKey: ["companies-admin"] });
      setCompletedIds(prev => new Set(prev).add(company.id));
      
      setTimeout(() => {
        setCompletedIds(prev => {
          const next = new Set(prev);
          next.delete(company.id);
          return next;
        });
      }, 3000);
    } catch (error) {
      toast({ 
        title: "Enrichment failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setEnrichingIds(prev => {
        const next = new Set(prev);
        next.delete(company.id);
        return next;
      });
    }
  };

  // Bulk enrichment - only process companies with 2+ missing fields
  const handleBulkEnrich = async () => {
    const incompleteCompanies = companies?.filter(c => getMissingFieldCount(c) >= 2) || [];
    
    if (incompleteCompanies.length === 0) {
      toast({ title: "All companies complete", description: "No companies need enrichment (all have 4+ of 5 key fields)" });
      return;
    }
    
    const totalBatches = Math.ceil(incompleteCompanies.length / BATCH_SIZE);
    
    setIsBulkEnriching(true);
    setBulkProgress({
      completed: 0,
      total: incompleteCompanies.length,
      current: "",
      batchCurrent: 0,
      currentBatch: 1,
      totalBatches,
      fieldsUpdated: 0,
    });
    shouldStopBulk.current = false;
    
    let successCount = 0;
    let failCount = 0;
    let totalFieldsUpdated = 0;
    let batchNumber = 1;
    
    for (let i = 0; i < incompleteCompanies.length; i += BATCH_SIZE) {
      if (shouldStopBulk.current) break;
      
      const batch = incompleteCompanies.slice(i, i + BATCH_SIZE);
      flushSync(() => {
        setBulkProgress(prev => ({ ...prev, currentBatch: batchNumber }));
      });
      
      for (let j = 0; j < batch.length; j++) {
        if (shouldStopBulk.current) {
          toast({ title: "Bulk enrichment stopped", description: `Completed ${successCount} of ${incompleteCompanies.length}` });
          break;
        }
        
        const company = batch[j];
        flushSync(() => {
          setBulkProgress(prev => ({
            ...prev,
            current: company.name,
            batchCurrent: j + 1,
          }));
        });
        
        try {
          const result = await enrichCompany.mutateAsync({
            companyName: company.name,
            existingData: {
              website: company.website,
              description: company.description,
              industry_role: company.industry_role,
              headquarters: company.headquarters,
              country: company.country,
            },
          });
          
          // Map region
          let region_id = company.region_id;
          if (result.region && regions) {
            const matchedRegion = regions.find(r => 
              r.slug.toLowerCase() === result.region?.toLowerCase() ||
              r.name.toLowerCase().includes(result.region?.toLowerCase() || "")
            );
            if (matchedRegion) {
              region_id = matchedRegion.id;
            }
          }
          
          const updateData: Record<string, any> = {};
          if (result.description && !company.description) updateData.description = result.description;
          if (result.website && !company.website) updateData.website = result.website;
          if (result.industry_role && !company.industry_role) updateData.industry_role = result.industry_role;
          if (region_id && !company.region_id) updateData.region_id = region_id;
          if (result.year_founded && !company.year_founded) updateData.year_founded = result.year_founded;
          if (result.phone && !company.phone) updateData.phone = result.phone;
          if (result.email && !company.email) updateData.email = result.email;
          if (result.headquarters && !company.headquarters) updateData.headquarters = result.headquarters;
          if (result.country && !company.country) updateData.country = result.country;
          if (result.solutions && result.solutions.length > 0 && (!company.solutions || (company.solutions as any[]).length === 0)) {
            updateData.solutions = result.solutions;
          }
          
          if (Object.keys(updateData).length > 0) {
            await updateCompany.mutateAsync({
              id: company.id,
              data: updateData,
            });
            totalFieldsUpdated += Object.keys(updateData).length;
          }
          
          successCount++;
        } catch (error) {
          console.error(`Failed to enrich ${company.name}:`, error);
          failCount++;
        }
        
        flushSync(() => {
          setBulkProgress(prev => ({ 
            ...prev, 
            completed: prev.completed + 1,
            fieldsUpdated: totalFieldsUpdated,
          }));
        });
        
        // Longer delay for enrichment (more API calls)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      queryClient.invalidateQueries({ queryKey: ["companies-admin"] });
      batchNumber++;
      
      if (!shouldStopBulk.current && i + BATCH_SIZE < incompleteCompanies.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ["companies-admin"] });
    setIsBulkEnriching(false);
    
    if (!shouldStopBulk.current) {
      toast({ 
        title: "Bulk enrichment complete", 
        description: `Enriched ${successCount} companies, updated ${totalFieldsUpdated} fields${failCount > 0 ? `, ${failCount} failed` : ""}` 
      });
    }
  };

  const handleStopBulk = () => {
    shouldStopBulk.current = true;
  };

  // Bulk find missing websites only
  const handleBulkFindWebsites = async () => {
    const companiesWithoutWebsite = companies?.filter(c => !c.website) || [];
    
    if (companiesWithoutWebsite.length === 0) {
      toast({ title: "All companies have websites", description: "No companies are missing website data" });
      return;
    }
    
    const totalBatches = Math.ceil(companiesWithoutWebsite.length / BATCH_SIZE);
    
    setIsFindingWebsites(true);
    setBulkProgress({
      completed: 0,
      total: companiesWithoutWebsite.length,
      current: "",
      batchCurrent: 0,
      currentBatch: 1,
      totalBatches,
      fieldsUpdated: 0,
    });
    shouldStopBulk.current = false;
    
    let foundCount = 0;
    let notFoundCount = 0;
    let batchNumber = 1;
    
    for (let i = 0; i < companiesWithoutWebsite.length; i += BATCH_SIZE) {
      if (shouldStopBulk.current) break;
      
      const batch = companiesWithoutWebsite.slice(i, i + BATCH_SIZE);
      flushSync(() => {
        setBulkProgress(prev => ({ ...prev, currentBatch: batchNumber }));
      });
      
      for (let j = 0; j < batch.length; j++) {
        if (shouldStopBulk.current) {
          toast({ title: "Website search stopped", description: `Found ${foundCount} websites, ${notFoundCount} not found` });
          break;
        }
        
        const company = batch[j];
        flushSync(() => {
          setBulkProgress(prev => ({
            ...prev,
            current: company.name,
            batchCurrent: j + 1,
          }));
        });
        
        try {
          // Use dedicated find-company-website function with HTTP validation
          const result = await findWebsite.mutateAsync(company.name);
          
          // Only save if website was found and validated
          if (result.success && result.website) {
            await updateCompany.mutateAsync({
              id: company.id,
              data: { website: result.website },
            });
            foundCount++;
            console.log(`Found website for ${company.name}: ${result.website} (source: ${result.source})`);
          } else {
            notFoundCount++;
            console.log(`No website found for ${company.name}: ${result.error || 'unknown'}`);
          }
        } catch (error) {
          console.error(`Failed to find website for ${company.name}:`, error);
          notFoundCount++;
        }
        
        flushSync(() => {
          setBulkProgress(prev => ({ 
            ...prev, 
            completed: prev.completed + 1,
            fieldsUpdated: foundCount,
          }));
        });
        
        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      queryClient.invalidateQueries({ queryKey: ["companies-admin"] });
      batchNumber++;
      
      if (!shouldStopBulk.current && i + BATCH_SIZE < companiesWithoutWebsite.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ["companies-admin"] });
    setIsFindingWebsites(false);
    
    if (!shouldStopBulk.current) {
      toast({ 
        title: "Website search complete", 
        description: `Found ${foundCount} websites, ${notFoundCount} could not be determined` 
      });
    }
  };

  const filteredCompanies = companies?.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = regionFilter === "all" || company.region_id === regionFilter;
    const matchesRole = roleFilter === "all" || company.industry_role === roleFilter;
    
    const descLength = company.description?.length || 0;
    let matchesDesc = true;
    if (descFilter === "missing") matchesDesc = descLength === 0;
    else if (descFilter === "short") matchesDesc = descLength > 0 && descLength < 400;
    else if (descFilter === "good") matchesDesc = descLength >= 400;
    
    // Enrich filter
    let matchesEnrich = true;
    if (enrichFilter === "incomplete") {
      matchesEnrich = !company.description || !company.website || !company.industry_role || !company.region_id;
    } else if (enrichFilter === "complete") {
      matchesEnrich = !!(company.description && company.website && company.industry_role && company.region_id);
    }
    
    // Website filter
    let matchesWebsite = true;
    if (websiteFilter === "missing") matchesWebsite = !company.website;
    else if (websiteFilter === "has") matchesWebsite = !!company.website;
    
    return matchesSearch && matchesRegion && matchesRole && matchesDesc && matchesEnrich && matchesWebsite;
  });

  const getDescriptionStatus = (description: string | null) => {
    const length = description?.length || 0;
    if (length === 0) return { label: "Missing", variant: "destructive" as const, icon: AlertCircle };
    if (length < 400) return { label: `${length} chars`, variant: "secondary" as const, icon: AlertCircle };
    return { label: `${length} chars`, variant: "default" as const, icon: CheckCircle2 };
  };

  const getCompletenessScore = (company: Company) => {
    let score = 0;
    if (company.description) score++;
    if (company.website) score++;
    if (company.industry_role) score++;
    if (company.region_id) score++;
    return score;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Company Directory</h1>
            <p className="text-muted-foreground">
              Manage company profiles and descriptions
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(isBulkGenerating || isBulkEnriching || isFindingWebsites || isFindingCompanies) ? (
              <div className="flex items-center gap-2">
                {isFindingCompanies ? (
                  <Button
                    variant="outline"
                    disabled
                    className="min-w-[320px] bg-green-500/20 text-green-500 border-green-500/30"
                  >
                    <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                    <span>Scraping ADIPEC exhibitors...</span>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      disabled
                      className={`min-w-[320px] ${
                        isFindingWebsites 
                          ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
                          : isBulkEnriching 
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-accent/20 text-accent border-accent/30"
                      }`}
                    >
                      <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                      <span className="truncate max-w-[140px] inline-block">
                        {bulkProgress.current || "Starting..."}
                      </span>
                      <span className="ml-2 text-xs opacity-80 flex-shrink-0">
                        ({bulkProgress.batchCurrent}/{BATCH_SIZE} • Batch {bulkProgress.currentBatch}/{bulkProgress.totalBatches})
                      </span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleStopBulk}
                      aria-label="Stop bulk operation"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <>
                {junkCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowCleanupDialog(true)}
                    className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cleanup Junk ({junkCount})
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleFindCompanies}
                  className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/30"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Find Companies
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBulkFindWebsites}
                  disabled={missingWebsite === 0}
                  className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 border-blue-500/30"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Find Missing Websites ({missingWebsite})
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBulkEnrich}
                  disabled={incompleteCount === 0}
                  className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/30"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Bulk Enrich 10 at a time ({incompleteCount})
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBulkGenerate}
                  disabled={missingCount === 0}
                  className="bg-accent/20 text-accent hover:bg-accent/30 border-accent/30"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Descriptions ({missingCount})
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/admin/company-audit">
                    Quality Audit
                  </Link>
                </Button>
              </>
            )}
            <Button asChild>
              <Link to="/admin/companies/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Link>
            </Button>
          </div>
        </div>

        {/* Bulk Progress Panel */}
        {(isBulkGenerating || isBulkEnriching || isFindingWebsites) && (
          <div className={`bg-card border rounded-lg p-4 ${
            isFindingWebsites 
              ? 'border-blue-500/30' 
              : isBulkEnriching 
                ? 'border-primary/30' 
                : 'border-accent/30'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isFindingWebsites 
                    ? 'bg-blue-500/20' 
                    : isBulkEnriching 
                      ? 'bg-primary/20' 
                      : 'bg-accent/20'
                }`}>
                  <Loader2 className={`h-5 w-5 animate-spin ${
                    isFindingWebsites 
                      ? 'text-blue-500' 
                      : isBulkEnriching 
                        ? 'text-primary' 
                        : 'text-accent'
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {isFindingWebsites ? 'Finding Website' : isBulkEnriching ? 'Enriching' : 'Generating'}: <span className={
                      isFindingWebsites 
                        ? 'text-blue-500' 
                        : isBulkEnriching 
                          ? 'text-primary' 
                          : 'text-accent'
                    }>{bulkProgress.current}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Batch {bulkProgress.currentBatch} of {bulkProgress.totalBatches} • 
                    Item {bulkProgress.batchCurrent} of {Math.min(BATCH_SIZE, bulkProgress.total - (bulkProgress.currentBatch - 1) * BATCH_SIZE)}
                    {(isBulkEnriching || isFindingWebsites) && bulkProgress.fieldsUpdated > 0 && (
                      <span className="ml-2">• {bulkProgress.fieldsUpdated} {isFindingWebsites ? 'websites found' : 'fields updated'}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${
                  isFindingWebsites 
                    ? 'text-blue-500' 
                    : isBulkEnriching 
                      ? 'text-primary' 
                      : 'text-accent'
                }`}>
                  {bulkProgress.completed} / {bulkProgress.total}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bulkProgress.total > 0 ? Math.round((bulkProgress.completed / bulkProgress.total) * 100) : 0}% complete
                </p>
              </div>
            </div>
            <Progress 
              value={bulkProgress.total > 0 ? (bulkProgress.completed / bulkProgress.total) * 100 : 0} 
              className="h-2"
            />
          </div>
        )}

        {/* Stats */}
        {companies && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{companies.length}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> No Description
              </p>
              <p className="text-2xl font-bold text-destructive">{missingCount}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3" /> No Website
              </p>
              <p className="text-2xl font-bold text-yellow-500">{missingWebsite}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> No Role
              </p>
              <p className="text-2xl font-bold text-yellow-500">{missingRole}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> No Region
              </p>
              <p className="text-2xl font-bold text-yellow-500">{missingRegion}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Complete
              </p>
              <p className="text-2xl font-bold text-green-500">
                {companies.filter(c => c.description && c.website && c.industry_role && c.region_id).length}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions?.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {INDUSTRY_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={descFilter} onValueChange={setDescFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Description" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Descriptions</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
              <SelectItem value="short">Short (&lt;400)</SelectItem>
              <SelectItem value="good">Good (400+)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={enrichFilter} onValueChange={setEnrichFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Completeness" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Profiles</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>

          <Select value={websiteFilter} onValueChange={setWebsiteFilter}>
            <SelectTrigger className="w-[160px]">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Website" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Websites</SelectItem>
              <SelectItem value="missing">No Website</SelectItem>
              <SelectItem value="has">Has Website</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry Role</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : filteredCompanies?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No companies found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies?.map((company) => {
                  const descStatus = getDescriptionStatus(company.description);
                  return (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            {company.logo_url ? (
                              <img 
                                src={company.logo_url} 
                                alt={company.name}
                                className="h-8 w-8 object-contain"
                              />
                            ) : (
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{company.name}</p>
                            {company.website && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {company.website}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.industry_role ? (
                          <Badge variant="outline" className="capitalize">
                            {company.industry_role}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.regions?.name || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={descStatus.variant} className="gap-1">
                            <descStatus.icon className="h-3 w-3" />
                            {descStatus.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 text-xs ${
                              company.description && company.description.length > 0
                                ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                : "bg-accent/20 text-accent hover:bg-accent/30"
                            }`}
                            onClick={() => handleQuickGenerate(company)}
                            disabled={generatingIds.has(company.id) || isBulkGenerating}
                          >
                            {completedIds.has(company.id) ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : generatingIds.has(company.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : company.description && company.description.length > 0 ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                GD
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 mr-1" />
                                GD
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs bg-primary/20 text-primary hover:bg-primary/30"
                            onClick={() => handleEnrich(company)}
                            disabled={enrichingIds.has(company.id) || isBulkEnriching || isBulkGenerating}
                            aria-label="Enrich company profile"
                          >
                            {enrichingIds.has(company.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="h-3 w-3" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm" asChild aria-label="Edit company">
                            <Link to={`/admin/companies/${company.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {filteredCompanies && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredCompanies.length} of {companies?.length} companies
          </p>
        )}
      </div>

      {/* Cleanup Junk Confirmation Dialog */}
      <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Junk Company Entries?</DialogTitle>
            <DialogDescription>
              This will permanently delete {junkCount} entries that appear to be ADIPEC category tags 
              (names starting with "_" or containing "/_") rather than real companies.
              <br /><br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCleanupDialog(false)} disabled={isCleaningUp}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCleanupJunk} disabled={isCleaningUp}>
              {isCleaningUp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {junkCount} Entries
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Companies;
