async function generateStaticTemplates() {
  try {
    console.log("Generating static templates...");

    // Define the base static routes
    const baseRoutes = ["/", "/catering", "/contact", "/events", "/menu"];

    // Import blog data to generate routes for individual blog posts
    const blogData = await import(
      "../src/core/Blogs/Templates/LocalSEO/database_content.json",
      {
        assert: { type: "json" },
      }
    );

    // Generate blog post routes
    const blogRoutes = blogData.default
      .filter((blog) => blog.url && blog.title) // Only include complete blog entries
      .map((blog) => `/${blog.url}`);

    // Combine all routes
    const allRoutes = [...baseRoutes, ...blogRoutes];

    // Create the templates directory
    const templatesDir = path.resolve(__dirname, "../webpack/templates");
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Import the page metadata
    const { pageMetadata, getPageMetadata } = await import(
      "../src/core/metadata/page-metadata.js"
    );

    // Generate HTML templates with metadata for each route
    for (const route of allRoutes) {
      // Get metadata for the route
      const metadata = getPageMetadata(route);

      // Generate HTML content
      const htmlContent = generateHtmlTemplate(route, metadata);

      // Determine the template filename using our helper function
      const templateName = routeToTemplateName(route);
      const templatePath = path.join(templatesDir, `${templateName}.html`);

      // Write the file
      fs.writeFileSync(templatePath, htmlContent, "utf8");
      console.log(`Generated template for ${route} at ${templatePath}`);
    }

    // Generate sitemap and robots.txt
    console.log("Generating sitemap and robots.txt...");
    const { generateSitemap, generateRobotsTxt } = await import(
      "./generate-sitemap.js"
    );
    generateSitemap();
    generateRobotsTxt();

    // Generate the static routes configuration with improved nested route handling
    const routesConfig = `
import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const routes = ${JSON.stringify(allRoutes, null, 2)};

// Helper function to convert route path to template name
function routeToTemplateName(route) {
  if (route === "/") return "index";
  return route.substring(1).replace(/\\//g, "-");
}

export function generateStaticRoutes() {
  return routes.map(route => {
    // Get template name using our helper
    const templateName = routeToTemplateName(route);
    const templatePath = path.resolve(__dirname, \`../templates/\${templateName}.html\`);
    
    // Check if template exists, otherwise fallback to index
    const templateExists = fs.existsSync(templatePath);
    const finalTemplatePath = templateExists ? templatePath : path.resolve(__dirname, "../templates/index.html");
    
    // Create the proper output structure for nested routes
    const filename = route === "/" ? "index.html" : \`\${route.substring(1)}/index.html\`;
    
    return {
      template: finalTemplatePath,
      filename,
      inject: true,
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        minifyCSS: true,
        minifyJS: true,
      }
    };
  });
}

export function generateStaticHtmlPlugins() {
  return generateStaticRoutes().map(
    routeConfig => new HtmlWebpackPlugin(routeConfig)
  );
}
`;

    // Ensure the prod directory exists
    const prodDir = path.dirname(staticRoutesPath);
    if (!fs.existsSync(prodDir)) {
      fs.mkdirSync(prodDir, { recursive: true });
    }

    // Write the routes configuration
    fs.writeFileSync(staticRoutesPath, routesConfig, "utf8");
    console.log(`Generated static routes configuration at ${staticRoutesPath}`);

    return allRoutes;
  } catch (error) {
    console.error("Error generating static templates:", error);
    process.exit(1);
  }
}
