import { Clock, MapPin, ChevronRight, Package, IndianRupee, AlertCircle } from "lucide-react";
import type { Buylead } from "@/data/mockBuyleads";

interface BuyleadCardProps {
  buylead: Buylead;
  animationDelay?: number;
}

export function BuyleadCard({ buylead, animationDelay = 0 }: BuyleadCardProps) {
  const renderRank = (label: string, rank: number | null, rankClassName: string) => {
    if (rank === null) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground border border-dashed border-border">
          <AlertCircle className="w-3 h-3" />
          {label} missing
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${rankClassName}`}>
        #{rank}
      </span>
    );
  };

  return (
    <div
      className="bg-card rounded-md shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-150 border border-border overflow-hidden animate-fade-in flex flex-col"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="px-3 py-2.5 flex-1 flex flex-col gap-1.5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-[13px] leading-snug line-clamp-1 flex-1">
            {buylead.title}
          </h3>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
            <Clock className="w-3 h-3" />
            {buylead.timeBucket ?? buylead.timeAgo}
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
            Display ID: {buylead.displayId}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
            Slab: {buylead.mcatConf ?? "—"}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
            Slab id: {buylead.slabId ?? "—"}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
            {buylead.timeBucket ?? buylead.timeAgo ?? "—"}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
            Within DLP
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
            {buylead.retailType}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground ml-auto">
            <MapPin className="w-3 h-3" />
            {buylead.countryCode ? (
              <img
                src={`https://flagcdn.com/16x12/${buylead.countryCode.toLowerCase()}.png`}
                alt={buylead.countryCode}
                className="w-3.5 h-2.5 object-cover rounded-sm"
              />
            ) : null}
            <span className="truncate max-w-[100px]">{buylead.location}</span>
          </span>
        </div>

        {/* Category */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className="text-primary font-medium">{buylead.category}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="truncate">{buylead.subcategory}</span>
        </div>

        {/* Requirements */}
        <p className="text-[12px] text-secondary-foreground line-clamp-2 leading-snug">
          {buylead.requirements ?? ""}
        </p>

        {/* Grid: qty / attr / value */}
        <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-border/60">
          <div className="flex items-center gap-1 min-w-0">
            <Package className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Qty:</span>
            <span className="font-medium text-foreground truncate">{buylead.quantity ?? "—"}</span>
          </div>
          {buylead.attributes.slice(0, 1).map((attr, index) => (
            <div key={index} className="flex items-center gap-1 min-w-0">
              <span className="text-muted-foreground truncate">{attr.label}:</span>
              <span className="font-medium text-foreground truncate">{attr.value}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 min-w-0 justify-end">
            <IndianRupee className="w-3 h-3 text-accent flex-shrink-0" />
            <span className="font-semibold text-foreground truncate">{buylead.orderValueRange ?? "—"}</span>
          </div>
        </div>
      </div>

      {/* Comparison footer */}
      <div className="bg-comparison-bar px-3 py-1.5 border-t border-border flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">BL:</span>
          {renderRank("BL", buylead.blRank, "bg-bl-rank-bg text-bl-rank-text")}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">New:</span>
          {renderRank("New", buylead.semanticRank, "bg-semantic-rank-bg text-semantic-rank-text")}
        </div>
      </div>
    </div>
  );
}
