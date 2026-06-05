import { formatDistanceToNow } from "date-fns";

export interface BuyleadAttribute {
  label: string;
  value: string;
}

export interface Buylead {
  id: string;
  displayId: string;
  offerId: string | null;
  glid: string | null;
  mcatConf: string | null;
  gridParamater: string | null;
  retailType: "Retail" | "Non Retail";
  title: string | null;
  timeAgo: string | null;
  timeBucket: string | null;
  location: string | null;
  countryCode: string | null;
  category: string | null;
  subcategory: string | null;
  requirements: string | null;
  quantity: string | null;
  attributes: BuyleadAttribute[];
  orderValueRange: string | null;
  blRank: number | null;
  semanticRank: number | null;
  score: number | null;
  mcatIds: string[];
  latlon: string | null;
  datatype: string | null;
  slab : string | null;
  pmcatids: string[];
}

type RawBuyleadFields = Record<string, unknown>;

type RawBuyleadResponse = {
  results?: Array<{ fields?: RawBuyleadFields }>;
  total_results?: number;
};

export type BuyleadComparison = {
  blSearch: Buylead[];
  semanticSearch: Buylead[];
  fetchLogs: FetchLogEntry[];
  currentTotalResults: number | null;
  newTotalResults: number | null;
  currentFetchedCount: number;
  newFetchedCount: number;
};

