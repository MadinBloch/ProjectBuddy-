import express from "express";
import session from "express-session";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { getRuntimeConfig } from "./config.js";
import prisma from "./db/prisma.js";
import { createHealthRouter } from "./routes/health.js";
import { registerAuthRoutes } from "./routes/auth/authRoutes.js";
import { registerProjectRoutes } from "./routes/projects/projectRoutes.js";
import { upsertUserFromProvider } from "./services/authService.js";
import { ensureDataDirectories, loadStore, saveStore } from "./services/projectStore.js";
import { unzipTo, fetchGithubZip, scanProject } from "./modules/scan/index.js";
import { generatePack, STEPS } from "./modules/generation/index.js";
import { buildContext, buildContent } from "./modules/content/index.js";
import { buildDiagrams } from "./modules/diagrams/index.js";

const {
  rootDir: ROOT,
  dataDir: DATA,
  projectsDir: PROJECTS,
  tmpDir: TMP,
  storeFile: STORE,
  frontendUrl: FRONTEND_URL,
  githubClientId: GITHUB_CLIENT_ID,
  githubClientSecret: GITHUB_CLIENT_SECRET,
  githubCallbackUrl: GITHUB_CALLBACK_URL,
  sessionSecret: SESSION_SECRET,
} = getRuntimeConfig();

ensureDataDirectories();

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use((req, res, next) => {
  const origin = req.headers.origin || FRONTEND_URL || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.end();
  next();
});

function id() {
  return "pb_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function buildGithubAuthorizeUrl() {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: "read:user user:email repo",
    allow_signup: "true",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

async function exchangeGithubCode(code) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "ProjectBuddy",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_CALLBACK_URL,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || "GitHub OAuth exchange failed.");
  }

  return data.access_token;
}

async function fetchGithubProfile(token) {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "ProjectBuddy",
    },
  });

  if (!res.ok) {
    throw new Error("Could not load GitHub profile.");
  }

  return res.json();
}

async function fetchGithubUserRepos(token) {
  const res = await fetch("https://api.github.com/user/repos?affiliation=owner,collaborator&sort=updated&per_page=100", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "ProjectBuddy",
    },
  });

  if (!res.ok) {
    throw new Error("Could not load your GitHub repositories.");
  }

  const repos = await res.json();
  return (Array.isArray(repos) ? repos : []).map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: !!repo.private,
    html_url: repo.html_url,
    default_branch: repo.default_branch || "main",
    description: repo.description || "",
    updated_at: repo.updated_at || null,
  }));
}

function serialiseSessionUser(sessionUser) {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    avatarUrl: sessionUser.avatarUrl,
    provider: sessionUser.provider,
  };
}

function getProject(pid) {
  const store = loadStore();
  const p = store[pid];
  if (!p) return null;
  return p;
}

const port = Number(process.env.API_PORT || 3001);

function publicProject(p) {
  if (!p) return null;
  return {
    id: p.id,
    status: p.status,
    error: p.error || null,
    scan: p.scan || null,
    answers: p.answers || null,
    preview: p.preview || null,
    github: p.github || "",
    files: p.files || [],
    packFiles: p.packFiles || [],
    diagrams: p.diagrams || [],
    progress: p.progress || null,
    steps: STEPS,
    createdAt: p.createdAt || null,
    updatedAt: p.updatedAt || null,
  };
}

function projectSummary(p) {
  if (!p) return null;
  return {
    id: p.id,
    status: p.status,
    error: p.error || null,
    github: p.github || "",
    name: p.scan?.projectName || p.scan?.suggestedTitle || p.github || "Untitled project",
    stackLabel: p.scan?.stackLabel || "",
    frameworks: p.scan?.stack?.frameworks || p.scan?.intelligence?.frameworks || [],
    databases: p.scan?.stack?.database || p.scan?.databases || [],
    fileCount: p.scan?.fileCount || 0,
    routeCount: p.scan?.routes?.length || 0,
    tableCount: p.scan?.tables?.length || 0,
    createdAt: p.createdAt || null,
    updatedAt: p.updatedAt || null,
  };
}

