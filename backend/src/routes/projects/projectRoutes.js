import fs from "fs";
import path from "path";
import express from "express";

export function registerProjectRoutes(app, deps) {
  const {
    getProject,
    publicProject,
    projectSummary,
    updateProject,
    loadStore,
    id,
    projectsDir,
    runScanFromGithub,
    runScanFromZip,
    runGenerate,
    patchHtml,
    buildContext,
    buildContent,
    buildDiagrams,
    mdToSimpleHtml,
  } = deps;

  app.get("/api/projects", (_req, res) => {
    const store = loadStore();
    const projects = Object.values(store)
      .map((p) => projectSummary(p))
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

    const frameworkCounts = {};
    for (const p of projects) {
      for (const framework of p.frameworks || []) {
        frameworkCounts[framework] = (frameworkCounts[framework] || 0) + 1;
      }
    }

    const topFrameworks = Object.entries(frameworkCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    res.json({
      total: projects.length,
      ready: projects.filter((p) => p.status === "ready").length,
      scanned: projects.filter((p) => ["scanned", "ready", "generating"].includes(p.status)).length,
      projects,
      topFrameworks,
    });
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { github } = req.body || {};
      if (!github || typeof github !== "string") {
        return res.status(400).json({ error: "Paste a public GitHub URL or upload a zip." });
      }
      const pid = id();
      const dir = path.join(projectsDir, pid);
      fs.mkdirSync(dir, { recursive: true });
      updateProject(pid, { id: pid, status: "scanning", github: github.trim(), dir });
      res.json({ id: pid, status: "scanning" });
      runScanFromGithub(pid, github.trim()).catch((err) => {
        updateProject(pid, { status: "failed", error: err.message || String(err) });
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Could not start scan." });
    }
  });

  app.post("/api/projects/upload", express.raw({ type: "*/*", limit: "40mb" }), async (req, res) => {
    try {
      if (!req.body || !req.body.length) {
        return res.status(400).json({ error: "Zip file is empty." });
      }
      const pid = id();
      const dir = path.join(projectsDir, pid);
      fs.mkdirSync(dir, { recursive: true });
      const zipPath = path.join(dir, "source.zip");
      fs.writeFileSync(zipPath, req.body);
      updateProject(pid, { id: pid, status: "scanning", github: "", dir });
      res.json({ id: pid, status: "scanning" });
      runScanFromZip(pid, zipPath).catch((err) => {
        updateProject(pid, { status: "failed", error: err.message || String(err) });
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Upload failed." });
    }
  });

  app.get("/api/projects/:id", (req, res) => {
    const p = getProject(req.params.id);
    if (!p) return res.status(404).json({ error: "Project not found." });
    res.json(publicProject(p));
  });

  app.post("/api/projects/:id/generate", (req, res) => {
    const p = getProject(req.params.id);
    if (!p) return res.status(404).json({ error: "Project not found." });
    if (p.status !== "scanned" && p.status !== "ready" && p.status !== "failed_generate") {
      return res.status(400).json({ error: "Scan the project first." });
    }
    const answers = req.body?.answers || {};
    updateProject(p.id, {
      status: "generating",
      answers,
      error: null,
      progress: { step: "intelligence", percent: 2, label: "Reading repository evidence" },
    });
    res.json({ id: p.id, status: "generating", progress: { step: "intelligence", percent: 2, label: "Reading repository evidence" } });
    runGenerate(p.id).catch((err) => {
      updateProject(p.id, { status: "failed_generate", error: err.message || String(err) });
    });
  });

  app.post("/api/projects/:id/section", (req, res) => {
    const p = getProject(req.params.id);
    if (!p) return res.status(404).json({ error: "Project not found." });
    if (p.status !== "ready") return res.status(400).json({ error: "Pack is not ready." });
    const section = String(req.body?.section || "");
    const text = typeof req.body?.text === "string" ? req.body.text : "";
    if (!section) return res.status(400).json({ error: "Missing section." });
    try {
      const preview = { ...(p.preview || {}) };
      if (section === "problem" || section === "future") {
        const answers = { ...(p.answers || {}) };
        if (section === "problem" && text) answers.problem = text;
        if (section === "future" && text) answers.futureWork = text;
        updateProject(p.id, { answers });
      }
      if (section === "report" && text) {
        preview.reportHtml = patchHtml(preview.reportHtml, text);
      }
      if (section === "demo" && text) {
        preview.demoHtml = patchHtml(preview.demoHtml, text);
      }
      updateProject(p.id, { preview });
      res.json({ id: p.id, preview: getProject(p.id).preview });
    } catch (err) {
      res.status(500).json({ error: err.message || "Could not update section." });
    }
  });

  app.post("/api/projects/:id/regenerate", (req, res) => {
    const p = getProject(req.params.id);
    if (!p) return res.status(404).json({ error: "Project not found." });
    if (p.status !== "ready" && p.status !== "failed_generate") {
      return res.status(400).json({ error: "Generate the pack first." });
    }
    const section = String(req.body?.section || "all");
    try {
      const ctx = buildContext(p.answers || {}, p.scan, p.github);
      const content = buildContent(ctx);
      const preview = { ...(p.preview || {}) };
      if (section === "all" || section === "report") preview.reportHtml = mdToSimpleHtml("Project Report", content.reportMd, ctx);
      if (section === "all" || section === "viva") preview.viva = content.vivaItems;
      if (section === "all" || section === "demo") preview.demoHtml = mdToSimpleHtml("Demo script", content.demo, ctx);
      if (section === "all" || section === "slides") preview.slides = content.slides;
      if (section === "all" || section === "diagrams") {
        preview.diagrams = buildDiagrams(ctx).map((d) => ({
          id: d.id,
          title: d.title,
          omitted: !!d.omitted,
          svg: d.svg.replace(/^<\?xml[^>]*>\s*/i, ""),
        }));
      }
      preview.suggestions = content.suggestions;
      updateProject(p.id, { preview, answers: p.answers });
      res.json(publicProject(getProject(p.id)));
    } catch (err) {
      res.status(500).json({ error: err.message || "Regenerate failed." });
    }
  });

  app.get("/api/projects/:id/download", (req, res) => {
    const p = getProject(req.params.id);
    if (!p) return res.status(404).json({ error: "Project not found." });
    const zipPath = path.join(p.dir, "projectbuddy-pack.zip");
    if (!fs.existsSync(zipPath)) return res.status(404).json({ error: "Pack zip missing." });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="ProjectBuddy-pack.zip"');
    fs.createReadStream(zipPath).pipe(res);
  });

  app.get("/api/projects/:id/file", (req, res) => {
    const p = getProject(req.params.id);
    if (!p) return res.status(404).json({ error: "Project not found." });
    if (p.status !== "ready") return res.status(400).json({ error: "Pack is not ready." });
    const rel = String(req.query.path || "").replace(/^\/+/, "");
    if (!rel || rel.includes("..") || path.isAbsolute(rel)) {
      return res.status(400).json({ error: "Invalid file path." });
    }
    const packRoot = path.join(p.dir, "pack");
    const aliases = {
      "01-project-report.html": "01-report/project-report.html",
      "06-presentation.html": "06-presentation/presentation.html",
    };
    const resolved = aliases[rel] || rel;
    const abs = path.join(packRoot, resolved);
    if (!abs.startsWith(packRoot) || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      return res.status(404).json({ error: "File missing." });
    }
    const download = req.query.download === "1";
    const name = path.basename(rel);
    if (download) {
      res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
    }
    const ext = path.extname(name).toLowerCase();
    const types = { ".html": "text/html", ".md": "text/markdown", ".svg": "image/svg+xml", ".txt": "text/plain", ".mmd": "text/plain" };
    res.setHeader("Content-Type", types[ext] || "application/octet-stream");
    fs.createReadStream(abs).pipe(res);
  });
}
