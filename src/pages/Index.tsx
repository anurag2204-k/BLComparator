import { useEffect, useState, useRef } from "react";
import { SearchHeader } from "@/components/SearchHeader";
import { ResultColumn } from "@/components/ResultColumn";
import { fetchBuyleadComparison, fetchSellerInfo, fetchRelatedInfo, type Buylead, type FetchLogEntry, type SellerInfo } from "@/data/mockBuyleads";
import { Helmet } from "react-helmet-async";
import { ChevronDown, Clock3, Search } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {HoverCard,HoverCardContent,HoverCardTrigger} from "@/components/ui/hover-card";

const CURRENT_BUYLEAD_URL = import.meta.env.VITE_CURRENT_BUYLEAD_URL ?? "/mock-current-buyleads.json";
const NEW_BUYLEAD_URL = import.meta.env.VITE_NEW_BUYLEAD_URL ?? "/mock-new-buyleads.json";

function buildSearchUrl(url: string, query: string, glidValue: string) {
  const nextUrl = new URL(url, window.location.origin);
  nextUrl.searchParams.set("q", query);

  if (nextUrl.searchParams.has("options.filters.glusrid.data")) {
    nextUrl.searchParams.set("options.filters.glusrid.data", `-${glidValue.replace(/^[-\s]+/, "")}`);
  }

  return nextUrl.toString();
}

const DLP_MAP: Record<string, string> = {
  "1": "Global",
  "2": "All India",
  "3": "Foreign Only",
  "4": "Local",
  "9": "Hyperlocal",
};

export interface CityLocation {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [glid, setGlid] = useState("");
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [queryPmcatId, setQueryPmcatId] = useState<string | null>(null);
  const [cityMap, setCityMap] = useState<Map<string, CityLocation>>(new Map());
  const loadedGlidRef = useRef<string>("");

  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await fetch("/city.csv");
        if (!response.ok) {
          throw new Error("Failed to load cities list");
        }
        const text = await response.text();
        
