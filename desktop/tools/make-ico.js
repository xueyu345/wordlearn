/* 生成 Windows 图标 build/icon.ico
 * ICO 容器里直接塞 PNG（Vista 起支持的格式），不需要任何图像处理库。
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.resolve(__dirname, "..", "build");

// 声明尺寸 256 在 ICO 里用 0 表示
const ENTRIES = [
  { size: 256, src: "icons/icon-512.png" },
  { size: 48, src: "icons/icon-192.png" },
  { size: 32, src: "icons/icon-192.png" },
  { size: 16, src: "icons/icon-192.png" }
];

const images = ENTRIES.map((e) => ({
  size: e.size,
  data: fs.readFileSync(path.join(ROOT, e.src))
}));

const COUNT = images.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(COUNT, 4);

const dir = Buffer.alloc(16 * COUNT);
let offset = 6 + 16 * COUNT;
images.forEach((img, i) => {
  const at = i * 16;
  dir.writeUInt8(img.size === 256 ? 0 : img.size, at);
  dir.writeUInt8(img.size === 256 ? 0 : img.size, at + 1);
  dir.writeUInt8(0, at + 2); // 调色板数
  dir.writeUInt8(0, at + 3); // reserved
  dir.writeUInt16LE(1, at + 4); // planes
  dir.writeUInt16LE(32, at + 6); // 位深
  dir.writeUInt32LE(img.data.length, at + 8);
  dir.writeUInt32LE(offset, at + 12);
  offset += img.data.length;
});

fs.mkdirSync(OUT_DIR, { recursive: true });
const out = path.join(OUT_DIR, "icon.ico");
fs.writeFileSync(out, Buffer.concat([header, dir, ...images.map((i) => i.data)]));
console.log(`✓ ${out}  (${(fs.statSync(out).size / 1024).toFixed(1)} KB, ${COUNT} 个尺寸)`);
