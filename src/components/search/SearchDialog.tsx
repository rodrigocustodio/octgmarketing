import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSearchData, filterSearchResults, SearchResult } from "@/hooks/useSearch";
import { FileText, Building2, User, Tag, MapPin, Loader2 } from "lucide-react";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons = {
  article: FileText,
  company: Building2,
  executive: User,
  topic: Tag,
  region: MapPin,
};

const typeLabels = {
  article: "Articles",
  company: "Companies",
  executive: "Executives",
  topic: "Topics",
  region: "Regions",
};

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { searchIndex, isLoading } = useSearchData();

  const results = useMemo(
    () => filterSearchResults(searchIndex, query),
    [searchIndex, query]
  );

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((result) => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });
    return groups;
  }, [results]);

  const handleSelect = (url: string) => {
    onOpenChange(false);
    setQuery("");
    navigate(url);
  };

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search articles, companies, executives..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : query.trim() === "" ? (
          <CommandEmpty>Type to search...</CommandEmpty>
        ) : results.length === 0 ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          Object.entries(groupedResults).map(([type, items]) => {
            const Icon = typeIcons[type as keyof typeof typeIcons];
            const label = typeLabels[type as keyof typeof typeLabels];
            
            return (
              <CommandGroup key={type} heading={label}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.subtitle || ""}`}
                    onSelect={() => handleSelect(item.url)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate font-medium">{item.title}</span>
                      {item.subtitle && (
                        <span className="truncate text-xs text-muted-foreground">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })
        )}
      </CommandList>
    </CommandDialog>
  );
}
