import { capitalize, unique } from "./util.js";
import { stripUnverified, missingNotice } from "./validator.js";

export function buildContent(ctx) {
  const intel = ctx.intel;
  const sections = reportSections(ctx);
  const reportMd = assembleReport(ctx, sections);
  const srs = buildSrs(ctx);
  const viva = buildViva(ctx);
  const demo = buildDemo(ctx);
  const reflection = buildReflection(ctx);
  const suggestions = buildSuggestions(ctx);
  const slides = buildSlides(ctx);
  const readme = buildReadme(ctx);
  return {
    reportMd: stripUnverified(reportMd, intel),
    srs: stripUnverified(srs, intel),
    vivaMd: viva.markdown,
    vivaItems: viva.items,
    demo: stripUnverified(demo, intel),
    reflection: stripUnverified(reflection, intel),
    suggestionsMd: suggestions.markdown,
    suggestions: suggestions.items,
    slides,
    readme,
    sections: sections.map((s) => ({ id: s.id, title: s.title, included: s.included })),
  };
}

function intelOf(ctx) {
  return ctx.intel || ctx.scan?.intelligence || ctx.scan || {};
}

function reportSections(ctx) {
  const i = intelOf(ctx);
  const tables = ctx.tables;
  const routes = ctx.routes;
  const models = ctx.models;
  const stack = ctx.stackLabel || "Not detected in source";
  const out = [];

  out.push(sec("cover", "Cover", true, coverBlock(ctx)));
  out.push(sec("abstract", "Abstract", true, `${ctx.title} is implemented with ${stack}. The repository contains ${ctx.scan.fileCount} files. ${ctx.problem}`));
  out.push(sec("intro", "1. Introduction", true, `This report describes ${ctx.title} from the submitted source, not from a generic template. Detected stack: ${stack}.`));
  out.push(sec("problem", "1.1 Problem statement", true, ctx.problem));
  out.push(sec("objectives", "1.2 Objectives", true, objectives(ctx).map((o, n) => `${n + 1}. ${o}`).join("\n")));
  out.push(sec("scope", "1.3 Scope", true, scopeBlock(ctx)));
  out.push(sec("stack", "1.4 Technology stack", true, stackBlock(ctx, i)));
  out.push(sec("background", "2. Literature / background", true, `${ctx.title} follows the client-server pattern found in the repository. Claims below are limited to files that were scanned (${ctx.scan.scannedFiles} source files).`));

  const fr = functionalReqs(ctx);
  out.push(sec("fr", "3.1 Functional requirements", fr.length > 0, fr.map((r, n) => `FR${n + 1}. ${r}`).join("\n")));
  out.push(sec("nfr", "3.2 Non-functional requirements", true, [
    "- Usability: the demo script uses only screens and routes found in source.",
    "- Reliability: invalid input should not crash the main detected flows.",
    "- Security: do not commit secrets; " + (i.secretsDetected ? "a configuration file was detected and values were redacted." : "no live secret values were stored."),
  ].join("\n")));
  out.push(sec("users", "3.3 Users", ctx.actors.length > 0, ctx.actors.map((a) => `- ${a}`).join("\n")));

  out.push(sec("design", "4. System design", true, designBlock(ctx, i)));
  out.push(sec("modules", "4.1 Modules", ctx.modules.length > 0, ctx.modules.map((m, n) => `${n + 1}. **${m}**`).join("\n")));
  out.push(sec("data", "4.2 Data design", tables.length > 0, tables.map((t) => `- \`${t.name}\`${t.columns?.length ? " (" + t.columns.map((c) => c.name).join(", ") + ")" : ""}`).join("\n"), "Database tables"));
  out.push(sec("models", "4.3 Domain models", models.length > 0, models.map((m) => `- ${m.name} (\`${m.file}\`)`).join("\n"), "Domain models"));
  out.push(sec("routes", "4.4 Routes / entry points", routes.length > 0, routes.slice(0, 25).map((r) => `- \`${r.method} ${r.path}\` — \`${r.file}\``).join("\n"), "HTTP routes"));
  out.push(sec("auth", "4.5 Authentication", i.authentication && i.authentication.method !== "Not detected in source", authBlock(i), "Authentication"));
  out.push(sec("impl", "5. Implementation", true, implBlock(ctx)));
  out.push(sec("testing", "6. Testing", true, testBlock(ctx, i)));
  out.push(sec("conclusion", "7. Conclusion", true, `${ctx.title} is documented from ${ctx.scan.fileCount} submitted files. Empty topics were omitted instead of inventing modules, tables, or APIs.`));
  out.push(sec("future", "8. Future work", true, ctx.future));
  out.push(sec("refs", "9. References", true, refs(ctx)));
  out.push(sec("declaration", "Appendix A. Declaration", true, `I, ${ctx.student}, enrollment ${ctx.enrollment}, declare that this documentation describes the submitted source of ${ctx.title}.\n\nDate: ${new Date().toISOString().slice(0, 10)}\nSignature: ____________________`));
  return out;
}

