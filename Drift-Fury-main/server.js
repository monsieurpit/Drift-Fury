// Serves the production build in dist/ (run `npm run build` first, or just `npm start`).
// For development with instant reload, use `npm run dev` instead.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");
const port = Number(process.env.PORT) || 3000;
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function sendFile(filePath, request, response) {
  const contentType = contentTypes[path.extname(filePath).toLowerCase()];
  if (!contentType) {
    response.writeHead(404).end("Not found");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }

    // Built assets have content hashes in their names, so they can be cached forever.
    const immutable = filePath.startsWith(path.join(root, "assets") + path.sep);
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
    });
    if (request.method === "HEAD") {
      response.end();
    } else {
      fs.createReadStream(filePath).pipe(response);
    }
  });
}

const server = http.createServer((request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  if (pathname.includes("\0")) {
    response.writeHead(400).end("Bad request");
    return;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(root, relativePath);
  const relativeToRoot = path.relative(root, filePath);
  if (
    relativeToRoot.startsWith(`..${path.sep}`) ||
    relativeToRoot === ".." ||
    relativeToRoot.split(path.sep).some((part) => part.startsWith("."))
  ) {
    response.writeHead(404).end("Not found");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(filePath, request, response);
      return;
    }

    if (request.headers.accept?.includes("text/html")) {
      sendFile(path.join(root, "index.html"), request, response);
      return;
    }

    response.writeHead(404).end("Not found");
  });
});

if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error("No build found in dist/. Run `npm run build` (or `npm start`, which builds first).");
  process.exit(1);
}

server.listen(port, "0.0.0.0", () => {
  console.log(`Drift Fury is listening on port ${port}`);
});