        const map = new Map<string, CityLocation>();
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const cols: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cols.push(current);
              current = "";
            } else {
              current += char;
            }
          }
          cols.push(current);

          if (cols.length >= 7) {
            const name = cols[0].trim();
            const country = cols[4].trim();
            const lat = parseFloat(cols[5]);
            const lon = parseFloat(cols[6]);
            if (name && !isNaN(lat) && !isNaN(lon)) {
              map.set(name.toLowerCase(), { name, country, lat, lon });
            }
          }
        }
        setCityMap(map);
      } catch (err) {
        console.error("Failed to parse city CSV data:", err);
      }
    };
    void loadCities();
  }, []);
  const [hasSearched, setHasSearched] = useState(true);
  const [shownQuery, setShownQuery] = useState("");
  const [shownGlid, setShownGlid] = useState("");
  const [searchNonce, setSearchNonce] = useState(0);
  const [activeQuery, setActiveQuery] = useState("");
  const [activeGlid, setActiveGlid] = useState("");
  const [comparison, setComparison] = useState<{ blSearch: Buylead[]; semanticSearch: Buylead[] }>({
    blSearch: [],
    semanticSearch: [],
  });
  const [resultSummary, setResultSummary] = useState({
    currentTotalResults: null as number | null,
    newTotalResults: null as number | null,
    currentFetchedCount: 0,
    newFetchedCount: 0,
  });
  const [fetchLogs, setFetchLogs] = useState<FetchLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSearched) {
      return;
    }

    let isActive = true;

    const loadComparison = async () => {
      setIsLoading(true);
      setError(null);

      // Reset search-specific results
      setComparison({ blSearch: [], semanticSearch: [] });
      setFetchLogs([]);
      setResultSummary({
        currentTotalResults: null,
        newTotalResults: null,
        currentFetchedCount: 0,
        newFetchedCount: 0,
      });
      setQueryPmcatId(null);

      const isNewSeller = activeGlid !== loadedGlidRef.current;
      if (isNewSeller) {
        setSellerLoading(true);
        setSellerInfo(null);
      }

      try {
        let currentSellerInfo: SellerInfo | null = null;
        try {
          currentSellerInfo = await fetchSellerInfo(activeGlid);
          if (isActive) {
            setSellerInfo(currentSellerInfo);
            loadedGlidRef.current = activeGlid;
          }
        } catch (sellerError) {
          console.error("Failed to load seller details:", sellerError);
        } finally {
          if (isActive && isNewSeller) {
            setSellerLoading(false);
          }
        }

        let resolvedPmcatId: string | null = null;
        try {
          resolvedPmcatId = await fetchRelatedInfo(activeQuery);
          console.log("resolvedPmcatId from inside fetchRelatedInfo", resolvedPmcatId);
        } catch (relatedError) {
          console.error("Failed to load related info:", relatedError);
        }

        if (isActive) {
          setQueryPmcatId(resolvedPmcatId);
        }

        const currentUrl = buildSearchUrl(CURRENT_BUYLEAD_URL, activeQuery, activeGlid);
        const newUrl = buildSearchUrl(NEW_BUYLEAD_URL, activeQuery, activeGlid);
        const nextComparison = await fetchBuyleadComparison(currentUrl, newUrl);
        if (isActive) {
          setComparison(nextComparison);
          setFetchLogs(nextComparison.fetchLogs);
          setResultSummary({
            currentTotalResults: nextComparison.currentTotalResults,
            newTotalResults: nextComparison.newTotalResults,
            currentFetchedCount: nextComparison.currentFetchedCount,
            newFetchedCount: nextComparison.newFetchedCount,
          });
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load buylead results.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadComparison();

    return () => {
      isActive = false;
    };
  }, [activeGlid, activeQuery, hasSearched, searchNonce]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const nextQuery = searchQuery.trim();
      const nextGlid = glid.trim();
      setHasSearched(true);
      setShownQuery(nextQuery);
      setShownGlid(nextGlid);
      setActiveQuery(nextQuery);
      setActiveGlid(nextGlid);
      setSearchNonce((value) => value + 1);
    }
  };

  const mcatRankMap = new Map<string, string>();
  if (sellerInfo?.mcats) {
    sellerInfo.mcats.forEach((mcatStr) => {
      const match = mcatStr.match(/^(\d+)([a-zA-Z]+)$/);
      if (match) {
        mcatRankMap.set(match[1], match[2]);
      }
    });
  }

  return (
    <>
      <Helmet>
        <title>Buylead Search Comparator | Compare BL vs Semantic Search</title>
        <meta
          name="description"
          content="Compare current Buylead Search results with Semantic Search side by side. Analyze ranking differences and find the best search model for your B2B marketplace."
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          glid={glid}
          onGlidChange={setGlid}
          onSearch={handleSearch}
        />

        {/* Seller Details */}
        <section className="border-b border-border bg-card/60">
          <div className="px-4 py-2 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-foreground mr-1">Seller Details:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
              GLID: {shownGlid}
            </span>
            {sellerLoading ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-muted text-muted-foreground border border-border animate-pulse">
                DLP: Loading...
              </span>
            ) : sellerInfo?.dlp ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
                DLP : {DLP_MAP[sellerInfo.dlp] ?? "Unknown"} : {sellerInfo.dlp}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-muted text-muted-foreground border border-border border-dashed">
                DLP: —
              </span>
            )}
            {sellerLoading ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-muted text-muted-foreground border border-border animate-pulse">
                Retailer: Loading...
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
                {sellerInfo?.non_retailer != null
                ? ([1, 3, 5, 6].includes(Number(sellerInfo.non_retailer))
                    ? "Retailer"
                    : "Non Retailer")
                : "Retailer: —"}
              </span>
            )}
            {sellerLoading ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-muted text-muted-foreground border border-border animate-pulse">
                Home City: Loading...
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-muted text-foreground border border-border">
                Home City: {sellerInfo?.homecity ?? "—"}
              </span>
            )}
            {sellerLoading ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-muted text-muted-foreground border border-border animate-pulse">
                MCATs: Loading...
              </span>
            ) : (
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-muted text-foreground border border-border cursor-help"
                title={sellerInfo?.mcats && sellerInfo.mcats.length > 0 ? sellerInfo.mcats.join(", ") : "No MCATs"}
              >
                MCATs: {sellerInfo?.mcats?.length ?? 0}
              </span>
            )}
            {sellerLoading ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-muted text-muted-foreground border border-border animate-pulse">
                Cities: Loading...
              </span>
            ) : (
              <HoverCard openDelay={100}>
                <HoverCardTrigger asChild>
                  <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-muted text-foreground border border-border cursor-pointer">
                    Cities: {sellerInfo?.cities?.length ?? 0}
                  </span>
                </HoverCardTrigger>

                <HoverCardContent align="start" side="bottom" className="w-80 shadow-lg">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold">
                        Available Cities ({sellerInfo?.cities?.length ?? 0})
                      </h4>
                    </div>

                    {sellerInfo?.cities?.length ? (
                      <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
                        {sellerInfo.cities.map((city) => (
                          <span
                            key={city}
                            className="rounded-full border px-3 py-1 text-xs font-medium bg-muted"
                          >
                            {city}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No cities available
                      </p>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
        </section>

        <main className="flex-1 w-full px-4 py-4">
          {hasSearched ? (
            <div className="space-y-3">
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">Current BL summary</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">
                      Total found: <span className="ml-1 font-semibold text-foreground">{resultSummary.currentTotalResults ?? 0}</span>
                    </span>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">
                      Fetched: <span className="ml-1 font-semibold text-foreground">{resultSummary.currentFetchedCount}</span>
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">New BL summary</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">
                      Total found: <span className="ml-1 font-semibold text-foreground">{resultSummary.newTotalResults ?? 0}</span>
                    </span>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">
                      Fetched: <span className="ml-1 font-semibold text-foreground">{resultSummary.newFetchedCount}</span>
                    </span>
                  </div>
                </div>
              </div>

              <Collapsible className="rounded-lg border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Fetch history</p>
                    <p className="text-xs text-muted-foreground">All paginated requests made for the current comparison</p>
                  </div>
                  <CollapsibleTrigger asChild>
                    <button className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/80">
                      <Search className="h-3.5 w-3.5" />
                      View fetches
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="border-t border-border px-4 py-3">
                  <div className="grid gap-3 lg:grid-cols-2">
                    {(["Current BL", "New BL"] as const).map((source) => {
                      const sourceLogs = fetchLogs.filter((entry) => entry.source === source);

                      return (
                        <div key={source} className="rounded-md border border-border bg-muted/30 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{source}</h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                              <Clock3 className="h-3 w-3" />
                              {sourceLogs.length} fetches
                            </span>
                          </div>
                          <div className="space-y-2 text-xs">
                            {sourceLogs.length > 0 ? (
                              sourceLogs.map((entry) => (
                                <div key={`${entry.source}-${entry.page}-${entry.start}`} className="rounded border border-border bg-background px-3 py-2">
                                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                                    <span className="font-medium text-foreground">Page {entry.page}</span>
                                    <span>start={entry.start}</span>
                                    <span>size={entry.pageSize}</span>
                                    <span>results={entry.resultCount}</span>
                                  </div>
                                  <p className="mt-1 break-all text-[11px] text-muted-foreground">{entry.url}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground">No fetches recorded yet.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>

            {isLoading ? (
              <div className="flex items-center justify-center h-[calc(100vh-220px)] text-sm text-muted-foreground">
                Loading buylead results...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-[calc(100vh-220px)] text-center">
                <div className="max-w-md rounded-lg border border-border bg-card px-6 py-5 shadow-sm">
                  <h2 className="text-base font-semibold text-foreground">Unable to fetch results</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <ResultColumn
                  title="Current Buylead Search"
                  results={comparison.blSearch}
                  rankKey="blRank"
                  sellerInfo={sellerInfo}
                  mcatRankMap={mcatRankMap}
                  cityMap={cityMap}
                  queryPmcatId={queryPmcatId}
                />
                <ResultColumn
                  title="New BL Search"
                  results={comparison.semanticSearch}
                  rankKey="semanticRank"
                  sellerInfo={sellerInfo}
                  mcatRankMap={mcatRankMap}
                  cityMap={cityMap}
                  queryPmcatId={queryPmcatId}
                />
              </div>
            )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-220px)] text-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <svg
                  className="w-12 h-12 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Enter a keyword to compare search results
              </h2>
              <p className="text-muted-foreground max-w-md">
                Type a product keyword like "sacks" and click search to see
                how results differ between current BL Search and Semantic Search.
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-4">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            Buylead Search Comparator — Comparing search algorithms for better B2B discovery
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