function sec(id, title, included, body, missingLabel) {
  return { id, title, included, body: included ? body : missingNotice(missingLabel || title, false) };
}

function assembleReport(ctx, sections) {
  const lines = [`# ${ctx.title}`, "", coverMeta(ctx), ""];
  for (const s of sections) {
    if (s.id === "cover") continue;
    if (!s.included) continue;
    if (s.id === "abstract") {
      lines.push("## Abstract", "", s.body, "");
    } else {
      lines.push(`## ${s.title}`, "", s.body, "");
    }
  }
  return lines.join("\n");
}

function coverBlock(ctx) {
  return coverMeta(ctx);
}

function coverMeta(ctx) {
  return `**A Project Report submitted in partial fulfillment of the requirements for the award of ${ctx.course}**

Student: ${ctx.student}  
Enrollment: ${ctx.enrollment}  
College: ${ctx.college}  
Guide: ${ctx.guide}  
Year: ${ctx.year}`;
}

function objectives(ctx) {
  const items = [`Provide a working application for ${ctx.title} using only features found in source.`];
  if (ctx.tables.length) items.push(`Persist records in detected stores: ${ctx.tables.map((t) => t.name).slice(0, 6).join(", ")}.`);
  if (ctx.actors.length) items.push(`Support detected users: ${ctx.actors.join(", ")}.`);
  if (ctx.routes.length) items.push("Expose the detected routes listed in this report.");
  items.push("Keep documentation aligned with the repository so viva answers can be checked against files.");
  return items;
}

function scopeBlock(ctx) {
  const inn = ctx.modules.length ? "In scope: " + ctx.modules.join("; ") + "." : "In scope: behavior implemented in the uploaded files.";
  return `${inn}\nOut of scope: anything not present in the submitted source, including invented APIs, tables, or third-party products.`;
}

function stackBlock(ctx, i) {
  const lines = [
    `- Languages: ${(i.detectedLanguages || ctx.scan.languages || []).join(", ") || "Not detected in source"}`,
    `- Frameworks: ${(i.frameworks || ctx.scan.stack?.frameworks || []).join(", ") || "Not detected in source"}`,
    `- Databases: ${(i.databases || ctx.scan.stack?.database || []).join(", ") || "Not detected in source"}`,
  ];
  if (i.libraries?.length) lines.push(`- Libraries (declared and referenced): ${i.libraries.join(", ")}`);
  if (ctx.github) lines.push(`- Source: ${ctx.github}`);
  else lines.push("- Source: project zip uploaded by the student");
  return lines.join("\n");
}

