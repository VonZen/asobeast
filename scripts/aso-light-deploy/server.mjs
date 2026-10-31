import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";

const root = resolve(process.env.STATIC_ROOT ?? "/srv/www");
const apiIp = process.env.API_IP;
const port = Number(process.env.PORT ?? 80);
if (!apiIp || !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(apiIp)) {
  throw new Error("API_IP must be the API container's IPv4 address");
}
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

http
  .createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
    } catch {
      response.writeHead(400).end("Bad request");
      return;
    }
    if (
      pathname === "/health" ||
      pathname.startsWith("/api/") ||
      pathname === "/mcp" ||
      pathname.startsWith("/mcp/")
    ) {
      const upstream = http.request(
        {
          hostname: apiIp,
          port: 8002,
          method: request.method,
          path: request.url,
          headers: { ...request.headers, host: `${apiIp}:8002` },
        },
        (upstreamResponse) => {
          response.writeHead(
            upstreamResponse.statusCode ?? 502,
            upstreamResponse.headers,
          );
          upstreamResponse.pipe(response);
        },
      );
      upstream.on("error", () => {
        if (!response.headersSent) response.writeHead(502);
        response.end("API unavailable");
      });
      request.pipe(upstream);
      return;
    }
    const target = resolve(root, "." + pathname);
    if (target !== root && !target.startsWith(root + sep)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    let file = target;
    try {
      if (!existsSync(file) || !statSync(file).isFile())
        file = resolve(root, "index.html");
      const stat = statSync(file);
      response.writeHead(200, {
        "Content-Type": mime[extname(file)] ?? "application/octet-stream",
        "Content-Length": stat.size,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": file.endsWith("/index.html")
          ? "no-cache"
          : "public, max-age=3600",
      });
      if (request.method === "HEAD") response.end();
      else createReadStream(file).pipe(response);
    } catch {
      response.writeHead(404).end("Not found");
    }
  })
  .listen(port, "0.0.0.0");
