import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import { scanProject, unzipTo } from "../src/scan.js";
import { generatePack } from "../src/generate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, "fixtures");

const answers = {
  studentName: "Test Student",
  enrollment: "EN123",
  college: "Test College",
  course: "BCA",
  guide: "Guide",
  year: "2026",
};

const cases = [
  { dir: "laravel-library", expectStack: "Laravel", expectTable: "books", forbid: ["JWT", "MongoDB", "Spring"] },
  { dir: "express-shop", expectStack: "Express", expectRoute: "/api/products", forbid: ["Laravel", "books"] },
  { dir: "django-exam", expectStack: "Django", expectTable: "student", forbid: ["Laravel", "jsonwebtoken"] },
  { dir: "flask-blog", expectStack: "Flask", expectRoute: "/posts", forbid: ["Laravel", "MongoDB"] },
  { dir: "spring-clinic", expectStack: "Spring Boot", expectTable: "patients", forbid: ["Laravel", "Express"] },
];

let failed = 0;
const reports = [];

for (const c of cases) {
  const scan = scanProject(path.join(fixtures, c.dir));
  if (!scan.ok) {
    failed++;
    reports.push(`${c.dir}: SCAN FAILED ${scan.reason}`);
    continue;
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pb-"));
  const result = await generatePack({
    projectDir: tmp,
    answers: { ...answers, title: c.dir, problem: `Problem for ${c.dir}`, futureWork: "Add tests." },
    scan,
    github: "",
  });
  const report = result.preview.reportHtml + JSON.stringify(result.preview.slides) + JSON.stringify(result.preview.viva);
  const stackHit = (scan.stackLabel || "").includes(c.expectStack) || (scan.stack?.frameworks || []).includes(c.expectStack);
  const tableHit = !c.expectTable || (scan.tables || []).some((t) => t.name.includes(c.expectTable));
  const routeHit = !c.expectRoute || (scan.routes || []).some((r) => r.path.includes(c.expectRoute.replace(/^\//, "")) || r.path === c.expectRoute);
  const leaked = (c.forbid || []).filter((w) => new RegExp(w, "i").test(report) && !JSON.stringify(scan).includes(w));
  const ok = stackHit && tableHit && routeHit && leaked.length === 0;
  if (!ok) failed++;
  reports.push(
    `${ok ? "OK" : "FAIL"} ${c.dir} stack=${scan.stackLabel} tables=${(scan.tables || []).map((t) => t.name).join(",")} routes=${(scan.routes || []).map((r) => r.method + r.path).join(" ")} leaked=${leaked.join(",") || "none"}`
  );
}

const zipTestRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pb-unzip-"));
const zipPath = path.join(zipTestRoot, "repo.zip");
const extractDest = path.join(zipTestRoot, "extracted");
const zip = new AdmZip();
zip.addFile("project/app.py", Buffer.from("from flask import Flask\napp = Flask(__name__)\n"));
zip.addFile("project/requirements.txt", Buffer.from("Flask==3.0.0\n"));
zip.writeZip(zipPath);
const root = unzipTo(zipPath, extractDest);
if (!fs.existsSync(path.join(root, "app.py"))) {
  throw new Error("ZIP extraction failed for a repo archive.");
}
console.log("ZIP extraction works without system unzip.");

const mobileRoot = path.join(os.tmpdir(), `pb-mobile-${Date.now()}`);
fs.mkdirSync(mobileRoot, { recursive: true });
fs.writeFileSync(path.join(mobileRoot, "package.json"), JSON.stringify({
  name: "mobile-app",
  dependencies: { react: "18.2.0", "react-native": "0.74.0", expo: "~51.0.0" },
  scripts: { start: "expo start" }
}, null, 2));
fs.writeFileSync(path.join(mobileRoot, "App.js"), "import React from 'react';\nexport default function App() { return null; }\n");
const mobileScan = scanProject(mobileRoot);
if (!mobileScan.ok) throw new Error(`Mobile scan unexpectedly failed: ${mobileScan.reason}`);
const mobileFrameworks = mobileScan.stack?.frameworks || mobileScan.intelligence?.frameworks || [];
if (!mobileFrameworks.some((f) => /React Native|Android/i.test(f))) {
  throw new Error(`Expected React Native or Android detection, got ${JSON.stringify(mobileFrameworks)}`);
}
console.log(`Mobile detection OK frameworks=${mobileFrameworks.join(",")}`);

console.log(reports.join("\n"));
if (failed) {
  console.error(`Failed ${failed} fixture(s)`);
  process.exit(1);
}
console.log("All fixtures produced distinct grounded packs.");