function designBlock(ctx, i) {
  const front = (i.frontend || []).join(", ");
  const back = (i.backend || []).join(", ");
  const db = (i.databases || ctx.scan.stack?.database || [])[0];
  const parts = [];
  if (front) parts.push(`User interface: ${front}.`);
  if (back) parts.push(`Application logic: ${back}.`);
  if (db) parts.push(`Persistence: ${db}.`);
  if (!parts.length) parts.push("Layering is described only where files make it visible.");
  return parts.join(" ");
}

function functionalReqs(ctx) {
  const reqs = [];
  for (const m of ctx.modules) reqs.push(`The system shall support ${String(m).replace(/ module$/i, "").toLowerCase()} as implemented in source.`);
  for (const r of ctx.routes.slice(0, 8)) reqs.push(`The system shall handle \`${r.method} ${r.path}\` (\`${r.file}\`).`);
  return unique(reqs).slice(0, 12);
}

function authBlock(i) {
  const a = i.authentication || {};
  const ev = (a.evidence || []).slice(0, 4).map((e) => `\`${e}\``).join(", ");
  return `Method: ${a.method}.${ev ? " Evidence: " + ev + "." : ""}`;
}

function implBlock(ctx) {
  const files = (ctx.scan.topFiles || []).slice(0, 15);
  return `Key files reviewed:\n\n${files.map((f) => `- \`${f}\``).join("\n") || "- File list not available."}`;
}

function testBlock(ctx, i) {
  if (i.tests?.hasTests || ctx.scan.hasTests) {
    const files = (i.tests?.files || []).slice(0, 8).map((f) => `- \`${f}\``).join("\n");
    return `Automated tests were found.\n${files || ""}\n\nRun the project test command before viva. Also prepare one valid create and one invalid submit from a real screen.`;
  }
  return "No automated test suite was detected. Do not claim unit tests in viva. Prepare manual cases only for flows that exist: open a detected page, submit a detected form or route, and show a failed validation if the code has one.";
}

function refs(ctx) {
  const fw = ctx.scan.stack?.frameworks?.[0] || ctx.scan.stack?.language || "the implementation language";
  return [
    "1. Pressman, R. S. Software Engineering: A Practitioner's Approach.",
    `2. Official documentation for ${fw}.`,
    "3. Elmasri, R. and Navathe, S. Fundamentals of Database Systems.",
    "4. IEEE recommended practice for software requirements specifications.",
    "5. Project source files submitted with this report.",
  ].join("\n");
}

function buildSrs(ctx) {
  const lines = [`# Software Requirements Specification`, "", `## Product`, ctx.title, "", "## Purpose", `Define what ${ctx.title} must do, limited to detected modules and routes.`, ""];
  if (ctx.modules.length) {
    lines.push("## Functional requirements");
    ctx.modules.forEach((m, i) => lines.push(`### FR-${String(i + 1).padStart(2, "0")} ${m}`, `Authorized users can complete work in ${String(m).replace(/ module$/i, "").toLowerCase()} as implemented.`, ""));
  }
  if (ctx.routes.length) {
    lines.push("## External interfaces");
    ctx.routes.slice(0, 20).forEach((r) => lines.push(`- ${r.method} ${r.path} (${r.file})`));
    lines.push("");
  }
  if (ctx.tables.length) {
    lines.push("## Data");
    ctx.tables.forEach((t) => lines.push(`- ${t.name}`));
    lines.push("");
  }
  lines.push("## Non-functional", "Campus demo performance, access control only if detected, recoverable data, readable code for evaluation.");
  return lines.join("\n");
}