function updateProject(pid, patch) {
  const store = loadStore();
  const current = store[pid] || {};
  const createdAt = current.createdAt || patch.createdAt || new Date().toISOString();
  store[pid] = {
    ...current,
    ...patch,
    createdAt,
    updatedAt: new Date().toISOString(),
  };
  saveStore(store);
  return store[pid];
}

registerProjectRoutes(app, {
  getProject,
  publicProject,
  projectSummary,
  updateProject,
  loadStore,
  id,
  projectsDir: PROJECTS,
  runScanFromGithub,
  runScanFromZip,
  runGenerate,
  patchHtml,
  buildContext,
  buildContent,
  buildDiagrams,
  mdToSimpleHtml,
});

const healthRouter = createHealthRouter();
app.get("/api/health", healthRouter.health);
app.get("/api/db-status", healthRouter.dbStatus);

registerAuthRoutes(app, {
  buildGithubAuthorizeUrl,
  exchangeGithubCode,
  fetchGithubProfile,
  fetchGithubUserRepos,
  serialiseSessionUser,
  upsertUserFromProvider,
  frontendUrl: FRONTEND_URL,
  githubClientId: GITHUB_CLIENT_ID,
  githubClientSecret: GITHUB_CLIENT_SECRET,
});

app.use(express.static(path.join(ROOT, "frontend", "dist")));
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  const index = path.join(ROOT, "frontend", "dist", "index.html");
  if (fs.existsSync(index)) return res.sendFile(index);
  res.status(404).send("Frontend is not built yet.");
});

async function runScanFromGithub(pid, github) {
  const p = getProject(pid);
  const zipPath = path.join(p.dir, "source.zip");
  const extract = path.join(p.dir, "src");
  await fetchGithubZip(github, zipPath);
  const root = unzipTo(zipPath, extract);
  const scan = scanProject(root);
  if (!scan.ok) {
    updateProject(pid, { status: "rejected", error: scan.reason, scan });
    return;
  }
  updateProject(pid, { status: "scanned", scan });
}

async function runScanFromZip(pid, zipPath) {
  const p = getProject(pid);
  const extract = path.join(p.dir, "src");
  const root = unzipTo(zipPath, extract);
  const scan = scanProject(root);
  if (!scan.ok) {
    updateProject(pid, { status: "rejected", error: scan.reason, scan });
    return;
  }
  updateProject(pid, { status: "scanned", scan });
}

async function runGenerate(pid) {
  const p = getProject(pid);
  const result = await generatePack({
    projectDir: p.dir,
    answers: p.answers || {},
    scan: p.scan,
    github: p.github,
    onProgress: (progress) => updateProject(pid, { progress }),
  });
  const packDir = path.join(p.dir, "pack");
  const zipPath = path.join(p.dir, "projectbuddy-pack.zip");
  try {
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  } catch {
    /* ignore */
  }
  execZip(packDir, zipPath);
  updateProject(pid, {
    status: "ready",
    preview: result.preview,
    files: result.files,
    packFiles: result.packFiles,
    diagrams: result.diagrams,
    progress: { step: "pack", percent: 100, label: "Pack ready" },
  });
}

function patchHtml(full, text) {
  const safe = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\n/g, "<br/>");
  if (!full) return `<p>${safe}</p>`;
  return String(full).replace(/<body[^>]*>[\s\S]*<\/body>/i, `<body><p>${safe}</p></body>`);
}

function mdToSimpleHtml(title, md, ctx) {
  const body = String(md)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "<br/><br/>");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${body}<p>Prepared with ProjectBuddy for ${ctx.student}</p></body></html>`;
}

function execZip(packDir, zipPath) {
  const zip = new AdmZip();
  zip.addLocalFolder(packDir, "");
  zip.writeZip(zipPath);
}

app.listen(port, "0.0.0.0", () => {
  console.log(`ProjectBuddy API on ${port}`);
});
