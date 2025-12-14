import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, Plus, Building2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
}

interface CompanyTagSelectorProps {
  companies: Company[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxCompanies?: number;
}

export function CompanyTagSelector({
  companies,
  selectedIds,
  onChange,
  maxCompanies = 15,
}: CompanyTagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedCompanies = useMemo(() => {
    return companies.filter((c) => selectedIds.includes(c.id));
  }, [companies, selectedIds]);

  const availableCompanies = useMemo(() => {
    return companies
      .filter((c) => !selectedIds.includes(c.id))
      .filter((c) =>
        c.name.toLowerCase().includes(searchValue.toLowerCase())
      )
      .slice(0, 20);
  }, [companies, selectedIds, searchValue]);

  const handleRemove = (companyId: string) => {
    onChange(selectedIds.filter((id) => id !== companyId));
  };

  const handleAdd = (companyId: string) => {
    if (selectedIds.length >= maxCompanies) {
      return;
    }
    onChange([...selectedIds, companyId]);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <div className="space-y-3">
      {/* Selected companies as tags */}
      <div className="flex flex-wrap gap-2">
        {selectedCompanies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No companies linked</p>
        ) : (
          selectedCompanies.map((company) => (
            <Badge
              key={company.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="max-w-[150px] truncate">{company.name}</span>
              <button
                onClick={() => handleRemove(company.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-background/20"
                aria-label={`Remove ${company.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Add company popover */}
      {selectedIds.length < maxCompanies && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-muted-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add company...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[280px]" align="start">
            <Command>
              <CommandInput
                placeholder="Search companies..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>No companies found</CommandEmpty>
                <CommandGroup>
                  {availableCompanies.map((company) => (
                    <CommandItem
                      key={company.id}
                      value={company.name}
                      onSelect={() => handleAdd(company.id)}
                      className="flex items-center gap-2"
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{company.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* Count indicator */}
      <p className="text-xs text-muted-foreground">
        {selectedIds.length} / {maxCompanies} companies
      </p>
    </div>
  );
}
