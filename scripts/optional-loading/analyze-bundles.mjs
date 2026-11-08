#!/usr/bin/env node
/**
 * Scan a Next static export (`out/`) for optional-loading boundaries.
 * Usage: node scripts/optional-loading/analyze-bundles.mjs [outDir] [label]
 */
import { createGzip } from "node:zlib";
import { Buffer } from "node:buffer";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.resolve(process.argv[2] ?? path.join(repoRoot, "out"));
const label = process.argv[3] ?? "current";
const evidenceDir = path.join(repoRoot, "scripts/optional-loading/evidence");

const NEEDLES = [
  "Loading Strudel",
  "Couldn't run this pattern",
  "Unmute — hear the world",
  "Enter Ghostlink",
  "iframe_api",
  "www-widgetapi",
  "youtube.com/iframe_api",
  's("bd sd hh")',
  "neo.trance",
  "break(core)",
  "beat-lab-expanded",
  "@strudel/web",
];

function gzipSize(buf) {
  return new Promise((resolve, reject) => {
    const gz = createGzip({ level: 9 });
    const chunks = [];
    gz.on("data", (c) => chunks.push(c));
    gz.on("end", () => resolve(Buffer.concat(chunks).length));
    gz.on("error", reject);
    gz.end(buf);
  });
}

async function walkJs(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walkJs(full, acc);
    else if (entry.name.endsWith(".js")) acc.push(full);
  }
  return acc;
}

const html = await readFile(path.join(outDir, "index.html"), "utf8");
const indexScripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
const jsFiles = await walkJs(outDir);

const files = [];
for (const file of jsFiles) {
  const rawBuf = await readFile(file);
  const raw = rawBuf.length;
  const gzip = await gzipSize(rawBuf);
  const text = rawBuf.toString("utf8");
  const hits = {};
  for (const needle of NEEDLES) {
    const count = text.split(needle).length - 1;
    if (count > 0) hits[needle] = count;
  }
  files.push({
    file: path.relative(outDir, file),
    raw,
    gzip,
    hits,
  });
}

files.sort((a, b) => b.gzip - a.gzip);

const htmlReferenced = [];
let htmlRaw = 0;
let htmlGzip = 0;
for (const src of indexScripts) {
  const rel = src.replace(/^\//, "");
  const match = files.find((f) => f.file === rel || f.file.replace(/\\/g, "/") === rel);
  if (!match) {
    htmlReferenced.push({ src, missing: true });
    continue;
  }
  htmlRaw += match.raw;
  htmlGzip += match.gzip;
  htmlReferenced.push({ src, raw: match.raw, gzip: match.gzip, hits: match.hits });
}

const report = {
  label,
  outDir,
  generatedAt: new Date().toISOString(),
  indexScripts,
  htmlReferencedJs: { raw: htmlRaw, gzip: htmlGzip, files: htmlReferenced },
  filesWithNeedles: files.filter((f) => Object.keys(f.hits).length > 0),
  largest: files.slice(0, 16),
};

await mkdir(evidenceDir, { recursive: true });
const outPath = path.join(evidenceDir, `bundles-${label}.json`);
await writeFile(outPath, JSON.stringify(report, null, 2) + "\n");

const pageHits = htmlReferenced.flatMap((f) =>
  f.hits
    ? Object.entries(f.hits).map(([k, v]) => `${f.src}: ${v}× ${k}`)
    : [],
);

console.log(`Wrote ${outPath}`);
console.log(`Home HTML-referenced JS: ${htmlRaw} raw / ${htmlGzip} gzip (${indexScripts.length} tags)`);
console.log("Needles in HTML-referenced JS:");
if (pageHits.length === 0) console.log("  (none)");
else pageHits.forEach((line) => console.log(" ", line));
console.log("Needles in other JS chunks:");
for (const f of report.filesWithNeedles) {
  if (indexScripts.some((src) => src.endsWith(f.file.replace(/\\/g, "/")) || src.replace(/^\//, "") === f.file)) {
    continue;
  }
  console.log(`  ${f.gzip} gzip  ${f.file}`);
  for (const [k, v] of Object.entries(f.hits)) console.log(`    ${v}× ${k}`);
}
