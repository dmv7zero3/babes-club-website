/**
 * CloudFront Function for Cafe Opera fully static website
 *
 * Handles:
 * 1. Static file pass-through (including XML, fonts, etc.)
 * 2. Static routes to their respective HTML files
 * 3. Fallback to /index.html for React Router to handle unknown routes
 */
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Redirect /index.html to /
  if (uri === "/index.html") {
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: {
        location: { value: "/" },
      },
    };
  }

  // Static file extensions
  var staticExtensions = [
    ".js",
    ".css",
    ".html",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".webp",
    ".avif",
    ".ico",
    ".pdf",
    ".txt",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".mp4",
    ".map",
    ".json",
    ".xml",
    ".webmanifest",
  ];

  var staticRoutes = ["/", "/about", "/menu", "/contact"];
  // 1. Pass through static assets
  for (var i = 0; i < staticExtensions.length; i++) {
    if (uri.endsWith(staticExtensions[i])) {
      return request;
    }
  }

  // 2. Special handling for sitemap.xml and robots.txt
  if (uri === "/sitemap.xml" || uri === "/robots.txt") {
    return request;
  }

  // 3. Normalize URI (remove trailing slash, except for root)
  var cleanUri = uri === "/" ? "/" : uri.replace(/\/+$/, "");

  // 4. Handle static routes
  for (var j = 0; j < staticRoutes.length; j++) {
    if (cleanUri === staticRoutes[j]) {
      request.uri = cleanUri === "/" ? "/index.html" : cleanUri + "/index.html";
      return request;
    }
  }

  // 5. Fallback: serve main index.html for React Router to handle
  request.uri = "/index.html";
  return request;
}
