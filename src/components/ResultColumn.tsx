import { BuyleadCard } from "./BuyleadCard";
import { FilterBar } from "./FilterBar";
import type { Buylead } from "@/data/mockBuyleads";

interface ResultColumnProps {
  title: string;
  results: Buylead[];
  rankKey: "blRank" | "semanticRank";
}

export function ResultColumn({ title, results, rankKey }: ResultColumnProps) {
  const sorted = [...results].sort((a, b) => {
    const leftRank = a[rankKey] ?? Number.MAX_SAFE_INTEGER;
    const rightRank = b[rankKey] ?? Number.MAX_SAFE_INTEGER;
    return leftRank - rightRank;
  });

  return (
    <div className="flex flex-col">
      <FilterBar columnTitle={title} resultCount={sorted.length} />
      <div className="space-y-2 pb-4">
        {sorted.map((buylead, index) => (
          <BuyleadCard
            key={buylead.id}
            buylead={buylead}
            animationDelay={index * 50}
          />
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No results found
          </div>
        )}
      </div>
    </div>
  );
}
