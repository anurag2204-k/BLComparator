interface FilterBarProps {
  columnTitle: string;
  resultCount: number;
}

export function FilterBar({ columnTitle, resultCount }: FilterBarProps) {
  return (
    <div className="bg-card/95 backdrop-blur border-b border-border px-4 py-2.5 mb-3 rounded-md shadow-sm flex items-center justify-between">
      <h2 className="font-semibold text-foreground text-sm">{columnTitle}</h2>
      <span className="text-xs text-muted-foreground">Total Results: <span className="font-medium text-foreground">{resultCount}</span></span>
    </div>
  );
}
