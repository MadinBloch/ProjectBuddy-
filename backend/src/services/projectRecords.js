import prisma from "../db/prisma.js";

export async function syncProjectRecord(project) {
  if (!project?.id) return null;

  const title =
    project.answers?.title ||
    project.preview?.title ||
    project.scan?.suggestedTitle ||
    project.scan?.projectName ||
    null;

  const payload = {
    userId: project.userId || null,
    title,
    githubUrl: project.github || null,
    status: project.status || "draft",
    sourceType: project.github ? "github" : "zip",
    projectDir: project.dir || null,
    metadata: JSON.stringify({
      fileCount: project.scan?.fileCount || 0,
      frameworks: project.scan?.stack?.frameworks || [],
      databases: project.scan?.stack?.database || [],
    }),
  };

  return prisma.project.upsert({
    where: { id: project.id },
    update: payload,
    create: { id: project.id, ...payload },
  });
}
