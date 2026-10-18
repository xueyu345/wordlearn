#!/usr/bin/env node
/**
 * 生成 PWA 图标（纯 Node，无第三方依赖）
 * 运行：node tools/make-icons.js
 *
 * 图标设计：橙色圆角底 + 深色圆 + 白色 A-B-C 字母，与 index.html 的配色一致。
 */
"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "icons");

/* ---------- 极简 PNG 编码 ---------- */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;            // bit depth
  ihdr[9] = 6;            // color type: RGBA
  ihdr[10] = 0;           // compression
  ihdr[11] = 0;           // filter
  ihdr[12] = 0;           // interlace

  // 每行前加 filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

/* ---------- 画布 ---------- */
class Canvas {
  constructor(size) {
    this.size = size;
    this.data = Buffer.alloc(size * size * 4, 0);
  }

  blend(x, y, r, g, b, a) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size || a <= 0) return;
    const i = (y * this.size + x) * 4;
    const srcA = a / 255;
    const dstA = this.data[i + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA <= 0) return;
    this.data[i] = Math.round((r * srcA + this.data[i] * dstA * (1 - srcA)) / outA);
    this.data[i + 1] = Math.round((g * srcA + this.data[i + 1] * dstA * (1 - srcA)) / outA);
    this.data[i + 2] = Math.round((b * srcA + this.data[i + 2] * dstA * (1 - srcA)) / outA);
    this.data[i + 3] = Math.round(outA * 255);
  }

  // 用 4x4 超采样做抗锯齿
  fill(inside, color) {
    const S = this.size * 4;
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        let hits = 0;
        for (let sy = 0; sy < 4; sy += 1) {
          for (let sx = 0; sx < 4; sx += 1) {
            const px = (x + (sx + 0.5) / 4) / this.size;
            const py = (y + (sy + 0.5) / 4) / this.size;
            if (inside(px, py)) hits += 1;
          }
        }
        if (hits) this.blend(x, y, color[0], color[1], color[2], Math.round((color[3] * hits) / 16));
      }
    }
  }

  toPng() {
    return encodePng(this.size, this.size, this.data);
  }
}

function roundedRectMask(radius, inset) {
  return (x, y) => {
    const min = inset, max = 1 - inset;
    if (x < min || x > max || y < min || y > max) return false;
    const r = radius;
    const cx = Math.min(Math.max(x, min + r), max - r);
    const cy = Math.min(Math.max(y, min + r), max - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  };
}

function circleMask(cx, cy, r) {
  return (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/* ---------- 5x7 点阵字母 ---------- */
const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"]
};

function drawText(canvas, text, originX, originY, pixel, gap, color) {
  const rows = 7;
  const width = text.length * 5 + (text.length - 1) * gap;
  let cursor = originX;
  for (const letter of text) {
    const glyph = GLYPHS[letter];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        if (glyph[row][col] !== "1") continue;
        const x0 = cursor + col * pixel;
        const y0 = originY + row * pixel;
        canvas.fill(
          (x, y) => {
            const px = x * canvas.size;
            const py = y * canvas.size;
            return px >= x0 && px < x0 + pixel && py >= y0 && py < y0 + pixel;
          },
          color
        );
      }
    }
    cursor += (5 + gap) * pixel;
  }
  return width;
}

/* ---------- 生成 ---------- */
const ORANGE = [255, 138, 61, 255];
const ORANGE_DEEP = [240, 112, 28, 255];
const CREAM = [255, 247, 236, 255];
const INK = [52, 43, 69, 255];

function build({ size, maskable, file }) {
  const canvas = new Canvas(size);
  const unit = size / 100;

  if (maskable) {
    // maskable 需要铺满整个画布，安全区留 20%
    canvas.fill(() => true, ORANGE);
    const d = canvas.data;
    // 简单的竖向渐变，让底色不那么平
    for (let y = 0; y < size; y += 1) {
      const t = y / size;
      const r = Math.round(ORANGE[0] * (1 - t) + ORANGE_DEEP[0] * t);
      const g = Math.round(ORANGE[1] * (1 - t) + ORANGE_DEEP[1] * t);
      const b = Math.round(ORANGE[2] * (1 - t) + ORANGE_DEEP[2] * t);
      for (let x = 0; x < size; x += 1) {
        const i = (y * size + x) * 4;
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
      }
    }
  } else {
    canvas.fill(roundedRectMask(0.22, 0), ORANGE);
    const d = canvas.data;
    for (let y = 0; y < size; y += 1) {
      const t = y / size;
      const r = Math.round(ORANGE[0] * (1 - t) + ORANGE_DEEP[0] * t);
      const g = Math.round(ORANGE[1] * (1 - t) + ORANGE_DEEP[1] * t);
      const b = Math.round(ORANGE[2] * (1 - t) + ORANGE_DEEP[2] * t);
      for (let x = 0; x < size; x += 1) {
        const i = (y * size + x) * 4;
        if (d[i + 3] === 0) continue;
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
      }
    }
  }

  // 内圈柔光
  canvas.fill(circleMask(0.5, 0.42, 0.36), [255, 247, 236, 34]);
  // 底部深色圆底（放字母）
  canvas.fill(circleMask(0.5, 0.68, 0.235), INK);

  // ABC 字母
  const pixel = 2.6 * unit;
  const gap = 1.1;
  const textWidth = (5 * 3 + gap * 2) * pixel;
  const originX = (size - textWidth) / 2;
  const originY = size * 0.68 - (7 * pixel) / 2;
  drawText(canvas, "ABC", originX, originY, pixel, gap, CREAM);

  fs.writeFileSync(path.join(outDir, file), canvas.toPng());
  console.log("已生成 icons/" + file + " (" + size + "×" + size + ")");
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
build({ size: 192, maskable: false, file: "icon-192.png" });
build({ size: 512, maskable: false, file: "icon-512.png" });
build({ size: 512, maskable: true, file: "icon-maskable-512.png" });
