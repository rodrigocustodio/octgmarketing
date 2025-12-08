import { useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { useExecutives, useDeleteExecutive } from "@/hooks/useExecutives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, User } from "lucide-react";
import { toast } from "sonner";

const REGIONS = ["all", "Americas", "Europe", "Asia-Pacific", "Australia"];

const regionColors: Record<string, string> = {
  Americas: "bg-blue-500/20 text-blue-400",
  Europe: "bg-emerald-500/20 text-emerald-400",
  "Asia-Pacific": "bg-amber-500/20 text-amber-400",
  Australia: "bg-purple-500/20 text-purple-400",
};

export default function Executives() {
  const { data: executives, isLoading } = useExecutives();
  const deleteExecutive = useDeleteExecutive();

  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredExecutives = executives?.filter((exec) => {
    const matchesSearch =
      exec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exec.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === "all" || exec.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteExecutive.mutateAsync(deleteId);
      toast.success("Executive deleted successfully");
      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to delete executive");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">CEO Directory</h1>
            <p className="text-muted-foreground">
              Manage executive profiles and biographies
            </p>
          </div>
          <Link to="/admin/executives/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Executive
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by region" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((region) => (
                <SelectItem key={region} value={region}>
                  {region === "all" ? "All Regions" : region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            Showing {filteredExecutives?.length || 0} of {executives?.length || 0}{" "}
            executives
          </span>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading executives...
                  </TableCell>
                </TableRow>
              ) : filteredExecutives?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No executives found
                  </TableCell>
                </TableRow>
              ) : (
                filteredExecutives?.map((exec) => (
                  <TableRow key={exec.id}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                        {exec.photo_url ? (
                          <img
                            src={exec.photo_url}
                            alt={exec.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{exec.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {exec.title}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{exec.company_name}</div>
                        {exec.stock_symbol && (
                          <div className="text-xs font-mono text-accent">
                            {exec.stock_symbol}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={regionColors[exec.region] || ""}
                      >
                        {exec.region}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link to={`/admin/executives/${exec.id}`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(exec.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Executive</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this executive? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
