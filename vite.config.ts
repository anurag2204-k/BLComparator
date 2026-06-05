import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/seller": {
        target: "http://blsearch-db.intermesh.net:8985",
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/api\/seller/, "/solr/seller/select"),
      },
      "/api/related-info": {
        target: "http://searchtools.intermesh.net:8983",
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/api\/related-info/, "/tools/related_info"),
      },
      "/api/current-buylead": {
        target: "http://blsearch.indiamart.com:8983",
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/api\/current-buylead/, "/search/buylead"),
      },
      "/api/new-buylead": {
        target: "http://34.93.108.209:8983",
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/api\/new-buylead/, "/blsearch/buylead"),
      },
    },
  },
  preview: {
    proxy: {
      "/api/seller": {
        target: "http://blsearch-db.intermesh.net:8985",
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/api\/seller/, "/solr/seller/select"),
      },
      "/api/related-info": {
        target: "http://searchtools.intermesh.net:8983",
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/api\/related-info/, "/tools/related_info"),
      },
      "/api/current-buylead": {
        target: "http://blsearch.indiamart.com:8983",
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/api\/current-buylead/, "/search/buylead"),
      },
      "/api/new-buylead": {
        target: "http://34.93.108.209:8983",
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/api\/new-buylead/, "/blsearch/buylead"),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
