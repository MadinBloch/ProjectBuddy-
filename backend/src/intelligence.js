import path from "path";
import { unique, uniqueBy, toSnake, capitalize, posix, readJsonSafe, fileNamed, fact, redactSecrets, envKeysOnly, snippet } from "./util.js";

const INTERNAL_TABLES = new Set([
  "migrations",
  "failed_jobs",
  "sessions",
  "cache",
  "jobs",
  "password_reset_tokens",
  "personal_access_tokens",
]);

export function buildIntelligence(scanInput) {
  const { files, texts, rootName } = scanInput;
  const names = files.map((f) => posix(f.rel));
  const evidence = [];
  const warnings = [];

  const pkgFiles = texts.filter((t) => path.basename(posix(t.rel)) === "package.json").map((t) => ({ ...t, json: readJsonSafe(t.content) }));
  const composerFile = fileNamed(texts, "composer.json");
  const composer = composerFile ? readJsonSafe(composerFile.content) : null;
  const reqFile = texts.find((t) => posix(t.rel).endsWith("requirements.txt"));
  const pomFile = fileNamed(texts, "pom.xml");
  const gradleFile = texts.find((t) => /build\.gradle/.test(posix(t.rel)));
  const prismaFile = texts.find((t) => posix(t.rel).endsWith("schema.prisma"));
  const readmeFile = texts.find((t) => /^readme/i.test(path.basename(posix(t.rel))));
  const dockerFile = texts.find((t) => /dockerfile/i.test(path.basename(posix(t.rel))) || /docker-compose/i.test(path.basename(posix(t.rel))));
  const envExample = texts.find((t) => /\.env/.test(path.basename(posix(t.rel))));

  const languages = detectLanguages(names);
  const { frameworks, libraries, frontend, backend, tools, usedDeps } = detectFrameworks({ names, texts, pkgFiles, composer, composerFile, reqFile, pomFile, gradleFile });
  const databases = detectDatabases({ texts, names, pkgFiles, composer, reqFile, envExample, prismaFile, usedDeps });
  const tables = detectTables(texts);
  const relationships = detectRelationships(tables, texts);
  const models = detectModels(texts);
  const controllers = detectControllers(texts);
  const routes = detectRoutes(texts);
  const apiEndpoints = routes.filter((r) => /api|json|rest/i.test(r.path) || r.path.startsWith("/api"));
  const pages = detectPages(texts, names);
  const components = detectComponents(texts, names);
  const middleware = detectMiddleware(texts, names);
  const services = detectServices(texts, names);
  const authentication = detectAuth({ texts, names, usedDeps, routes, middleware, libraries });
  const authorization = detectRoles(texts);
  const crud = detectCrud(routes, controllers, texts);
  const modules = detectModules({ models, routes, tables, pages, controllers });
  const features = detectFeatures({ authentication, routes, tables, modules, crud, pages });
  const tests = detectTests(names, texts);
  const envKeys = envExample ? envKeysOnly(envExample.content) : [];
  const secretsDetected = !!(envExample || names.some((n) => path.basename(n) === ".env"));
  if (secretsDetected) warnings.push("Sensitive configuration detected. Values are not stored.");

  const scripts = {};
  for (const p of pkgFiles) {
    if (p.json?.scripts) Object.assign(scripts, p.json.scripts);
  }

  const fileStructure = summarizeTree(names);
  const projectName = guessProjectName({ rootName, pkgFiles, composer, readmeFile, composerFile });
  const deploymentHints = unique([
    dockerFile ? "Docker" : null,
    names.some((n) => n.includes(".github/workflows")) ? "GitHub Actions" : null,
    names.some((n) => /nginx|Procfile|vercel\.json|netlify/i.test(n)) ? "Hosting config present" : null,
  ]);

  pushFacts(evidence, [
    fact("projectName", projectName.value, projectName.evidence, projectName.confidence),
    ...frameworks.map((f) => fact("framework", f.name, f.evidence, f.confidence)),
    ...databases.map((d) => fact("database", d.name, d.evidence, d.confidence)),
    ...tables.map((t) => fact("table", t.name, t.evidence, 0.85)),
    ...routes.slice(0, 20).map((r) => fact("route", `${r.method} ${r.path}`, [r.file], 0.9)),
    authentication.method !== "Not detected in source"
      ? fact("authentication", authentication.method, authentication.evidence, authentication.confidence)
      : null,
  ]);

  const confidence = scoreConfidence({ frameworks, databases, tables, routes, models, fileCount: files.length });

  if (files.length < 2) {
    return { ok: false, reason: "This folder does not look like a software project. Add source code, then try again.", fileCount: files.length };
  }
  if (!frameworks.length && !languages.length && !tables.length && !routes.length) {
    return { ok: false, reason: "No languages, frameworks, tables or routes were detected.", fileCount: files.length };
  }

  const intelligence = {
    ok: true,
    projectName: projectName.value,
    detectedLanguages: languages,
    frameworks: frameworks.map((f) => f.name),
    libraries: libraries.map((l) => l.name),
    frontend: frontend.map((f) => f.name),
    backend: backend.map((f) => f.name),
    databases: databases.map((d) => d.name),
    databaseTables: tables.map((t) => ({ name: t.name, columns: t.columns, evidence: t.evidence })),
    databaseColumns: tables.flatMap((t) => t.columns.map((c) => ({ table: t.name, ...c }))),
    relationships,
    models,
    controllers,
    routes,
    apiEndpoints,
    authentication,
    authorization,
    modules,
    features,
    pages,
    components,
    services,
    middleware,
    crud,
    environmentVariables: envKeys,
    secretsDetected,
    configuration: {
      hasEnvExample: !!envExample,
      envFile: envExample ? posix(envExample.rel) : null,
      docker: !!dockerFile,
    },
    fileStructure,
    dependencies: usedDeps,
    scripts,
    deploymentHints,
    tests,
    documentation: {
      hasReadme: !!readmeFile,
      readmeFile: readmeFile ? posix(readmeFile.rel) : null,
      readmeExcerpt: readmeFile ? snippet(redactSecrets(readmeFile.content), 400) : null,
    },
    screenshots: names.filter((n) => /\.(png|jpe?g|webp|gif)$/i.test(n)).slice(0, 12),
    evidence,
    warnings,
    confidence,
    fileCount: files.length,
    scannedFiles: texts.length,
    topFiles: names.slice(0, 40),
  };

  intelligence.health = buildHealth(intelligence);
  intelligence.stackLabel = unique([...intelligence.frontend, ...intelligence.backend, ...intelligence.frameworks, ...intelligence.databases]).join(" · ") || intelligence.detectedLanguages.join(" · ") || "Unknown";
  intelligence.suggestedTitle = intelligence.projectName;
  intelligence.suggestedProblem = suggestProblem(intelligence);
  intelligence.suggestedFuture = suggestFuture(intelligence);

  return intelligence;
}

