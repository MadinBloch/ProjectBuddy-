import fs from "fs";
import path from "path";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import pptxgen from "pptxgenjs";
import PDFDocument from "pdfkit";
import { buildDiagrams } from "./diagrams.js";
import { buildContext, buildContent } from "./content.js";
import { understandProject } from "./ai.js";


const STEPS = [
  { id: "intelligence", label: "Reading repository evidence" },
  { id: "understand", label: "Understanding the project" },
  { id: "report", label: "Writing the report" },
  { id: "diagrams", label: "Drawing diagrams from detected structure" },
  { id: "slides", label: "Building slides" },
  { id: "viva", label: "Preparing viva answers" },
  { id: "pack", label: "Assembling the download pack" },
];

export { STEPS };

export async function generatePack({ projectDir, answers, scan, github, onProgress }) {
  const packDir = path.join(projectDir, "pack");
  fs.mkdirSync(packDir, { recursive: true });

  progress(onProgress, "intelligence", 8);
  const ctx = buildContext(answers, scan, github);

  progress(onProgress, "understand", 18);
  const understood = await understandProject(scan, answers);
  ctx.understanding = understood.understanding;
  ctx.generationMode = understood.mode;

  progress(onProgress, "report", 40);
  const content = buildContent(ctx);

  progress(onProgress, "diagrams", 58);
  const diagrams = buildDiagrams(ctx);
  const diagramDir = path.join(packDir, "03-diagrams");
  fs.mkdirSync(diagramDir, { recursive: true });
  for (const d of diagrams) {
    fs.writeFileSync(path.join(diagramDir, `${d.file}.mmd`), d.mermaid);
    fs.writeFileSync(path.join(diagramDir, `${d.file}.svg`), d.svg);
  }

  progress(onProgress, "slides", 72);
  progress(onProgress, "viva", 82);

  const reportHtml = mdToHtml("Project Report", content.reportMd, ctx);
  const srsHtml = mdToHtml("SRS", content.srs, ctx);
  const vivaHtml = mdToHtml("Viva", content.vivaMd, ctx);
  const demoHtml = mdToHtml("Demo script", content.demo, ctx);
  const reflectionHtml = mdToHtml("Reflection", content.reflection, ctx);
  const reportDocxPath = path.join(packDir, "01-report/project-report.docx");
  const reportPdfPath = path.join(packDir, "01-report/project-report.pdf");
  const presentationPptxPath = path.join(packDir, "06-presentation/presentation.pptx");
  await writeReportDocx(reportDocxPath, ctx.title || "Project Report", content.reportMd, ctx);
  await writeReportPdf(reportPdfPath, ctx.title || "Project Report", content.reportMd, ctx);
  await writePresentationPptx(presentationPptxPath, content.slides, ctx);

  progress(onProgress, "pack", 92);
  writeTree(packDir, {
    "01-report/project-report.md": content.reportMd,
    "01-report/project-report.html": reportHtml,
    "02-srs/srs.md": content.srs,
    "04-viva/viva-qa.md": content.vivaMd,
    "05-demo/demo-script.md": content.demo,
    "06-presentation/presentation.md": content.slides.map((s, i) => `## Slide ${i + 1}: ${s.title}\n\n${s.body}\n`).join("\n"),
    "06-presentation/presentation.html": pptToHtml(content.slides, ctx),
    "07-reflection/learning-reflection.md": content.reflection,
    "08-suggestions/suggestions.md": content.suggestionsMd,
    "README.txt": content.readme,
    "SOURCE.txt": sourceStamp(scan, github, ctx.generationMode),
  });

  fs.copyFileSync(reportDocxPath, path.join(packDir, "01-project-report.docx"));
  fs.copyFileSync(reportPdfPath, path.join(packDir, "01-project-report.pdf"));
  fs.copyFileSync(presentationPptxPath, path.join(packDir, "06-presentation.pptx"));

  const files = [
    { id: "report-html", label: "Project report (HTML)", path: "01-report/project-report.html", kind: "report", section: "report" },
    { id: "report-md", label: "Project report (Markdown)", path: "01-report/project-report.md", kind: "report", section: "report" },
    { id: "report-docx", label: "Project report (DOCX)", path: "01-report/project-report.docx", kind: "report", section: "report" },
    { id: "report-pdf", label: "Project report (PDF)", path: "01-report/project-report.pdf", kind: "report", section: "report" },
    { id: "srs", label: "Software requirements", path: "02-srs/srs.md", kind: "doc", section: "srs" },
    { id: "viva", label: "Viva Q&A", path: "04-viva/viva-qa.md", kind: "doc", section: "viva" },
    { id: "demo", label: "Demo script", path: "05-demo/demo-script.md", kind: "doc", section: "demo" },
    { id: "ppt", label: "Presentation (HTML)", path: "06-presentation/presentation.html", kind: "slides", section: "slides" },
    { id: "ppt-md", label: "Presentation (Markdown)", path: "06-presentation/presentation.md", kind: "slides", section: "slides" },
    { id: "pptx", label: "Presentation (PPTX)", path: "06-presentation/presentation.pptx", kind: "slides", section: "slides" },
    { id: "reflection", label: "Learning reflection", path: "07-reflection/learning-reflection.md", kind: "doc", section: "reflection" },
    { id: "suggestions", label: "Suggestions", path: "08-suggestions/suggestions.md", kind: "doc", section: "suggestions" },
    ...diagrams.map((d) => ({ id: `diagram-${d.id}`, label: d.title + " (SVG)", path: `03-diagrams/${d.file}.svg`, kind: "diagram", section: "diagrams" })),
  ];

  const legacyCopies = {
    "01-project-report.html": reportHtml,
    "01-project-report.md": content.reportMd,
    "01-project-report.docx": fs.readFileSync(reportDocxPath),
    "02-srs.md": content.srs,
    "04-viva-qa.md": content.vivaMd,
    "05-demo-script.md": content.demo,
    "06-presentation.html": pptToHtml(content.slides, ctx),
    "06-presentation.md": content.slides.map((s, i) => `## Slide ${i + 1}: ${s.title}\n\n${s.body}\n`).join("\n"),
    "06-presentation.pptx": fs.readFileSync(presentationPptxPath),
    "07-learning-reflection.md": content.reflection,
    "08-suggestions.md": content.suggestionsMd,
  };
  for (const [rel, body] of Object.entries(legacyCopies)) {
    fs.writeFileSync(path.join(packDir, rel), body);
  }

  progress(onProgress, "pack", 100);
  return {
    files: files.map((f) => f.path),
    packFiles: files,
    diagrams: diagrams.map((d) => d.title),
    preview: {
      title: ctx.title,
      student: ctx.student,
      college: ctx.college,
      course: ctx.course,
      stackLabel: ctx.stackLabel,
      generationMode: ctx.generationMode,
      health: scan.health || null,
      evidence: (scan.evidence || []).slice(0, 24),
      warnings: scan.warnings || [],
      confidence: scan.confidence || null,
      sections: content.sections,
      reportHtml,
      srsHtml,
      vivaHtml,
      demoHtml,
      reflectionHtml,
      viva: content.vivaItems,
      slides: content.slides,
      diagrams: diagrams.map((d) => ({
        id: d.id,
        title: d.title,
        omitted: !!d.omitted,
        svg: d.svg.replace(/^<\?xml[^>]*>\s*/i, ""),
      })),
      suggestions: content.suggestions,
      files,
      progress: { step: "pack", percent: 100, label: "Pack ready" },
    },
  };
}

