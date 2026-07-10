/**
 * generate-sitemap.js
 * 
 * Fetches all public products and shops from the backend API and generates
 * a complete sitemap.xml with static pages + dynamic product/shop URLs.
 * Falls back to static-only if the API is unreachable.
 * 
 * Run: node scripts/generate-sitemap.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const BASE_URL = "https://www.shoplivebharat.com";
const API_BASE = "https://shoplivebharat-backend-production.up.railway.app/api";
const OUTPUT = path.join(__dirname, "..", "public", "sitemap.xml");

const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/marketplace", priority: "0.9", changefreq: "daily" },
  { loc: "/shops", priority: "0.8", changefreq: "weekly" },
  { loc: "/live-shopping", priority: "0.8", changefreq: "weekly" },
  { loc: "/about", priority: "0.5", changefreq: "monthly" },
  { loc: "/contact", priority: "0.5", changefreq: "monthly" },
  { loc: "/become-a-seller", priority: "0.6", changefreq: "monthly" },
  { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  { loc: "/refund-policy", priority: "0.3", changefreq: "yearly" },
];

function fetchJson(url) {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: 15000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

function escapeXml(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toLastmod(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch { return ""; }
}

async function main() {
  console.log("[sitemap] Generating sitemap.xml...");

  let products = [];
  let shops = [];

  try {
    const prodData = await fetchJson(`${API_BASE}/products?active_only=true&limit=5000`);
    if (Array.isArray(prodData)) products = prodData;
    else if (prodData?.products) products = prodData.products;
    console.log(`[sitemap] Fetched ${products.length} products`);
  } catch (e) {
    console.warn("[sitemap] Could not fetch products:", e.message);
  }

  try {
    const shopData = await fetchJson(`${API_BASE}/public/shops?limit=2000`);
    if (Array.isArray(shopData)) shops = shopData;
    else if (shopData?.shops) shops = shopData.shops;
    console.log(`[sitemap] Fetched ${shops.length} shops`);
  } catch (e) {
    console.warn("[sitemap] Could not fetch shops:", e.message);
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Static pages
  for (const page of STATIC_PAGES) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${page.loc}</loc>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `  </url>\n`;
  }

  // Product pages
  for (const p of products) {
    if (!p.id) continue;
    const lastmod = toLastmod(p.updated_at || p.created_at);
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/product/${escapeXml(p.id)}</loc>\n`;
    if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `  </url>\n`;
  }

  // Shop pages
  for (const s of shops) {
    if (!s.id) continue;
    const lastmod = toLastmod(s.updated_at || s.created_at);
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/shops/${escapeXml(s.id)}</loc>\n`;
    if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  fs.writeFileSync(OUTPUT, xml, "utf-8");
  console.log(`[sitemap] Written ${STATIC_PAGES.length + products.length + shops.length} URLs to ${OUTPUT}`);
}

main().catch((err) => {
  console.warn("[sitemap] Generation failed, using static fallback:", err.message);
  // Don't fail the build
  process.exit(0);
});
