import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  glid: string;
  onGlidChange: (value: string) => void;
  onSearch: () => void;
}

export function SearchHeader({ searchQuery, onSearchChange, glid, onGlidChange, onSearch }: SearchHeaderProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-md">
      <div className="px-6 py-3">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 flex-wrap md:flex-nowrap"
        >
          <h1 className="text-base md:text-lg font-semibold text-primary-foreground whitespace-nowrap mr-2">
            Buylead Search Comparator
          </h1>
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search term e.g. 43 inch 4K TV"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 text-sm bg-card border-0 rounded-md shadow-sm focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
          <Input
            type="text"
            placeholder="GLID"
            value={glid}
            onChange={(e) => onGlidChange(e.target.value)}
            className="h-9 w-40 text-sm bg-card border-0 rounded-md shadow-sm focus-visible:ring-2 focus-visible:ring-accent"
          />
          <Button
            type="submit"
            className="h-9 px-5 bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-semibold rounded-md shadow-sm"
          >
            Search
          </Button>
        </form>
      </div>
    </header>
  );
}
