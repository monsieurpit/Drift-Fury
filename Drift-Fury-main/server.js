const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT) || 3000;
const reloadClients = new Set();
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
  if (!contentType || ["server.js", "package.json"].includes(path.basename(filePath))) {
    response.writeHead(404).end("Not found");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
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

  if (pathname === "/__reload") {
    if (request.method === "HEAD") {
      response.writeHead(200, { "Content-Type": "text/event-stream" }).end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    response.write(":\n\n");
    reloadClients.add(response);
    response.on("close", () => reloadClients.delete(response));
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

let reloadTimer;
fs.watch(root, (eventType, filename) => {
  if (filename && ![".html", ".css", ".js", ".json"].includes(path.extname(filename.toString()))) {
    return;
  }
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    for (const client of reloadClients) {
      client.write("event: reload\ndata: update\n\n");
    }
  }, 100);
}).on("error", (error) => {
  console.error("Unable to watch site files for changes:", error);
});
const reloadHeartbeat = setInterval(() => {
  for (const client of reloadClients) {
    client.write(": keep-alive\n\n");
  }
}, 15000);
reloadHeartbeat.unref();

server.listen(port, "0.0.0.0", () => {
  console.log(`Drift Fury is listening on port ${port}`);
});