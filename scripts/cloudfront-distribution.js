function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Define static file extensions (added .xml for sitemap)
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
  ];

  // Define known static routes (these have their own HTML files)
  var staticRoutes = [
    "/",
    "/locations",
    "/franchise",
    "/contact",
    "/calories",
    "/careers",
    "/terms-of-service",
    "/privacy-policy",
    "/locations/uk/chelmsford",
    "/blog",
  ];

  // Static file detection
  var isStaticFile = false;
  for (var i = 0; i < staticExtensions.length; i++) {
    if (uri.toLowerCase().endsWith(staticExtensions[i])) {
      isStaticFile = true;
      break;
    }
  }

  // 1. Pass through static files directly
  if (isStaticFile) {
    return request;
  }

  // 2. Special handling for sitemap.xml and robots.txt
  if (uri === "/sitemap.xml" || uri === "/robots.txt") {
    return request;
  }

  // 3. Handle all routes as static HTML files
  var cleanUri = uri.endsWith("/") ? uri.slice(0, -1) : uri;

  // For root path
  if (cleanUri === "" || cleanUri === "/") {
    request.uri = "/index.html";
    return request;
  }

  // For all other paths, try to serve the static HTML file
  request.uri = cleanUri + "/index.html";
  return request;
}
