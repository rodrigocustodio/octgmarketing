import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { useCompanyById, useUpdateCompany, useCreateCompany, useDeleteCompany, useGenerateCompanyDescription } from "@/hooks/useCompanies";
import { useRegions } from "@/hooks/useDirectory";
import { INDUSTRY_ROLES } from "@/hooks/useDirectory";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, Sparkles, Loader2, ExternalLink } from "lucide-react";

type CompanyRole = Database["public"]["Enums"]["company_role"];

const CompanyEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const { data: company, isLoading } = useCompanyById(isNew ? undefined : id);
  const { data: regions } = useRegions();
  const updateCompany = useUpdateCompany();
  const createCompany = useCreateCompany();
  const deleteCompany = useDeleteCompany();
  const generateDescription = useGenerateCompanyDescription();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    website: "",
    country: "",
    headquarters: "",
    industry_role: "" as string,
    region_id: "" as string,
    year_founded: "" as string,
    phone: "",
    email: "",
    description: "",
    notes: "",
    logo_url: "",
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        slug: company.slug || "",
        website: company.website || "",
        country: company.country || "",
        headquarters: company.headquarters || "",
        industry_role: company.industry_role || "",
        region_id: company.region_id || "",
        year_founded: company.year_founded?.toString() || "",
        phone: company.phone || "",
        email: company.email || "",
        description: company.description || "",
        notes: company.notes || "",
        logo_url: company.logo_url || "",
      });
    }
  }, [company]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isNew ? generateSlug(name) : prev.slug,
    }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      toast.error("Please enter a company name first");
      return;
    }

    try {
      const result = await generateDescription.mutateAsync({
        companyName: formData.name,
        website: formData.website || null,
      });

      setFormData((prev) => ({
        ...prev,
        description: result.description,
      }));
      toast.success("Description generated successfully");
    } catch (error) {
      console.error("Failed to generate description:", error);
      toast.error("Failed to generate description");
    }
  };


  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required");
      return;
    }

    try {
      const data = {
        name: formData.name,
        slug: formData.slug,
        website: formData.website || null,
        country: formData.country || null,
        headquarters: formData.headquarters || null,
        industry_role: (formData.industry_role || null) as CompanyRole | null,
        region_id: formData.region_id || null,
        year_founded: formData.year_founded ? parseInt(formData.year_founded) : null,
        phone: formData.phone || null,
        email: formData.email || null,
        description: formData.description || null,
        notes: formData.notes || null,
        logo_url: formData.logo_url || null,
      };

      if (isNew) {
        await createCompany.mutateAsync(data);
        toast.success("Company created successfully");
      } else {
        await updateCompany.mutateAsync({ id: id!, data });
        toast.success("Company updated successfully");
      }
      navigate("/admin/companies");
    } catch (error) {
      console.error("Failed to save company:", error);
      toast.error("Failed to save company");
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;

    try {
      await deleteCompany.mutateAsync(id);
      toast.success("Company deleted successfully");
      navigate("/admin/companies");
    } catch (error) {
      console.error("Failed to delete company:", error);
      toast.error("Failed to delete company");
    }
  };

  if (isLoading && !isNew) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </AdminLayout>
    );
  }

  const descriptionLength = formData.description.length;
  const descriptionTarget = 800;
  const descriptionProgress = Math.min((descriptionLength / descriptionTarget) * 100, 100);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/companies")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isNew ? "Add Company" : `Edit ${company?.name}`}
              </h1>
              <p className="text-muted-foreground">
                {isNew ? "Create a new company profile" : "Update company information"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Company</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this company? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={handleSave} disabled={updateCompany.isPending || createCompany.isPending}>
              {(updateCompany.isPending || createCompany.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="company-slug"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry_role">Industry Role</Label>
                    <Select
                      value={formData.industry_role}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, industry_role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region_id">Region</Label>
                    <Select
                      value={formData.region_id}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, region_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions?.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="flex gap-2">
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                        placeholder="https://example.com"
                      />
                      {formData.website && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={formData.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year_founded">Year Founded</Label>
                    <Input
                      id="year_founded"
                      type="number"
                      value={formData.year_founded}
                      onChange={(e) => setFormData((prev) => ({ ...prev, year_founded: e.target.value }))}
                      placeholder="1990"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="headquarters">Headquarters</Label>
                    <Input
                      id="headquarters"
                      value={formData.headquarters}
                      onChange={(e) => setFormData((prev) => ({ ...prev, headquarters: e.target.value }))}
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Company Description</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={generateDescription.isPending}
                  >
                    {generateDescription.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Description
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter a comprehensive company description (~800 characters recommended)"
                  className="min-h-[200px] resize-none"
                />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          descriptionLength === 0 ? "bg-destructive" :
                          descriptionLength < 400 ? "bg-yellow-500" :
                          descriptionLength >= 750 && descriptionLength <= 850 ? "bg-green-500" :
                          "bg-primary"
                        }`}
                        style={{ width: `${descriptionProgress}%` }}
                      />
                    </div>
                    <span className={`${
                      descriptionLength === 0 ? "text-destructive" :
                      descriptionLength < 400 ? "text-yellow-500" :
                      descriptionLength >= 750 && descriptionLength <= 850 ? "text-green-500" :
                      "text-muted-foreground"
                    }`}>
                      {descriptionLength} / {descriptionTarget} chars
                    </span>
                  </div>
                  {descriptionLength >= 750 && descriptionLength <= 850 && (
                    <span className="text-green-500 text-xs">✓ Perfect length!</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about the company (not displayed publicly)"
                  className="min-h-[120px] resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@company.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Logo */}
            <Card>
              <CardHeader>
                <CardTitle>Logo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                {formData.logo_url && (
                  <div className="p-4 bg-muted rounded-lg flex items-center justify-center">
                    <img
                      src={formData.logo_url}
                      alt="Logo preview"
                      className="max-h-20 max-w-full object-contain"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CompanyEdit;