export type FetchLogEntry = {
  source: "Current BL" | "New BL";
  page: number;
  start: number;
  pageSize: number;
  resultCount: number;
  url: string;
};

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getDisplayString(value: unknown): string | null {
  if (typeof value === "string") {
    return value.trim() ? value.trim() : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function getFirstString(values: unknown): string | null {
  return getString(getStringArray(values)[0]);
}

function parseDetails(details: string[]): { quantity: string | null; orderValueRange: string | null; attributes: BuyleadAttribute[] } {
  let quantity: string | null = null;
  let orderValueRange: string | null = null;
  const attributes: BuyleadAttribute[] = [];

  details.forEach((detail) => {
    const [rawLabel, ...valueParts] = detail.split(":");
    const label = rawLabel.trim();
    const value = valueParts.join(":").trim();

    if (!label || !value) {
      return;
    }

    if (label.toLowerCase() === "quantity") {
      quantity = value;
      return;
    }

    if (label.toLowerCase() === "probable order value") {
      orderValueRange = value;
      return;
    }

      attributes.push({ label, value });
    
  });

  return { quantity, orderValueRange, attributes };
}

function formatTimeAgo(fields: RawBuyleadFields): string | null {
  const dateValue = getString(fields.lastactiondate) ?? getString(fields.indexeddate) ?? getString(fields.currentdatetime) ?? getString(fields.releasedate);

  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${formatDistanceToNow(date, { addSuffix: true })}`;
}

function getTimeBucket(timeAgo: string | null): string | null {
  if (!timeAgo) {
    return null;
  }

  const normalizedTimeAgo = timeAgo.toLowerCase();
  const hoursMatch = normalizedTimeAgo.match(/(\d+)\s+hours?/);

  if (hoursMatch) {
    const hours = Number(hoursMatch[1]);

    if (hours <= 2) return "2 hours ago";
    if (hours <= 5) return "5 hours ago";
    if (hours <= 8) return "8 hours ago";
    if (hours <= 12) return "12 hours ago";
    if (hours <= 18) return "18 hours ago";
    return "1 day ago";
  }

  const dayMatch = normalizedTimeAgo.match(/(\d+)\s+days?/);

  if (dayMatch) {
    const days = Number(dayMatch[1]);

    if (days <= 1) return "1 day ago";
    if (days === 2) return "2 days ago";
    return "3 days ago";
  }

  if (normalizedTimeAgo.includes("day")) {
    return "1 day ago";
  }

  return "2 hours ago";
}

function getRetailType(value: unknown): "Retail" | "Non Retail" {
  const inquiryType = typeof value === "number" ? value : Number(value);

  return [1, 3, 5, 6].includes(inquiryType) ? "Retail" : "Non Retail";
}

function normalizeBuylead(fields: RawBuyleadFields): Buylead {
  const displayId = getString(fields.displayid) ?? getString(fields.displayId) ?? `display-${Math.random().toString(36).slice(2)}`;
  const details = parseDetails(getStringArray(fields.isqdetails));
  const timeAgo = formatTimeAgo(fields);

  const mcatIds: string[] = [];
  const rawMcatIds = fields.mcatid ?? fields.mcat_id ?? fields.primarymcatid;
  if (Array.isArray(rawMcatIds)) {
    mcatIds.push(...rawMcatIds.map(String));
  } else if (rawMcatIds !== undefined && rawMcatIds !== null) {
    mcatIds.push(String(rawMcatIds));
  }

  const pmcatids: string[] = [];
  const rawPmcatids = fields.pmcatid;
  if (Array.isArray(rawPmcatids)) {
    pmcatids.push(...rawPmcatids.map(String));
  } else if (rawPmcatids !== undefined && rawPmcatids !== null) {
    pmcatids.push(String(rawPmcatids));
  }

  const latlon = getString(fields.latlon) ?? getString(fields.lat_lon) ?? null;

  return {
    id: displayId,
    displayId,
    offerId: getString(fields.offerId) ?? getString(fields.offerid),
    glid: getString(fields.glid),
    mcatConf: getDisplayString(fields.mcatconf),
    gridParamater: getDisplayString(fields.GRID_PARAMETERS),
    retailType: getRetailType(fields.inquirytype),
    title: getString(fields.title) ?? getString(fields.title_tp) ?? getString(fields.titlex),
    timeAgo,
    timeBucket: getTimeBucket(timeAgo),
    location: getString(fields.city_string) ?? getString(fields.city) ?? getString(fields.district_string) ?? getString(fields.dist_hq_name) ?? getString(fields.district),
    countryCode: getString(fields.countryiso)?.toUpperCase() ?? getString(fields.countryCode)?.toUpperCase() ?? null,
    category: getFirstString(fields.cat_name) ?? getFirstString(fields.catnametext),
    subcategory: getFirstString(fields.mcat_name) ?? getFirstString(fields.mcatnametext) ?? getString(fields.primarymcatname),
    requirements: getString(fields.description) ?? getString(fields.smalldescorg) ?? getString(fields.buyersearch),
    quantity: details.quantity,
    attributes: details.attributes,
    orderValueRange: details.orderValueRange,
    blRank: null,
    semanticRank: null,
    score: getNumber(fields.score),
    mcatIds,
    latlon,
    datatype: getString(fields.datatype),
    slab: getDisplayString(fields.slab),
    pmcatids,
  };
}

function getPageSize(url: URL): number {
  const explicitResults = Number(url.searchParams.get("options.results"));
  const explicitRows = Number(url.searchParams.get("rows"));

  if (Number.isFinite(explicitResults) && explicitResults > 0) {
    return Math.floor(explicitResults);
  }

  if (Number.isFinite(explicitRows) && explicitRows > 0) {
    return Math.floor(explicitRows);
  }

  return 20;
}

function getTotalResults(response: RawBuyleadResponse): number | null {
  return typeof response.total_results === "number" && Number.isFinite(response.total_results) && response.total_results > 0
    ? Math.floor(response.total_results)
    : null;
}

function toFetchUrl(url: URL): string {
  if (url.hostname === "blsearch.indiamart.com" && url.pathname === "/search/buylead") {
    return `/api/current-buylead?${url.searchParams.toString()}`;
  }

  if (url.hostname === "34.93.108.209" && url.pathname === "/blsearch/buylead") {
    return `/api/new-buylead?${url.searchParams.toString()}`;
  }

  return url.toString();
}

async function fetchBuyleadResponse(url: string): Promise<RawBuyleadResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch buylead data from ${url}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as RawBuyleadResponse;
}

async function fetchAllBuyleads(url: string, source: FetchLogEntry["source"]): Promise<{ fields: RawBuyleadFields[]; fetchLogs: FetchLogEntry[]; totalResults: number | null }> {
  const parsedUrl = new URL(url, window.location.origin);
  const requestedPageSize = getPageSize(parsedUrl);
  const pageSize = source === "Current BL" ? Math.max(requestedPageSize, 40) : requestedPageSize;
  const allResults: RawBuyleadFields[] = [];
  const fetchLogs: FetchLogEntry[] = [];
  let start = Number(parsedUrl.searchParams.get("options.start") ?? parsedUrl.searchParams.get("start") ?? 0);
  let page = 1;
  let totalResults: number | null = null;

  while (true) {
    const pageUrl = new URL(parsedUrl.toString());
    if (pageUrl.searchParams.has("options.start")) {
      pageUrl.searchParams.set("options.start", String(start));
    } else {
      pageUrl.searchParams.set("start", String(start));
    }

    if (pageUrl.searchParams.has("options.results")) {
      pageUrl.searchParams.set("options.results", String(pageSize));
    } else {
      pageUrl.searchParams.set("rows", String(pageSize));
    }

    const response = await fetchBuyleadResponse(toFetchUrl(pageUrl));
    const pageResults = response.results ?? [];
    totalResults = totalResults ?? getTotalResults(response);

    fetchLogs.push({
      source,
      page,
      start,
      pageSize,
      resultCount: pageResults.length,
      url: pageUrl.toString(),
    });

    allResults.push(...pageResults.map((result) => result.fields ?? {}));

    if (pageResults.length === 0) {
      break;
    }

    if (totalResults !== null && allResults.length >= totalResults) {
      break;
    }

    start += pageSize;
    page += 1;
  }

  return { fields: allResults, fetchLogs, totalResults };
}

export async function fetchBuyleadComparison(currentUrl: string, newUrl: string): Promise<BuyleadComparison> {
  const [currentResponse, newResponse] = await Promise.all([
    fetchAllBuyleads(currentUrl, "Current BL"),
    fetchAllBuyleads(newUrl, "New BL"),
  ]);

  const currentLeads = currentResponse.fields.map((fields) => normalizeBuylead(fields));
  const newLeads = newResponse.fields.map((fields) => normalizeBuylead(fields));

  const currentRankByDisplayId = new Map(currentLeads.map((item, index) => [item.displayId, index + 1]));
  const newRankByDisplayId = new Map(newLeads.map((item, index) => [item.displayId, index + 1]));

  const blSearch = currentLeads.map((item, index) => ({
    ...item,
    blRank: index + 1,
    semanticRank: newRankByDisplayId.get(item.displayId) ?? null,
  }));

  const semanticSearch = newLeads.map((item, index) => ({
    ...item,
    blRank: currentRankByDisplayId.get(item.displayId) ?? null,
    semanticRank: index + 1,
  }));

  return {
    blSearch,
    semanticSearch,
    fetchLogs: [...currentResponse.fetchLogs, ...newResponse.fetchLogs],
    currentTotalResults: currentResponse.totalResults,
    newTotalResults: newResponse.totalResults,
    currentFetchedCount: currentResponse.fields.length,
    newFetchedCount: newResponse.fields.length,
  };
}

export interface SellerInfo {
  homecity: string | null;
  non_retailer: string | null;
  dlp: string | null;
  mcats: string[];
  country: string | null;
}

export async function fetchSellerInfo(glid: string): Promise<SellerInfo> {
  const params = new URLSearchParams();
  // Add multiple 'fl' query parameters
  const fields = [
    "city", "mcats", "neg_city", "district", "neg_mcats", "non_retailer",
    "homecity", "dlp", "keywords", "quantity_pref", "tov", "neg_country",
    "paid_seller", "country", "city_state", "neg_state", "consuming_city",
    "state", "catid", "pmcatid"
  ];
  fields.forEach(field => params.append("fl", field));
  params.set("indent", "on");
  params.set("q", `glusr_usr_id:${glid}`);
  params.set("wt", "json");

  const url = `/api/seller?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch seller info: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const doc = data?.response?.docs?.[0] ?? {};

  const getFieldVal = (field: unknown): string | null => {
    if (Array.isArray(field)) {
      return field[0] !== undefined && field[0] !== null ? String(field[0]) : null;
    }
    return field !== undefined && field !== null ? String(field) : null;
  };

  const getArrayVal = (field: unknown): string[] => {
    if (Array.isArray(field)) {
      return field.map(String);
    }
    if (field !== undefined && field !== null) {
      return [String(field)];
    }
    return [];
  };

  return {
    homecity: getFieldVal(doc.homecity),
    non_retailer: getFieldVal(doc.non_retailer),
    dlp: getFieldVal(doc.dlp),
    mcats: getArrayVal(doc.mcats),
    country: getFieldVal(doc.country),
  };
}