function buildViva(ctx) {
  const i = intelOf(ctx);
  const groups = [
    { cat: "Project", items: [
      q("What is the title and aim of your project?", `${ctx.title}. ${ctx.problem}`, "answers"),
      q("Which files prove this is your project?", (ctx.scan.topFiles || []).slice(0, 5).join(", ") || "Open the uploaded source tree.", "code"),
    ]},
    { cat: "Stack", items: [
      q("Which technology stack did you use?", ctx.stackLabel || "Not detected in source. Name only what you can open in the repo.", "code"),
      q("What is frontend vs backend here?", stackSplit(i), "code"),
    ]},
  ];
  if (ctx.tables.length) {
    groups.push({
      cat: "Database",
      items: [
        q("Explain your database.", `Detected store: ${(i.databases || ctx.scan.stack?.database || []).join(", ") || "see tables"}. Tables: ${ctx.tables.map((t) => t.name).join(", ")}.`, "code"),
        ...ctx.tables.slice(0, 3).map((t) => q(`What does ${t.name} store?`, `Table \`${t.name}\`${t.columns?.length ? " columns: " + t.columns.map((c) => c.name).join(", ") : ""}. Evidence: ${(t.evidence || []).join(", ") || "schema/model files"}.`, "code")),
        q("Primary key vs foreign key?", "Primary key uniquely identifies a row. Foreign key references another table. Point to a detected *_id column if you have one.", "concept"),
      ],
    });
  }
  if (ctx.routes.length) {
    groups.push({
      cat: "Routes",
      items: ctx.routes.slice(0, 4).map((r) => q(`What happens on ${r.method} ${r.path}?`, `Handled in \`${r.file}\`. Open that file in viva; do not describe endpoints that are not listed.`, "code")),
    });
  }
  const auth = i.authentication || {};
  groups.push({
    cat: "Security",
    items: [
      q("How is authentication done?", auth.method === "Not detected in source" || !auth.method ? "Authentication was not detected in source. Say that honestly. Do not invent JWT or sessions." : `${auth.method}. Evidence: ${(auth.evidence || []).join(", ")}.`, "code"),
      q("Did you commit secrets?", i.secretsDetected ? "A configuration file was detected. Values were redacted by ProjectBuddy. Remove live passwords before college submission." : "No env secret file was stored in the scan.", "code"),
    ],
  });
  groups.push({
    cat: "Testing",
    items: [q("What testing did you perform?", (i.tests?.hasTests || ctx.scan.hasTests) ? "Automated tests exist in the repo. Also show one manual create and one failed validation." : "No automated tests detected. Describe only manual checks of real screens.", "code")],
  });
  groups.push({
    cat: "Concepts",
    items: [
      q("What is SDLC?", "The process of building software. This academic project is best described as iterative: implement, test the demo flow, document what exists.", "concept"),
      q("What is a DFD?", ctx.tables.length || ctx.routes.length ? "A data flow diagram of this system is in folder 03, drawn from detected processes — not from a random internet template." : "A DFD shows data movement. This pack omitted invented processes because source evidence was thin.", "concept"),
      q("What would you improve next?", ctx.future, "answers"),
    ],
  });
  const items = groups.flatMap((g) => g.items.map((it) => ({ ...it, category: g.cat })));
  const markdown = `# Viva questions and answers\n\nProject: ${ctx.title}\nStudent: ${ctx.student}\n\nAnswers marked "code" cite detected files. Concept questions are standard ${ctx.course} topics. Do not claim features that are not in source.\n\n${items.map((it, n) => `## Q${n + 1}. ${it.q}\n\n[${it.category} / ${it.source}]\n\n${it.a}\n`).join("\n")}`;
  return { items, markdown };
}

function q(question, a, source) {
  return { q: question, a, source };
}

function stackSplit(i) {
  const f = (i.frontend || []).join(", ");
  const b = (i.backend || []).join(", ");
  if (!f && !b) return "Not fully split in source. Open the entry files and explain request flow from there.";
  return [f ? `Frontend: ${f}.` : null, b ? `Backend: ${b}.` : null].filter(Boolean).join(" ");
}

