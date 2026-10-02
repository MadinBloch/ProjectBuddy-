import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
export const DATA_DIR = path.join(ROOT, "data");
export const PROJECTS_DIR = path.join(DATA_DIR, "projects");
export const TMP_DIR = path.join(DATA_DIR, "tmp");
export const STORE_FILE = path.join(DATA_DIR, "store.json");

export function ensureDataDirectories() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, "{}", "utf8");
  }
}

export function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
  } catch {
    return {};
  }
}

export function saveStore(store) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

export function id() {
  return "pb_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
