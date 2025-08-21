import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { routes as staticRoutes } from "../webpack/prod/staticRoutes.js";

// Import blog data for dynamic blog URLs
import blogDataRaw from "../src/core/Blogs/Templates/LocalSEO/database_content.json" assert { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = "https://moonloungesterlingva.com";

// Extract blog URLs dynamically
const blogRoutes = blogDataRaw
  .filter((blog) => blog.url && blog.title)
  .map((blog) => `/${blog.url}`);

function generateSitemap() {
  const currentDate = new Date().toISOString();

  // Only include static routes that are NOT blog post pages
  const staticTopLevelRoutes = staticRoutes.filter(
    (route) => !route.startsWith("/blog/") && route !== "/blog"
  );

  // Add /blog as a static page, but not individual posts
  const allStaticRoutes = [...staticTopLevelRoutes, "/blog"];

  // Combine static and dynamic blog routes
  const allRoutes = [...allStaticRoutes, ...blogRoutes];

  const getRouteConfig = (route) => {
    if (route === "/") {
      return { priority: "1.0", changefreq: "weekly" };
    } else if (route.startsWith("/locations")) {
      return { priority: "0.9", changefreq: "monthly" };
    } else if (["/franchise", "/contact", "/careers"].includes(route)) {
      return { priority: "0.8", changefreq: "monthly" };
    } else if (
      ["/calories", "/terms-of-service", "/privacy-policy"].includes(route)
    ) {
      return { priority: "0.6", changefreq: "yearly" };
    } else if (route.startsWith("/blog/")) {
      return { priority: "0.7", changefreq: "monthly" };
    } else {
      return { priority: "0.7", changefreq: "monthly" };
    }
  };

  const sitemapEntries = allRoutes
    .map((route) => {
      const url = route === "/" ? SITE_URL : `${SITE_URL}${route}`;
      const config = getRouteConfig(route);

      return `  <url>
    <loc>${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${config.changefreq}</changefreq>
    <priority>${config.priority}</priority>
  </url>`;
    })
    .join("\n");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`;

  const publicDir = path.resolve(__dirname, "../public");
  const sitemapPath = path.join(publicDir, "sitemap.xml");

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(sitemapPath, sitemapXml, "utf8");
  console.log(
    `✅ Generated sitemap.xml with ${allRoutes.length} URLs at ${sitemapPath}`
  );

  return sitemapPath;
}

function generateRobotsTxt() {
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml`;

  const publicDir = path.resolve(__dirname, "../public");
  const robotsPath = path.join(publicDir, "robots.txt");

  fs.writeFileSync(robotsPath, robotsTxt, "utf8");
  console.log(`✅ Generated robots.txt at ${robotsPath}`);

  return robotsPath;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap();
  generateRobotsTxt();
}

export { generateSitemap, generateRobotsTxt };