function buildDemo(ctx) {
  const i = intelOf(ctx);
  const page = (i.pages || [])[0];
  const route = ctx.routes[0];
  const table = ctx.tables[0];
  const steps = [
    `0:00-0:20  ${ctx.student}, ${ctx.course}, ${ctx.college}. One line: ${ctx.title}.`,
    `0:20-0:40  Name only the detected stack: ${ctx.stackLabel || "open package/composer files"}.`,
  ];
  if (page) steps.push(`0:40-1:10  Open screen \`${page}\`.`);
  else if (route) steps.push(`0:40-1:10  Hit \`${route.method} ${route.path}\` from \`${route.file}\`.`);
  else steps.push("0:40-1:10  Open the actual home screen in your repo. Do not show a mock feature.");
  if (table) steps.push(`1:10-1:50  Create or list a record that maps to \`${table.name}\`.`);
  else steps.push("1:10-1:50  Show one real write or list operation from source. Skip this beat if none exists.");
  if (ctx.modules[1]) steps.push(`1:50-2:20  Second module: ${ctx.modules[1]}.`);
  else steps.push("1:50-2:20  Show a second real file (controller or model) instead of a fake admin panel.");
  steps.push("2:20-2:40  If asked for design, open a diagram that matches detected tables/routes.");
  steps.push("2:40-3:00  Stop. If a feature is missing, say it is not in source.");
  return `# 3-minute demo script\n\nStudent: ${ctx.student}\nProject: ${ctx.title}\n\n${steps.join("\n")}\n`;
}

function buildReflection(ctx) {
  return `# Learning reflection

I, ${ctx.student}, documented ${ctx.title} for ${ctx.course} at ${ctx.college} from ${ctx.scan.fileCount} submitted files.

What the repository actually contains:
- Stack: ${ctx.stackLabel || "see scan"}
- Modules: ${ctx.modules.join(", ") || "not detected"}
- Tables: ${ctx.tables.map((t) => t.name).join(", ") || "not detected"}

What was difficult: matching documentation to files instead of copying a generic report.

What I would do next:
${ctx.future}
`;
}

function buildSuggestions(ctx) {
  const i = intelOf(ctx);
  const items = [];
  if (!(i.documentation?.hasReadme || ctx.scan.hasReadme)) items.push("Add a README with install steps and the exact demo URL.");
  if (!(i.tests?.hasTests || ctx.scan.hasTests)) items.push("Add tests for one real create/list flow. Do not claim tests you do not have.");
  if (!ctx.tables.length) items.push("Include schema or migrations so examiners can verify data design.");
  if (!ctx.routes.length) items.push("Document how to start the app and which URL to open.");
  if (i.secretsDetected) items.push("Remove live secrets from the zip before college submission.");
  if (!i.configuration?.docker) items.push("Optional: add Docker only if you will actually run it in viva.");
  items.push("Keep this pack and the source zip together. Never demo features that are not in the repo.");
  return { items, markdown: `# Suggestions\n\n${items.map((x) => `- ${x}`).join("\n")}\n` };
}

