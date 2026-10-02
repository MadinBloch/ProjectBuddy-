import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { buildIntelligence, toLegacyScan } from "./intelligence.js";

const SKIP_DIRS = new Set([
  "node_modules",
  "vendor",
  ".git",
  "dist",
  "build",
  ".next",
  "__pycache__",
  "storage",
  "bootstrap",
  "public",
  ".idea",
  ".vscode",
  "coverage",
]);

const CODE_EXT = new Set([
  ".php",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".kt",
  ".go",
  ".rb",
  ".vue",
  ".cs",
  ".sql",
  ".prisma",
  ".json",
  ".yml",
  ".yaml",
  ".xml",
  ".md",
  ".jsp",
  ".html",
]);

const EXTRA_NAMES = new Set([
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "composer.json",
  "package.json",
  ".env.example",
  "env.example",
  "pom.xml",
  "requirements.txt",
  "pyproject.toml",
  "go.mod",
  "build.gradle",
  "artisan",
]);

export function unzipTo(zipPath, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(dest, true);
  return flattenRoot(dest);
}

export async function fetchGithubZip(url, destZip) {
  const parsed = parseGithub(url);
  if (!parsed) throw new Error("Enter a public GitHub repository URL.");
  const branches = ["main", "master"];
  let lastErr = null;
  for (const branch of branches) {
    const zipUrl = `https://github.com/${parsed.owner}/${parsed.repo}/archive/refs/heads/${branch}.zip`;
    try {
      const res = await fetch(zipUrl, { redirect: "follow" });
      if (!res.ok) {
        lastErr = new Error(`GitHub returned ${res.status}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(destZip, buf);
      return parsed;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Could not download that GitHub repository.");
}

function parseGithub(url) {
  try {
    const u = new URL(url.trim());
    if (!u.hostname.includes("github.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

function flattenRoot(dest) {
  const entries = fs.readdirSync(dest, { withFileTypes: true }).filter((e) => !e.name.startsWith("__"));
  if (entries.length === 1 && entries[0].isDirectory()) {
    return path.join(dest, entries[0].name);
  }
  return dest;
}

export function collectProjectFiles(root) {
  const files = [];
  walk(root, root, files);
  const texts = [];
  for (const file of files.slice(0, 500)) {
    const ext = path.extname(file.rel).toLowerCase();
    const base = path.basename(file.rel);
    if (!CODE_EXT.has(ext) && !EXTRA_NAMES.has(base)) continue;
    if (file.size > 200000) continue;
    try {
      texts.push({ rel: file.rel, content: fs.readFileSync(file.abs, "utf8") });
    } catch {
      /* binary */
    }
  }
  return { files, texts, rootName: path.basename(root) };
}

export function scanProject(root) {
  const collected = collectProjectFiles(root);
  const intel = buildIntelligence(collected);
  return toLegacyScan(intel);
}

function walk(root, dir, out) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".env.example") continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    const rel = path.relative(root, abs);
    if (entry.isDirectory()) {
      walk(root, abs, out);
    } else if (entry.isFile()) {
      let size = 0;
      try {
        size = fs.statSync(abs).size;
      } catch {
        continue;
      }
      out.push({ abs, rel, size });
    }
  }
}
