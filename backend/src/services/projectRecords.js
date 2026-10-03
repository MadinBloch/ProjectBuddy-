import prisma from "../db/prisma.js";

export async function syncProjectRecord(project) {
  if (!project?.id) return null;

  const title =
    project.answers?.title ||
    project.preview?.title ||
    project.scan?.suggestedTitle ||
    project.scan?.projectName ||
    null;

  const metadata = {
    fileCount: project.scan?.fileCount || 0,
    frameworks: project.scan?.stack?.frameworks || project.scan?.frameworks || [],
    databases: project.scan?.stack?.database || project.scan?.databases || [],
    routeCount: Array.isArray(project.scan?.routes) ? project.scan.routes.length : 0,
    tableCount: Array.isArray(project.scan?.tables) ? project.scan.tables.length : 0,
    moduleCount: Array.isArray(project.scan?.modules) ? project.scan.modules.length : 0,
    sourceType: project.github ? "github" : project.sourceType || "zip",
    github: project.github || null,
    error: project.error || null,
    updatedAt: project.updatedAt || new Date().toISOString(),
    projectName: project.scan?.projectName || null,
    stackLabel: project.scan?.stackLabel || null,
  };

  const payload = {
    userId: project.userId || null,
    title,
    githubUrl: project.github || null,
    status: project.status || "draft",
    sourceType: project.github ? "github" : "zip",
    projectDir: project.dir || null,
    metadata: JSON.stringify(metadata),
  };

  return prisma.project.upsert({
    where: { id: project.id },
    update: payload,
    create: { id: project.id, ...payload },
  });
}
