import prisma from "../db/prisma.js";

export async function upsertUserFromProvider({
  provider,
  providerUserId,
  email,
  name,
  avatarUrl,
}) {
  if (!provider || !providerUserId) {
    throw new Error("provider and providerUserId are required");
  }

  return prisma.user.upsert({
    where: { providerUserId },
    update: {
      email: email || null,
      name: name || null,
      avatarUrl: avatarUrl || null,
      provider,
      updatedAt: new Date(),
    },
    create: {
      provider,
      providerUserId,
      email: email || null,
      name: name || null,
      avatarUrl: avatarUrl || null,
    },
  });
}

export async function findUserByEmail(email) {
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserStats() {
  const [userCount, projectCount] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
  ]);

  return { userCount, projectCount };
}
