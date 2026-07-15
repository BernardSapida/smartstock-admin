// Convenience runner: `npm run db:seed` from the admin repo.
//
// IMPORTANT: this does NOT (and cannot) seed from the browser. Seeding needs the
// Firebase ADMIN SDK + a service-account key — a server-only credential that must
// never ship to a web app. This script runs in Node from your terminal and simply
// invokes the real seeder, which lives in the sibling `inventory-backend` repo
// (Python, firebase-admin, serviceAccountKey.json). That backend is the single
// source of truth for seed data; we don't duplicate it here.
//
//   npm run db:seed        → writes to Firestore (passes --commit)
//   npm run db:seed:dry    → dry run (prints what it would do, writes nothing)

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(here, "..", "..", "inventory-backend");

if (!existsSync(backend)) {
	console.error(`Cannot find the backend repo at:\n  ${backend}\n` + "Expected inventory-backend to sit next to smartstock-admin.");
	process.exit(1);
}

// Prefer the backend's virtualenv Python; fall back to a system Python.
const venvPython =
	process.platform === "win32"
		? path.join(backend, "venv", "Scripts", "python.exe")
		: path.join(backend, "venv", "bin", "python");
const python = existsSync(venvPython) ? venvPython : process.platform === "win32" ? "python" : "python3";

const seeder = path.join("scripts", "seed_data.py");
const args = [seeder, ...process.argv.slice(2)];

console.log(`Running seeder:\n  ${python} ${args.join(" ")}\n  (cwd: ${backend})\n`);

const result = spawnSync(python, args, { cwd: backend, stdio: "inherit" });

if (result.error) {
	console.error(`\nFailed to launch Python: ${result.error.message}`);
	console.error("Make sure the backend venv is set up (see inventory-backend/SETUP.md).");
	process.exit(1);
}
process.exit(result.status ?? 1);