function detectLanguages(names) {
  const map = { ".php": "PHP", ".js": "JavaScript", ".jsx": "JavaScript", ".ts": "TypeScript", ".tsx": "TypeScript", ".py": "Python", ".java": "Java", ".vue": "JavaScript", ".jsp": "Java", ".cs": "C#" };
  const counts = {};
  for (const n of names) {
    const lang = map[path.extname(n).toLowerCase()];
    if (lang) counts[lang] = (counts[lang] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
}

function detectFrameworks({ names, texts, pkgFiles, composer, composerFile, reqFile, pomFile, gradleFile }) {
  const frameworks = [];
  const libraries = [];
  const frontend = [];
  const backend = [];
  const tools = [];
  const usedDeps = [];

  const blob = texts.map((t) => t.content).join("\n").slice(0, 400000);

  function add(list, name, evidence, confidence, extraList) {
    if (list.some((x) => x.name === name)) return;
    const item = { name, evidence: unique(evidence), confidence };
    list.push(item);
    extraList?.push(item);
  }

  for (const p of pkgFiles) {
    const deps = { ...(p.json?.dependencies || {}), ...(p.json?.devDependencies || {}) };
    usedDeps.push(...Object.keys(deps).slice(0, 40));
    const loc = posix(p.rel);
    if (deps.react || deps["react-dom"]) add(frameworks, "React", [loc, texts.find((t) => /\.(jsx|tsx)$/.test(t.rel))?.rel].filter(Boolean), 0.95, frontend);
    if (deps["react-native"] || deps.expo || /react-native/i.test(blob) || /expo/i.test(blob)) {
      add(frameworks, "React Native", [loc, texts.find((t) => /react-native|expo/i.test(t.content))?.rel].filter(Boolean), 0.95, frontend);
    }
    if (deps.next) add(frameworks, "Next.js", [loc], 0.95, frontend);
    if (deps.vue) add(frameworks, "Vue", [loc], 0.95, frontend);
    if (deps["@angular/core"]) add(frameworks, "Angular", [loc], 0.95, frontend);
    if (deps.express && (blob.includes("express()") || blob.includes("from \"express\"") || blob.includes("require(\"express\")") || blob.includes("require('express')"))) {
      add(frameworks, "Express", [loc, texts.find((t) => /express\(/.test(t.content))?.rel].filter(Boolean), 0.93, backend);
    } else if (deps.express) {
      add(libraries, "express (declared)", [loc], 0.5);
    }
    if (names.some((n) => /pubspec\.ya?ml$/i.test(n)) || /sdk:\s*flutter/i.test(blob) || /flutter:/i.test(blob)) {
      add(frameworks, "Flutter", [loc, names.find((n) => /pubspec\.ya?ml$/i.test(n))].filter(Boolean), 0.95, frontend);
    }
    if (names.some((n) => /AndroidManifest\.xml$/i.test(n) || /android\//i.test(n) || /build\.gradle/i.test(n)) || /com\.android\.application|androidx\./i.test(blob)) {
      add(frameworks, "Android", [loc, names.find((n) => /AndroidManifest\.xml$/i.test(n) || /build\.gradle/i.test(n))].filter(Boolean), 0.8, frontend);
    }
    if (deps.vite) add(tools, "Vite", [loc], 0.8);
    if (deps.jsonwebtoken || deps.jose) add(libraries, "jsonwebtoken", [loc], 0.8);
    if (deps.mongoose) add(libraries, "mongoose", [loc], 0.85);
    if (deps.mysql2 || deps.mysql || deps.pg) add(libraries, deps.mysql2 ? "mysql2" : deps.pg ? "pg" : "mysql", [loc], 0.8);
    if (deps.prisma || deps["@prisma/client"]) add(libraries, "Prisma", [loc], 0.85);
    if (deps.sequelize) add(libraries, "Sequelize", [loc], 0.8);
    if (Object.keys(deps).length && !frontend.length && !backend.length) add(frameworks, "Node.js", [loc], 0.7, backend);
  }

  if (composer) {
    const loc = posix(composerFile.rel);
    usedDeps.push(...Object.keys(composer.require || {}));
    if (composer.require?.["laravel/framework"] || names.some((n) => n.endsWith("artisan"))) {
      add(frameworks, "Laravel", [loc, names.find((n) => n.includes("artisan"))].filter(Boolean), 0.96, backend);
    } else {
      add(frameworks, "PHP", [loc], 0.75, backend);
    }
  }

  if (reqFile) {
    const req = reqFile.content.toLowerCase();
    const loc = posix(reqFile.rel);
    if (req.includes("django") || names.some((n) => n.endsWith("manage.py"))) add(frameworks, "Django", [loc], 0.93, backend);
    else if (req.includes("flask") || blob.includes("Flask(")) add(frameworks, "Flask", [loc, texts.find((t) => /Flask\(/.test(t.content))?.rel].filter(Boolean), 0.93, backend);
    else add(frameworks, "Python", [loc], 0.7, backend);
  }

  if (pomFile || gradleFile) {
    const loc = posix((pomFile || gradleFile).rel);
    if (/spring/i.test((pomFile || gradleFile).content) || /springframework/i.test(blob)) add(frameworks, "Spring Boot", [loc], 0.92, backend);
    else add(frameworks, "Java", [loc], 0.75, backend);
  }

  if (names.some((n) => n.endsWith(".jsp"))) add(frameworks, "JSP/Servlet", [names.find((n) => n.endsWith(".jsp"))], 0.8, backend);
  if (!frameworks.length && names.some((n) => n.endsWith(".php"))) add(frameworks, "PHP", [names.find((n) => n.endsWith(".php"))], 0.6, backend);

  return { frameworks, libraries, frontend, backend, tools, usedDeps: unique(usedDeps).slice(0, 60) };
}

function detectDatabases({ texts, names, pkgFiles, composer, reqFile, envExample, prismaFile, usedDeps }) {
  const found = [];
  function add(name, evidence, confidence) {
    if (found.some((d) => d.name === name)) return;
    found.push({ name, evidence: unique(evidence), confidence });
  }
  const blob = texts.map((t) => t.content.toLowerCase()).join("\n").slice(0, 300000);
  const env = envExample ? envExample.content.toLowerCase() : "";
  if (/\bmysql\b|pdo_mysql|mysqli|mysql2/.test(blob + env) || usedDeps.includes("mysql2") || usedDeps.includes("mysql")) {
    add("MySQL", [texts.find((t) => /mysql/i.test(t.content))?.rel, envExample && /mysql/i.test(envExample.content) ? posix(envExample.rel) : null].filter(Boolean), 0.88);
  }
  if (/postgres|pgsql|\bpg\b/.test(blob + env) || usedDeps.includes("pg")) add("PostgreSQL", [texts.find((t) => /postgres|pgsql/i.test(t.content))?.rel].filter(Boolean), 0.85);
  if (/mongodb|mongoose/.test(blob) || usedDeps.includes("mongoose")) add("MongoDB", [texts.find((t) => /mongoose|mongodb/i.test(t.content))?.rel].filter(Boolean), 0.9);
  if (/sqlite/.test(blob + env) || names.some((n) => n.endsWith(".sqlite") || n.endsWith(".db"))) add("SQLite", [names.find((n) => /\.sqlite|\.db$|sqlite/i.test(n))].filter(Boolean), 0.86);
  if (prismaFile && /datasource/i.test(prismaFile.content)) {
    const m = prismaFile.content.match(/provider\s*=\s*"(\w+)"/);
    if (m) add(m[1] === "mysql" ? "MySQL" : m[1] === "postgresql" ? "PostgreSQL" : m[1] === "sqlite" ? "SQLite" : m[1], [posix(prismaFile.rel)], 0.92);
  }
  return found;
}

function detectTables(texts) {
  const tables = new Map();
  function ensure(name, evidence) {
    const key = String(name).toLowerCase();
    if (!key || INTERNAL_TABLES.has(key)) return tables.get(key);
    if (!tables.has(key)) tables.set(key, { name: key, columns: [], evidence: [] });
    const t = tables.get(key);
    if (evidence) t.evidence = unique(t.evidence.concat(evidence));
    return t;
  }
  function addCol(table, name, type) {
    if (!table || !name) return;
    if (!table.columns.some((c) => c.name === name)) table.columns.push({ name, type: type || "string" });
  }

  for (const t of texts) {
    const rel = posix(t.rel);
    const c = t.content;
    let m;
    const schema = [...c.matchAll(/Schema::create\(\s*['"](\w+)['"]/g)];
    for (let i = 0; i < schema.length; i++) {
      const table = ensure(schema[i][1], [rel]);
      const end = i + 1 < schema.length ? schema[i + 1].index : schema[i].index + 2000;
      const body = c.slice(schema[i].index, end);
      for (const col of body.matchAll(/\$table->(\w+)\(\s*['"](\w+)['"]/g)) addCol(table, col[2], col[1]);
    }
    for (const x of c.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?[`"'[]?(\w+)/gi)) ensure(x[1], [rel]);
    for (const x of c.matchAll(/model\s+(\w+)\s*\{/g)) {
      if (!rel.endsWith(".prisma")) continue;
      const table = ensure(toSnake(x[1]), [rel]);
      const body = c.slice(x.index, x.index + 800);
      for (const col of body.matchAll(/^\s+(\w+)\s+(\w+)/gm)) {
        if (["model", "@@"].some((k) => col[1].startsWith(k))) continue;
        addCol(table, col[1], col[2]);
      }
    }
    for (const x of c.matchAll(/mongoose\.model\(\s*['"](\w+)['"]/g)) ensure(toSnake(x[1]), [rel]);
    for (const x of c.matchAll(/sequelize\.define\(\s*['"](\w+)['"]/gi)) ensure(toSnake(x[1]), [rel]);
    if (/@Entity|@Table/.test(c)) {
      const name = (c.match(/@Table\(name\s*=\s*"(\w+)"/) || c.match(/class\s+(\w+)/) || [])[1];
      if (name) ensure(toSnake(name), [rel]);
    }
    if (/from django\.db import models|models\.Model/.test(c)) {
      for (const x of c.matchAll(/class\s+(\w+)\s*\(\s*models\.Model\s*\)/g)) {
        const table = ensure(toSnake(x[1]), [rel]);
        const body = c.slice(x.index, x.index + 600);
        for (const col of body.matchAll(/^\s+(\w+)\s*=\s*models\.(\w+)/gm)) addCol(table, col[1], col[2]);
      }
    }
  }
  return [...tables.values()].filter((t) => !INTERNAL_TABLES.has(t.name)).slice(0, 30);
}

function detectRelationships(tables, texts) {
  const rels = [];
  const names = new Set(tables.map((t) => t.name));
  for (const t of tables) {
    for (const col of t.columns) {
      const m = col.name.match(/^(\w+)_id$/);
      if (m && (names.has(toSnake(m[1] + "s")) || names.has(m[1]))) {
        const target = names.has(m[1]) ? m[1] : toSnake(m[1] + "s");
        if (names.has(target) && target !== t.name) rels.push({ from: t.name, to: target, type: "belongsTo", via: col.name });
      }
      if (col.type === "foreignId" && m) {
        const target = names.has(m[1]) ? m[1] : m[1] + "s";
        if (names.has(target)) rels.push({ from: t.name, to: target, type: "belongsTo", via: col.name });
      }
    }
  }
  return uniqueBy(rels, (r) => r.from + "->" + r.to + r.via);
}

function detectModels(texts) {
  const models = [];
  for (const t of texts) {
    const rel = posix(t.rel);
    if (/Models\/(\w+)\.php$/.test(rel) || /models\/(\w+)\.(py|js|ts)$/i.test(rel)) {
      const name = path.basename(rel).replace(/\.(php|py|js|ts)$/, "");
      if (name.toLowerCase() !== "model") models.push({ name, file: rel });
    }
    for (const m of t.content.matchAll(/class\s+(\w+)\s+extends\s+Model/g)) models.push({ name: m[1], file: rel });
    for (const m of t.content.matchAll(/class\s+(\w+)\s+extends\s+Authenticatable/g)) models.push({ name: m[1], file: rel });
  }
  return uniqueBy(models, (m) => m.name).slice(0, 40);
}

function detectControllers(texts) {
  const list = [];
  for (const t of texts) {
    const rel = posix(t.rel);
    if (/controller/i.test(rel) || /Controller/.test(path.basename(rel))) {
      const name = path.basename(rel).replace(/\.(php|js|ts|py|java)$/, "");
      list.push({ name, file: rel });
    }
  }
  return uniqueBy(list, (c) => c.file).slice(0, 40);
}

function detectRoutes(texts) {
  const routes = [];
  for (const t of texts) {
    const rel = posix(t.rel);
    const c = t.content;
    for (const r of c.matchAll(/Route::(get|post|put|patch|delete|resource)\(\s*['"]([^'"]+)['"]/gi)) {
      routes.push({ method: r[1].toUpperCase(), path: "/" + r[2].replace(/^\//, ""), file: rel });
    }
    for (const r of c.matchAll(/\b(app|router)\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/gi)) {
      routes.push({ method: r[2].toUpperCase(), path: r[3], file: rel });
    }
    for (const r of c.matchAll(/@app\.route\(\s*['"]([^'"]+)['"](?:[^)]*methods\s*=\s*\[([^\]]+)\])?/gi)) {
      routes.push({ method: (r[2] || "GET").replace(/['"\s]/g, "").split(",")[0].toUpperCase(), path: r[1], file: rel });
    }
    for (const r of c.matchAll(/@(Get|Post|Put|Delete|Patch|Request)Mapping\(\s*(?:value\s*=\s*)?['"]([^'"]+)['"]/g)) {
      routes.push({ method: r[1].toUpperCase().replace("REQUEST", "GET"), path: r[2], file: rel });
    }
    for (const r of c.matchAll(/path\(\s*['"]([^'"]+)['"]\s*,\s*([\w.]+)/g)) {
      routes.push({ method: "GET", path: "/" + r[1].replace(/^\//, ""), file: rel });
    }
  }
  return uniqueBy(routes, (r) => r.method + " " + r.path).slice(0, 80);
}

function detectPages(texts, names) {
  const pages = [];
  for (const n of names) {
    if (/pages?\//i.test(n) && /\.(jsx|tsx|vue|php|jsp|html)$/.test(n)) pages.push(posix(n));
    if (/resources\/views\/.+\.blade\.php$/.test(n)) pages.push(posix(n));
  }
  for (const t of texts) {
    if (/createBrowserRouter|Route\s+path=|path:\s*['"]\//.test(t.content)) {
      for (const m of t.content.matchAll(/path\s*[:=]\s*['"]([^'"]+)['"]/g)) {
        if (m[1].startsWith("/")) pages.push(m[1]);
      }
    }
  }
  return unique(pages).slice(0, 30);
}

function detectComponents(texts, names) {
  return unique(
    names.filter((n) => /components?\//i.test(n) && /\.(jsx|tsx|vue|js)$/.test(n)).map(posix)
  ).slice(0, 40);
}

function detectMiddleware(texts, names) {
  const list = [];
  for (const n of names) {
    if (/middleware/i.test(n)) list.push({ name: path.basename(n), file: posix(n) });
  }
  return uniqueBy(list, (m) => m.file).slice(0, 20);
}

function detectServices(texts, names) {
  return unique(names.filter((n) => /services?\//i.test(n)).map(posix)).slice(0, 20);
}

function detectAuth({ texts, names, usedDeps, routes, middleware, libraries }) {
  const evidence = [];
  let method = "Not detected in source";
  let confidence = 0;
  const blob = texts.map((t) => posix(t.rel) + "\n" + t.content).join("\n");
  if (usedDeps.includes("jsonwebtoken") || /jsonwebtoken|jwt\.sign|Authorization:\s*Bearer/i.test(blob)) {
    method = "JWT";
    confidence = 0.9;
    const f = texts.find((t) => /jsonwebtoken|jwt\.sign/i.test(t.content));
    if (f) evidence.push(posix(f.rel));
    if (usedDeps.includes("jsonwebtoken")) evidence.push("package.json -> jsonwebtoken");
  }
  if (/Sanctum|Passport|session\(|Session::/i.test(blob) && method === "Not detected in source") {
    method = /Sanctum/.test(blob) ? "Laravel Sanctum" : /Passport/.test(blob) ? "Laravel Passport" : "Session";
    confidence = 0.85;
    const f = texts.find((t) => /Sanctum|Passport|session\(/i.test(t.content));
    if (f) evidence.push(posix(f.rel));
  }
  const login = routes.find((r) => /login|signin|auth/i.test(r.path));
  if (login) evidence.push(`${login.file} (${login.method} ${login.path})`);
  const mw = middleware.find((m) => /auth/i.test(m.name + m.file));
  if (mw) evidence.push(mw.file);
  if (method === "Not detected in source" && login) {
    method = "Login route present; method not detected in source";
    confidence = 0.55;
  }
  return { method, evidence: unique(evidence), confidence, loginRoute: login || null };
}

function detectRoles(texts) {
  const roles = [];
  const blob = texts.map((t) => t.content).join("\n");
  for (const role of ["admin", "teacher", "student", "user", "staff", "doctor", "patient"]) {
    if (new RegExp(`['"]${role}['"]|role\\s*=\\s*['"]${role}['"]|is_${role}|is${capitalize(role)}`, "i").test(blob)) {
      roles.push(role);
    }
  }
  return unique(roles);
}

function detectCrud(routes, controllers, texts) {
  const ops = { create: [], read: [], update: [], destroy: [] };
  for (const r of routes) {
    if (r.method === "POST") ops.create.push(r);
    if (r.method === "GET") ops.read.push(r);
    if (r.method === "PUT" || r.method === "PATCH") ops.update.push(r);
    if (r.method === "DELETE") ops.destroy.push(r);
  }
  return {
    create: ops.create.length,
    read: ops.read.length,
    update: ops.update.length,
    destroy: ops.destroy.length,
    examples: {
      create: ops.create[0] || null,
      read: ops.read[0] || null,
      update: ops.update[0] || null,
      destroy: ops.destroy[0] || null,
    },
  };
}

function detectModules({ models, routes, tables, pages, controllers }) {
  const mods = [];
  const add = (name, evidence) => {
    const n = capitalize(name.replace(/s$/, "")).replace(/ Module$/, "") + " module";
    if (!mods.some((m) => m.name === n)) mods.push({ name: n, evidence: unique(evidence).slice(0, 5) });
  };
  for (const m of models) add(m.name, [m.file]);
  for (const t of tables) add(t.name, t.evidence);
  for (const r of routes) {
    const part = r.path.split("/").filter((p) => p && !p.startsWith("{") && !p.startsWith(":") && p !== "api")[0];
    if (part) add(part.replace(/-/g, " "), [r.file + " " + r.method + " " + r.path]);
  }
  for (const c of controllers) add(c.name.replace(/Controller$/i, ""), [c.file]);
  return mods.slice(0, 10);
}

function detectFeatures({ authentication, routes, tables, modules, crud, pages }) {
  const features = [];
  if (authentication.method !== "Not detected in source") features.push({ name: "Authentication (" + authentication.method + ")", evidence: authentication.evidence });
  if (crud.create) features.push({ name: "Create records", evidence: crud.examples.create ? [crud.examples.create.file] : [] });
  if (crud.update) features.push({ name: "Update records", evidence: crud.examples.update ? [crud.examples.update.file] : [] });
  if (crud.destroy) features.push({ name: "Delete records", evidence: crud.examples.destroy ? [crud.examples.destroy.file] : [] });
  if (pages.length) features.push({ name: "User interface screens", evidence: pages.slice(0, 3) });
  if (tables.length) features.push({ name: "Persistent data storage", evidence: tables[0].evidence });
  for (const m of modules.slice(0, 6)) features.push({ name: m.name, evidence: m.evidence });
  return uniqueBy(features, (f) => f.name).slice(0, 12);
}

function detectTests(names, texts) {
  const files = names.filter((n) => /test|spec|phpunit|pytest/i.test(n));
  return { hasTests: files.length > 0, files: files.slice(0, 15) };
}

function guessProjectName({ rootName, pkgFiles, composer, readmeFile, composerFile }) {
  if (pkgFiles[0]?.json?.name && pkgFiles[0].json.name !== "undefined") {
    return { value: capitalize(pkgFiles[0].json.name.replace(/[-_]/g, " ")), evidence: [posix(pkgFiles[0].rel)], confidence: 0.8 };
  }
  if (readmeFile) {
    const m = readmeFile.content.match(/^#\s+(.+)$/m);
    if (m) return { value: m[1].trim().slice(0, 80), evidence: [posix(readmeFile.rel)], confidence: 0.75 };
  }
  if (composer?.name) return { value: capitalize(composer.name.split("/").pop()), evidence: [posix(composerFile.rel)], confidence: 0.7 };
  if (rootName) return { value: capitalize(rootName.replace(/-main$|-master$/, "")), evidence: ["archive folder name"], confidence: 0.45 };
  return { value: "Student Project", evidence: [], confidence: 0.2 };
}

function summarizeTree(names) {
  const tops = unique(names.map((n) => n.split("/")[0])).slice(0, 20);
  return { topLevel: tops, sample: names.slice(0, 40) };
}

function pushFacts(evidence, facts) {
  for (const f of facts) if (f && f.value) evidence.push(f);
}

function scoreConfidence({ frameworks, databases, tables, routes, models, fileCount }) {
  let s = 0.2;
  if (frameworks.length) s += 0.2;
  if (databases.length) s += 0.15;
  if (tables.length) s += 0.15;
  if (routes.length) s += 0.15;
  if (models.length) s += 0.1;
  if (fileCount > 10) s += 0.1;
  return Math.min(0.98, Number(s.toFixed(2)));
}

function buildHealth(intel) {
  const item = (ok, label, detail) => ({ ok, label, detail });
  return {
    technology: [
      ...intel.frameworks.map((f) => item(true, f, "Detected in repository")),
      ...intel.databases.map((d) => item(true, d, "Detected in repository")),
      ...(!intel.frameworks.length && !intel.databases.length ? [item(false, "Stack", "Not detected in source")] : []),
    ],
    architecture: [
      item(intel.frontend.length > 0, "Frontend", intel.frontend.join(", ") || "Not detected in source"),
      item(intel.backend.length > 0, "Backend", intel.backend.join(", ") || "Not detected in source"),
      item(intel.routes.length > 0, "Routes", intel.routes.length ? intel.routes.length + " routes" : "Not detected in source"),
      item(intel.apiEndpoints.length > 0, "API routes", intel.apiEndpoints.length ? intel.apiEndpoints.length + " API routes" : "Not detected in source"),
    ],
    database: [
      item(intel.databaseTables.length > 0, "Tables", intel.databaseTables.length ? intel.databaseTables.length + " tables" : "Not detected in source"),
      item(intel.relationships.length > 0, "Relationships", intel.relationships.length ? intel.relationships.length + " relationships" : "Not detected in source"),
    ],
    documentation: [item(intel.documentation.hasReadme, "README", intel.documentation.hasReadme ? intel.documentation.readmeFile : "README incomplete or missing")],
    testing: [item(intel.tests.hasTests, "Tests", intel.tests.hasTests ? intel.tests.files.length + " test files" : "No tests detected")],
    security: [
      item(!intel.secretsDetected, "Secrets", intel.secretsDetected ? "Sensitive configuration detected" : "No env file detected"),
      item(intel.authentication.method !== "Not detected in source", "Authentication", intel.authentication.method),
    ],
  };
}

function suggestProblem(intel) {
  const mods = intel.modules.map((m) => m.name.replace(/ module$/i, "")).slice(0, 3);
  const db = intel.databases[0];
  const stack = intel.stackLabel;
  if (!mods.length && !db) {
    return `This repository implements a ${stack || "software"} project. The exact business problem is not fully described in source; confirm with the student.`;
  }
  return `Manual or disconnected handling of ${mods.join(", ").toLowerCase() || "records"} is replaced by this ${stack} application${db ? ", which stores data in " + db : ""}.`;
}

function suggestFuture(intel) {
  const bits = [];
  if (!intel.tests.hasTests) bits.push("add automated tests");
  if (!intel.documentation.hasReadme) bits.push("complete the README with run steps");
  if (!intel.configuration.docker) bits.push("add a simple Docker setup for examiners");
  if (intel.authentication.method === "Not detected in source") bits.push("add authenticated access if required by the college");
  bits.push("document limitations honestly for viva");
  return bits.join("; ") + ".";
}

export function toLegacyScan(intel) {
  if (!intel?.ok) return intel;
  return {
    ok: true,
    fileCount: intel.fileCount,
    scannedFiles: intel.scannedFiles,
    stack: {
      language: intel.detectedLanguages[0] || "",
      frameworks: unique([...(intel.frameworks || []), ...(intel.frontend || []), ...(intel.backend || [])]),
      database: intel.databases || [],
      tools: intel.deploymentHints || [],
    },
    languages: intel.detectedLanguages,
    tables: (intel.databaseTables || []).map((t) => ({ name: t.name, columns: t.columns, evidence: t.evidence })),
    models: intel.models || [],
    routes: intel.routes || [],
    modules: (intel.modules || []).map((m) => m.name),
    actors: unique(["User", ...(intel.authorization || []).map(capitalize), intel.authentication?.loginRoute ? "Authenticated user" : null].filter(Boolean)),
    hasDocker: !!intel.configuration?.docker,
    hasTests: !!intel.tests?.hasTests,
    hasReadme: !!intel.documentation?.hasReadme,
    topFiles: intel.topFiles || [],
    intelligence: intel,
    health: intel.health,
    stackLabel: intel.stackLabel,
    suggestedTitle: intel.suggestedTitle,
    suggestedProblem: intel.suggestedProblem,
    suggestedFuture: intel.suggestedFuture,
    warnings: intel.warnings,
    confidence: intel.confidence,
    evidence: (intel.evidence || []).slice(0, 40),
    authentication: intel.authentication,
    authorization: intel.authorization || [],
    features: intel.features || [],
    pages: intel.pages || [],
    apiEndpoints: intel.apiEndpoints || [],
    relationships: intel.relationships || [],
    frontend: intel.frontend || [],
    backend: intel.backend || [],
    tests: intel.tests,
    documentation: intel.documentation,
    configuration: intel.configuration,
    environmentVariables: intel.environmentVariables || [],
  };
}
