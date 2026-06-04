# Buylead Search Comparator - Codebase Understanding

This document outlines the architecture, components, and data flow of the Buylead Search Comparator application.

---

## 1. Application Overview
The **Buylead Search Comparator** is a web-based dashboard designed to compare B2B search results from two distinct search backends side-by-side:
1. **Current BL (Buylead) Search**: The existing search algorithm.
2. **New BL Search**: The new semantic search model.

It helps developers and product managers evaluate changes in ranking, category matching, response times, and retrieve missing/out-of-order search results.

---

## 2. Tech Stack & Dependencies
* **Core**: React 18 (TypeScript), Vite
* **Routing & State**: React Router DOM (v6), TanStack Query (React Query v5)
* **Styling**: Tailwind CSS (v3), Lucide React (icons), IndiaMART-inspired corporate blue/grey theme system
* **UI Library**: Shadcn UI (Radix Primitives)
* **Date Utilities**: `date-fns` for time distance formatting

---

## 3. Configuration & API Proxying
To avoid CORS issues when fetching data from the backend APIs directly in the browser, the application uses Vite's dev server proxy configurations:

* **Config File**: [`vite.config.ts`](file:///c:/Users/Indiamart/Desktop/lovable/vite.config.ts)
* **Proxies**:
  * `/api/current-buylead` proxies to `http://blsearch.indiamart.com:8983/search/buylead`
  * `/api/new-buylead` proxies to `http://34.93.108.209:8983/blsearch/buylead`
* **Env File**: [`.env`](file:///c:/Users/Indiamart/Desktop/lovable/.env) stores preconfigured query templates:
  * `VITE_CURRENT_BUYLEAD_URL`
  * `VITE_NEW_BUYLEAD_URL`

---

## 4. Key Code Files & Components

### A. Data Layer
* **[`src/data/mockBuyleads.ts`](file:///c:/Users/Indiamart/Desktop/lovable/src/data/mockBuyleads.ts)**
  * Contains typescript interfaces (`Buylead`, `BuyleadAttribute`, `FetchLogEntry`, `BuyleadComparison`).
  * **`normalizeBuylead(fields)`**: Converts raw backend JSON fields to a unified front-end structure (e.g. mapping `city_string`/`district` to `location`, extraction of `isqdetails` into `quantity` and `attributes`).
  * **`fetchAllBuyleads(url, source)`**: Automatically makes paginated calls (looping with `start` and `pageSize` parameters) until all records are retrieved or `total_results` is reached.
  * **`fetchBuyleadComparison(currentUrl, newUrl)`**: Coordinates the fetching of both endpoints, sorts them by score descending, computes relative rankings, and maps matching display IDs to display cross-backend ranks.

### B. Pages
* **[`src/pages/Index.tsx`](file:///c:/Users/Indiamart/Desktop/lovable/src/pages/Index.tsx)**
  * The main dashboard entrypoint.
  * Manages search inputs (`searchQuery`, `glid`) and the execution state.
  * Dynamically updates the request URLs with search query and GLID parameters using `buildSearchUrl`.
  * Displays:
    * Search input controls (`SearchHeader`)
    * Query metadata & details
    * Result counts & metrics (total found vs. fetched)
    * Expandable **Fetch History** logger (detailing pages, parameters, and URLs fetched)
    * Side-by-side results columns (`ResultColumn`)

### C. Components
* **[`src/components/SearchHeader.tsx`](file:///c:/Users/Indiamart/Desktop/lovable/src/components/SearchHeader.tsx)**: Persistent header with IndiaMART styling. Includes keyword input, GLID input, and trigger button.
* **[`src/components/ResultColumn.tsx`](file:///c:/Users/Indiamart/Desktop/lovable/src/components/ResultColumn.tsx)**: Displays the results for a specific search method (sorted by rank).
* **[`src/components/BuyleadCard.tsx`](file:///c:/Users/Indiamart/Desktop/lovable/src/components/BuyleadCard.tsx)**: Individual result card showing detail items (Title, Qty, Value, Location, Flag, category hierarchy, attributes) and comparisons at the footer:
  * **BL Rank**: Rank in Current BL Search (or "missing")
  * **New Rank**: Rank in New BL Search (or "missing")
* **[`src/components/FilterBar.tsx`](file:///c:/Users/Indiamart/Desktop/lovable/src/components/FilterBar.tsx)**: Header of each result column displaying the total count.

---

## 5. Comparison Logic Walkthrough
1. The user enters a search term (e.g., `chloroform`) and GLID (e.g., `236`) and submits.
2. The page constructs the search URL replacing `q` and `options.filters.glusrid.data`.
3. Parallel API requests are triggered for both endpoints via the Vite dev-server proxy.
4. If results span multiple pages, `fetchAllBuyleads` performs pagination automatically.
5. The fetched items are normalized, then sorted by their relative score in descending order.
6. The rank index (1-based) is assigned for each list.
7. A cross-reference Map checks if `displayId` in "Current BL" list matches any `displayId` in "New BL" list.
8. Cards display their local rank and the corresponding rank of the same item in the alternative list.
