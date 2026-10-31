/* 本地静态服务器
 * 桌面版不从 file:// 加载页面 —— file:// 下浏览器会拦 fetch，词库读不出来。
 * 这里起一个只监听 127.0.0.1 的 http 服务，页面与 Service Worker 都能正常工作。
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8"
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const rel = decoded.replace(/^\/+/, "");
  const full = path.resolve(root, rel);
  const rootFull = path.resolve(root);
  // 越界访问一律拒绝
  if (full !== rootFull && !full.startsWith(rootFull + path.sep)) return null;
  return full;
}

/** 启动服务器，返回 { port, close } */
function startServer(rootDir) {
  const server = http.createServer((req, res) => {
    let urlPath;
    try {
      urlPath = new URL(req.url, "http://127.0.0.1").pathname;
    } catch (_) {
      res.writeHead(400).end("bad request");
      return;
    }
    if (urlPath === "/" || urlPath === "") urlPath = "/index.html";

    const filePath = safeJoin(rootDir, urlPath);
    if (!filePath) {
      res.writeHead(403).end("forbidden");
      return;
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        // SPA 回退：未知路径一律给 index.html（本项目是 hash 路由，其实用不到）
        const fallback = path.join(rootDir, "index.html");
        fs.readFile(fallback, (e2, buf2) => {
          if (e2) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404");
          } else {
            res.writeHead(200, { "Content-Type": MIME[".html"] }).end(buf2);
          }
        });
        return;
      }
      const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": type,
        // 页面与词库每次都回源，避免改了词库还读到旧缓存
        "Cache-Control": "no-cache"
      });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  return new Promise((resolve, reject) => {
    // 端口交给系统分配，避免和本机其它服务抢 8000
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        port,
        url: `http://127.0.0.1:${port}/index.html`,
        close: () => new Promise((r) => server.close(() => r()))
      });
    });
    server.on("error", reject);
  });
}

module.exports = { startServer };
