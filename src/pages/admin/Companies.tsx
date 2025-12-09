import { useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { useCompaniesAdmin, useGenerateCompanyDescription, useUpdateCompany, Company } from "@/hooks/useCompanies";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Building2, Edit, AlertCircle, CheckCircle2, Sparkles, Loader2, Check } from "lucide-react";
import { INDUSTRY_ROLES } from "@/hooks/useDirectory";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const Companies = () => {
  const { data: companies, isLoading } = useCompaniesAdmin();
  const { data: regions } = useRegions();
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [descFilter, setDescFilter] = useState<string>("all");
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  
  const generateDescription = useGenerateCompanyDescription();
  const updateCompany = useUpdateCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const filteredCompanies = companies?.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = regionFilter === "all" || company.region_id === regionFilter;
    const matchesRole = roleFilter === "all" || company.industry_role === roleFilter;
    
    const descLength = company.description?.length || 0;
    let matchesDesc = true;
    if (descFilter === "missing") matchesDesc = descLength === 0;
    else if (descFilter === "short") matchesDesc = descLength > 0 && descLength < 400;
    else if (descFilter === "good") matchesDesc = descLength >= 400;
    
    return matchesSearch && matchesRegion && matchesRole && matchesDesc;
  });

  const getDescriptionStatus = (description: string | null) => {
    const length = description?.length || 0;
    if (length === 0) return { label: "Missing", variant: "destructive" as const, icon: AlertCircle };
    if (length < 400) return { label: `${length} chars`, variant: "secondary" as const, icon: AlertCircle };
    return { label: `${length} chars`, variant: "default" as const, icon: CheckCircle2 };
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
          <Button asChild>
            <Link to="/admin/companies/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Link>
          </Button>
        </div>

        {/* Stats */}
        {companies && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total Companies</p>
              <p className="text-2xl font-bold">{companies.length}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Missing Description</p>
              <p className="text-2xl font-bold text-destructive">
                {companies.filter(c => !c.description || c.description.length === 0).length}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Short (&lt;400 chars)</p>
              <p className="text-2xl font-bold text-yellow-500">
                {companies.filter(c => c.description && c.description.length > 0 && c.description.length < 400).length}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Good (400+ chars)</p>
              <p className="text-2xl font-bold text-green-500">
                {companies.filter(c => c.description && c.description.length >= 400).length}
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
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Description Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
              <SelectItem value="short">Short (&lt;400)</SelectItem>
              <SelectItem value="good">Good (400+)</SelectItem>
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
                            className="h-7 px-2 text-xs bg-accent/20 text-accent hover:bg-accent/30"
                            onClick={() => handleQuickGenerate(company)}
                            disabled={generatingIds.has(company.id)}
                          >
                            {completedIds.has(company.id) ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : generatingIds.has(company.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
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
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/companies/${company.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
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
    </AdminLayout>
  );
};

export default Companies;
