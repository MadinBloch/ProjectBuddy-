import prisma from "../db/prisma.js";

function databaseProvider() {
  const url = String(process.env.DATABASE_URL || "");
  if (url.startsWith("file:")) return "sqlite";
  if (url.startsWith("postgres")) return "postgresql";
  return "unknown";
}

export function createHealthRouter() {
  const router = {
    async health(_req, res) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ ok: true, name: "ProjectBuddy", database: databaseProvider() });
      } catch (error) {
        res.status(500).json({ ok: false, name: "ProjectBuddy", error: error.message || "Database unavailable" });
      }
    },

    async dbStatus(_req, res) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ ok: true, provider: databaseProvider(), database: "ready" });
      } catch (error) {
        res.status(500).json({ ok: false, error: error.message || "Database unavailable" });
      }
    },
  };

  return router;
}
