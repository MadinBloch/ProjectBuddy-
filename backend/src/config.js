import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = path.resolve(__dirname, "../..");
export const DATA_DIR = path.join(ROOT_DIR, "data");
export const PROJECTS_DIR = path.join(DATA_DIR, "projects");
export const TMP_DIR = path.join(DATA_DIR, "tmp");
export const STORE_FILE = path.join(DATA_DIR, "store.json");
export const FRONTEND_DIST_DIR = path.join(ROOT_DIR, "frontend", "dist");
export const API_PORT = Number(process.env.API_PORT || 3001);
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
export const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || `http://localhost:${API_PORT}/api/auth/github/callback`;
export const SESSION_SECRET = process.env.SESSION_SECRET || "projectbuddy-dev-secret";

export function getRuntimeConfig() {
  return {
    rootDir: ROOT_DIR,
    dataDir: DATA_DIR,
    projectsDir: PROJECTS_DIR,
    tmpDir: TMP_DIR,
    storeFile: STORE_FILE,
    frontendDistDir: FRONTEND_DIST_DIR,
    apiPort: API_PORT,
    frontendUrl: FRONTEND_URL,
    githubClientId: GITHUB_CLIENT_ID,
    githubClientSecret: GITHUB_CLIENT_SECRET,
    githubCallbackUrl: GITHUB_CALLBACK_URL,
    sessionSecret: SESSION_SECRET,
  };
}
