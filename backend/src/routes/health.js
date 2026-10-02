import prisma from "../db/prisma.js";

export function createHealthRouter() {
  const router = {
    async health(_req, res) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ ok: true, name: "ProjectBuddy", database: "sqlite" });
      } catch (error) {
        res.status(500).json({ ok: false, name: "ProjectBuddy", error: error.message || "Database unavailable" });
      }
    },

    async dbStatus(_req, res) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ ok: true, provider: "sqlite", database: "ready" });
      } catch (error) {
        res.status(500).json({ ok: false, error: error.message || "Database unavailable" });
      }
    },
  };

  return router;
}