function progress(onProgress, step, percent) {
  const meta = STEPS.find((s) => s.id === step) || { id: step, label: step };
  onProgress?.({ step: meta.id, percent, label: meta.label });
}

function writeTree(root, files) {
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
  }
}

function sourceStamp(scan, github, mode) {
  return [
    `Generated by ProjectBuddy on ${new Date().toISOString().slice(0, 10)} from ${scan.fileCount} project files.`,
    github ? `GitHub: ${github}` : "Source: uploaded zip",
    `Generator: ${mode === "ai" ? "AI grounded in repository evidence" : "deterministic evidence pipeline"}`,
    "Missing tables, APIs, or modules were omitted instead of invented.",
  ].join("\n");
}

async function writeReportDocx(docPath, title, md, ctx) {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: `${ctx.student || "Student"} · ${ctx.course || "Course"} · ${ctx.college || "College"}`, bold: true })] }),
        ...docxBlocksFromMarkdown(md),
      ],
    }],
  });
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docPath, buffer);
}

async function writeReportPdf(pdfPath, title, md, ctx) {
  fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
  const doc = new PDFDocument({
    size: "A4",
    margin: 56,
    info: {
      Title: title,
      Author: "ProjectBuddy",
      Subject: `Project report for ${ctx.college || "college"}`,
      Creator: "ProjectBuddy",
    },
  });
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  doc.font("Times-Bold").fontSize(22).text(title, { align: "center" });
  doc.moveDown(0.3);
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(`${ctx.student || "Student"} · ${ctx.course || "Course"} · ${ctx.college || "College"}`, { align: "center" });
  doc.moveDown(1.2);

  pdfBlocksFromMarkdown(doc, md);

  doc.moveDown(1.5);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#444444")
    .text(`Prepared with ProjectBuddy for ${ctx.student || "the student"} — grounded in submitted source`, { align: "center" });

  doc.end();
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);
  });
}

