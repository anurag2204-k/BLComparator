import { Clock, MapPin, ChevronRight, Package, IndianRupee, AlertCircle } from "lucide-react";
import type { Buylead, SellerInfo } from "@/data/mockBuyleads";
import type { CityLocation } from "@/pages/Index";

interface BuyleadCardProps {
  buylead: Buylead;
  animationDelay?: number;
  sellerInfo: SellerInfo | null;
  mcatRankMap: Map<string, string>;
  cityMap: Map<string, CityLocation>;
}

const COUNTRY_DEFAULTS: Record<string, { lat: number; lon: number }> = {
  "india": { lat: 28.704059, lon: 77.102490 }, // Delhi
  "in": { lat: 28.704059, lon: 77.102490 },
  "united states of america": { lat: 38.907192, lon: -77.036871 }, // Washington DC
  "us": { lat: 38.907192, lon: -77.036871 },
  "united states": { lat: 38.907192, lon: -77.036871 },
  "default": { lat: 28.704059, lon: 77.102490 } // Default to India
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getCoordinates(
  latlonStr: string | null,
  cityName: string | null,
  countryCode: string | null,
  cityMap: Map<string, CityLocation>
): { lat: number; lon: number } | null {
  if (latlonStr) {
    const parts = latlonStr.split(",");
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }
  }

  if (cityName) {
    const loc = cityMap.get(cityName.toLowerCase());
    if (loc) {
      return { lat: loc.lat, lon: loc.lon };
    }
  }

  if (countryCode) {
    const code = countryCode.toLowerCase();
    if (COUNTRY_DEFAULTS[code]) {
      return COUNTRY_DEFAULTS[code];
    }
  }

  return null;
}

export function BuyleadCard({
  buylead,
  animationDelay = 0,
  sellerInfo,
  mcatRankMap,
  cityMap,
}: BuyleadCardProps) {
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

  const sellerLoc = sellerInfo?.homecity
    ? cityMap.get(sellerInfo.homecity.toLowerCase())
    : null;

  const sellerCoords = sellerLoc
    ? { lat: sellerLoc.lat, lon: sellerLoc.lon }
    : sellerInfo?.country
      ? COUNTRY_DEFAULTS[sellerInfo.country.toLowerCase()] ?? COUNTRY_DEFAULTS["default"]
      : COUNTRY_DEFAULTS["default"];

  const leadCoords = getCoordinates(
    buylead.latlon,
    buylead.location,
    buylead.countryCode,
    cityMap
  );

  let distance: number | null = null;
  if (sellerCoords && leadCoords) {
    distance = calculateDistanceKm(
      sellerCoords.lat,
      sellerCoords.lon,
      leadCoords.lat,
      leadCoords.lon
    );
  }

  const isLeadInIndia =
    buylead.countryCode?.toUpperCase() === "IN" ||
    buylead.countryCode?.toLowerCase() === "india" ||
    (buylead.location && cityMap.get(buylead.location.toLowerCase())?.country.toLowerCase() === "india");

  let withinDlp = true;
  let dlpStatusText = "Within DLP";

  if (sellerInfo?.dlp) {
    const dlpVal = sellerInfo.dlp;
    if (dlpVal === "1") {
      withinDlp = true;
      dlpStatusText = "Within DLP (Global)";
    } else if (dlpVal === "2") {
      withinDlp = isLeadInIndia;
      dlpStatusText = withinDlp ? "Within DLP (All India)" : "Outside DLP (Foreign)";
    } else if (dlpVal === "3") {
      withinDlp = !isLeadInIndia;
      dlpStatusText = withinDlp ? "Within DLP (Foreign)" : "Outside DLP (India)";
    } else if (dlpVal === "4") {
      if (distance !== null) {
        withinDlp = distance <= 250;
        dlpStatusText = withinDlp
          ? `Within DLP (${Math.round(distance)} km)`
          : `Outside DLP (${Math.round(distance)} km)`;
      } else {
        withinDlp = true;
        dlpStatusText = "Within DLP (Local)";
      }
    } else if (dlpVal === "9") {
      if (distance !== null) {
        withinDlp = distance <= 50;
        dlpStatusText = withinDlp
          ? `Within DLP (${Math.round(distance)} km)`
          : `Outside DLP (${Math.round(distance)} km)`;
      } else {
        withinDlp = true;
        dlpStatusText = "Within DLP (Hyperlocal)";
      }
    }
  }

  let mcatRank: string | null = null;
  if (buylead.mcatIds && mcatRankMap) {
    for (const mcatId of buylead.mcatIds) {
      if (mcatRankMap.has(mcatId)) {
        mcatRank = mcatRankMap.get(mcatId) || null;
        break;
      }
    }
  }

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
            {buylead.timeAgo ?? buylead.timeBucket ?? "—"}
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
            Display ID: {buylead.displayId}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
            Conf: {buylead.mcatConf ?? "—"}
          </span>
          {buylead.gridParamater ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
              Grid Paramater: {buylead.gridParamater ?? "—"}
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
              Salb No.: {buylead.slab ?? "—"}
            </span>
          )}
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
            {buylead.timeBucket ?? buylead.timeAgo ?? "—"}
          </span>
          {withinDlp ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted border border-border dark:bg-muted/30 dark:text-muted dark:border-border">
              {dlpStatusText}
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted border border-border dark:bg-muted/30 dark:text-muted dark:border-border">
              {dlpStatusText}
            </span>
          )}
          {mcatRank ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted border border-border dark:bg-muted/30 dark:text-muted dark:border-border">
              MCAT Rank: {mcatRank}
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted border border-border dark:bg-muted/30 dark:text-muted dark:border-border">
              MCAT Rank: NE
            </span>
          )}
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted border border-border">
            {buylead.retailType}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted border border-border">
            {buylead.datatype}
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