function buildSlides(ctx) {
  const i = intelOf(ctx);
  const slides = [
    { id: "title", title: "Title", body: `${ctx.title}\n${ctx.student} | ${ctx.enrollment}\n${ctx.course}, ${ctx.college}\nGuide: ${ctx.guide}\n${ctx.year}` },
    { id: "problem", title: "Problem", body: ctx.problem },
    { id: "objectives", title: "Objectives", body: objectives(ctx).map((o, n) => `${n + 1}. ${o}`).join("\n") },
    { id: "scope", title: "Scope", body: scopeBlock(ctx) },
    { id: "stack", title: "Technology stack", body: ctx.stackLabel + "\nLanguages: " + (ctx.scan.languages || []).join(", ") },
  ];
  if ((i.frontend || []).length || (i.backend || []).length) {
    slides.push({ id: "architecture", title: "Architecture", body: [i.frontend?.length ? "UI: " + i.frontend.join(", ") : null, i.backend?.length ? "App: " + i.backend.join(", ") : null, i.databases?.length ? "Data: " + i.databases.join(", ") : null].filter(Boolean).join("\n") });
  }
  if (ctx.tables.length) slides.push({ id: "data", title: "Data", body: ctx.tables.map((t) => t.name + (t.columns?.length ? ": " + t.columns.map((c) => c.name).slice(0, 5).join(", ") : "")).join("\n") });
  if (ctx.modules.length) slides.push({ id: "modules", title: "Modules", body: ctx.modules.map((m, n) => `${n + 1}. ${m}`).join("\n") });
  if (ctx.routes.length) slides.push({ id: "routes", title: "Routes", body: ctx.routes.slice(0, 8).map((r) => `${r.method} ${r.path}`).join("\n") });
  slides.push({ id: "implementation", title: "Implementation", body: "Files: " + ctx.scan.fileCount + "\n" + (ctx.scan.topFiles || []).slice(0, 6).join("\n") });
  slides.push({ id: "testing", title: "Testing", body: (i.tests?.hasTests || ctx.scan.hasTests) ? "Automated tests found in repo." : "No automated tests detected. Manual demo of real flows only." });
  slides.push({ id: "conclusion", title: "Conclusion", body: `${ctx.title} is documented from source. Missing pieces were omitted, not invented.` });
  slides.push({ id: "future", title: "Future work", body: ctx.future });
  return slides.slice(0, 12);
}

function buildReadme(ctx) {
  return `ProjectBuddy pack for ${ctx.title}

How to submit
1. Submit 01-project-report.pdf (or .docx) as prepared; both are generated from your source evidence.
2. Include only diagrams in 03-diagrams that match your code.
3. Use 06-presentation.pptx (or .html) for internal/external presentation.
4. Practice 04-viva-qa.md. Code-tagged answers can be checked against files.
5. Follow 05-demo-script.md. Do not demo missing features.

Generated from ${ctx.scan.fileCount} project files.
`;
}

export function buildContext(answers, scan, github) {
  const intel = scan?.intelligence || scan || {};
  const title = answers.title?.trim() || intel.suggestedTitle || intel.projectName || "Student Project";
  const student = answers.studentName?.trim() || "Student Name";
  const college = answers.college?.trim() || "College Name";
  const course = answers.course?.trim() || "BCA";
  const enrollment = answers.enrollment?.trim() || "ENROLLMENT";
  const guide = answers.guide?.trim() || "Project Guide";
  const problem = answers.problem?.trim() || intel.suggestedProblem || `${title} is described from the submitted source files.`;
  const future = answers.futureWork?.trim() || intel.suggestedFuture || "Document limitations honestly and add tests if none exist.";
  const year = answers.year?.trim() || String(new Date().getFullYear());
  const moduleNames = (answers.modules?.length ? answers.modules : (intel.modules || scan.modules || []).map((m) => (typeof m === "string" ? m : m.name))).filter(Boolean).slice(0, 10);
  const tables = (intel.databaseTables || scan.tables || []).filter((t) => !["migrations", "failed_jobs", "sessions", "cache", "jobs"].includes(t.name));
  const stackLabel = unique([
    ...(intel.frontend || []),
    ...(intel.backend || []),
    ...(intel.frameworks || scan.stack?.frameworks || []),
    ...(intel.databases || scan.stack?.database || []),
  ]).join(" · ") || scan.stackLabel || "";

  const actors = unique([
    ...(scan.actors || []),
    ...(intel.authorization || []).map(capitalize),
    intel.authentication?.loginRoute ? "Authenticated user" : null,
  ]).filter(Boolean);

  return {
    title,
    student,
    college,
    course,
    enrollment,
    guide,
    problem,
    future,
    year,
    modules: moduleNames,
    scan,
    intel,
    github: github || "",
    stackLabel,
    tables,
    models: intel.models || scan.models || [],
    routes: intel.routes || scan.routes || [],
    actors: actors.length ? actors : ["User"],
  };
}