function pdfBlocksFromMarkdown(doc, md) {
  const lines = String(md || "").split(/\r?\n/);
  let paragraph = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (!text) return;
    doc.font("Helvetica").fontSize(10.5).fillColor("#111111");
    pdfInlineRuns(doc, text);
    doc.moveDown(0.5);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      doc.moveDown(level === 1 ? 1 : 0.7);
      doc
        .font("Times-Bold")
        .fontSize(level === 1 ? 18 : level === 2 ? 14 : 12)
        .fillColor("#111111")
        .text(headingMatch[2]);
      doc.moveDown(0.4);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      doc.font("Helvetica").fontSize(10.5).fillColor("#111111").text("•  ", { continued: true, indent: 10 });
      pdfInlineRuns(doc, line.replace(/^[-*]\s+/, ""));
      doc.moveDown(0.2);
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
}

function pdfInlineRuns(doc, text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  if (!parts.length) {
    doc.text("", {});
    return;
  }
  parts.forEach((part, i) => {
    const last = i === parts.length - 1;
    if (/^\*\*.+\*\*$/.test(part)) {
      doc.font("Helvetica-Bold").text(part.slice(2, -2), { continued: !last });
    } else if (/^`.+`$/.test(part)) {
      doc.font("Courier").text(part.slice(1, -1), { continued: !last });
    } else {
      doc.font("Helvetica").text(part, { continued: !last });
    }
  });
}

async function writePresentationPptx(docPath, slides, ctx) {
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "ProjectBuddy";
  pptx.company = "ProjectBuddy";
  pptx.subject = ctx.title || "Project presentation";
  pptx.title = ctx.title || "Project presentation";

  for (let i = 0; i < slides.length; i += 1) {
    const slide = pptx.addSlide();
    const item = slides[i] || {};
    slide.background = { color: "F8FAFC" };
    slide.addText(item.title || `Slide ${i + 1}`, {
      x: 0.5, y: 0.35, w: 12.5, h: 0.6,
      fontFace: "Arial", fontSize: 24, bold: true, color: "0F172A",
    });
    slide.addText(cleanSlideBody(item.body || ""), {
      x: 0.7, y: 1.2, w: 12.2, h: 5.2,
      fontFace: "Arial", fontSize: 18, color: "1F2937", margin: 0.05, breakLine: true,
    });
  }

  await pptx.writeFile({ fileName: docPath });
}

function mdToHtml(title, md, ctx) {
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
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
@page { margin: 22mm; }
body { font-family: Georgia, serif; color: #111; max-width: 800px; margin: 40px auto; line-height: 1.5; }
h1 { font-size: 26px; }
h2 { margin-top: 28px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
code { font-family: ui-monospace, monospace; font-size: 0.9em; }
.meta { color: #444; }
</style></head><body>${body}<p class="meta">Prepared with ProjectBuddy for ${esc(ctx.student)} — grounded in submitted source</p></body></html>`;
}

function docxBlocksFromMarkdown(md) {
  const blocks = [];
  const lines = String(md || "").split(/\r?\n/);
  let current = [];

  const flushParagraph = () => {
    if (!current.length) return;
    const text = current.join(" ").trim();
    if (text) {
      blocks.push(new Paragraph({ children: inlineToDocxRuns(text) }));
    }
    current = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length === 1 ? HeadingLevel.HEADING_1 : headingMatch[1].length === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      blocks.push(new Paragraph({ text: headingMatch[2], heading: level }));
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      blocks.push(new Paragraph({ children: inlineToDocxRuns(line.replace(/^[-*]\s+/, "")), bullet: { level: 0 } }));
      continue;
    }
    current.push(line);
  }
  flushParagraph();
  return blocks;
}

function inlineToDocxRuns(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part) => {
    if (/^\*\*.+\*\*$/.test(part)) {
      return new TextRun({ text: part.slice(2, -2), bold: true });
    }
    if (/^`.+`$/.test(part)) {
      return new TextRun({ text: part.slice(1, -1), font: "Consolas" });
    }
    return new TextRun({ text: part });
  });
}

function cleanSlideBody(body) {
  return String(body || "")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\r/g, "")
    .trim();
}

function pptToHtml(slides, ctx) {
  const blocks = slides
    .map((s, i) => `<section class="slide"><div class="num">${i + 1} / ${slides.length}</div><h2>${esc(s.title)}</h2><pre>${esc(s.body)}</pre></section>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(ctx.title)} presentation</title>
<style>
html,body { margin:0; background:#0f172a; color:#f8fafc; font-family: Inter, system-ui, sans-serif; }
.slide { min-height:100vh; padding: 8vh 10vw; box-sizing:border-box; border-bottom:1px solid #1e293b; }
h2 { font-size: 42px; margin: 0 0 24px; }
pre { white-space: pre-wrap; font-size: 22px; line-height: 1.45; font-family: inherit; }
.num { color:#94a3b8; margin-bottom: 12px; }
</style></head><body>${blocks}</body></html>`;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export { buildContext };
