/**
 * Read-only Firestore backup using the CLIENT SDK - the same way the web/native
 * apps talk to Firebase (public web config + an authenticated login + security
 * rules). No service account key required.
 *
 * Because the client SDK cannot enumerate collections, the list below is the
 * union of every collection name found across the legacy web, native, and
 * backend code. Missing/empty collections are skipped; collections the signed-in
 * user is not allowed to read are recorded as "skipped" (a permission error).
 *
 * Setup (local, gitignored):
 *   smartstock-admin/.env  with:
 *     FIREBASE_EXPORT_EMAIL=an-admin@example.com
 *     FIREBASE_EXPORT_PASSWORD=that-account-password
 *
 * Run (from smartstock-admin/, Node 20+):
 *   node --env-file=.env scripts/export-firestore.client.mjs
 *
 * Output:
 *   smartstock-admin/backups/firestore-<UTC-timestamp>/
 *     <collection>.json   + _manifest.json
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, getFirestore, GeoPoint, Timestamp } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyCuDx2u6ismS9sDuXHCG8RVtYQUyxtVMdU",
	authDomain: "smartstock-6fb23.firebaseapp.com",
	projectId: "smartstock-6fb23",
	storageBucket: "smartstock-6fb23.firebasestorage.app",
	messagingSenderId: "34425306401",
	appId: "1:34425306401:web:0aaff54be62a28af251260",
	measurementId: "G-GC1R46FWWD",
};

// Union of real collection names across legacy web + native + backend.
const COLLECTIONS = [
	"audit_logs",
	"inspections",
	"inventory",
	"inventory_batches",
	"inventory_items",
	"inventory_items_web",
	"inventory_logs",
	"logs",
	"notifications",
	"products",
	"recipe",
	"recipe_execution",
	"recipe_web",
	"recipes",
	"shelf_life_reference",
	"staff",
	"system_logs",
	"usage_logs",
	"users",
	"users_web",
];

function serialize(value) {
	if (value === null || value === undefined) return value;
	if (value instanceof Timestamp) return { __type__: "timestamp", value: value.toDate().toISOString() };
	if (value instanceof GeoPoint) return { __type__: "geopoint", lat: value.latitude, lng: value.longitude };
	if (value && typeof value === "object" && value.constructor?.name === "DocumentReference") {
		return { __type__: "ref", value: value.path };
	}
	if (Array.isArray(value)) return value.map(serialize);
	if (typeof value === "object") {
		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
	}
	return value;
}

async function main() {
	const email = process.env.FIREBASE_EXPORT_EMAIL;
	const password = process.env.FIREBASE_EXPORT_PASSWORD;
	if (!email || !password) {
		console.error(
			"Missing credentials. Create smartstock-admin/.env with FIREBASE_EXPORT_EMAIL and FIREBASE_EXPORT_PASSWORD, then run with `node --env-file=.env`.",
		);
		process.exit(1);
	}

	const app = initializeApp(firebaseConfig);
	const auth = getAuth(app);
	const db = getFirestore(app);

	console.log(`Signing in as ${email} ...`);
	const cred = await signInWithEmailAndPassword(auth, email, password);
	console.log(`Signed in (uid: ${cred.user.uid}).\n`);

	const stamp = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19) + "Z";
	const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "backups", `firestore-${stamp}`);
	mkdirSync(outDir, { recursive: true });

	const manifest = { generatedAt: stamp, project: firebaseConfig.projectId, collections: {}, skipped: {} };
	let total = 0;

	for (const name of COLLECTIONS) {
		try {
			const snap = await getDocs(collection(db, name));
			if (snap.empty) {
				console.log(`  ${name}: (empty / not present)`);
				manifest.collections[name] = 0;
				continue;
			}
			const docs = snap.docs.map((d) => ({ id: d.id, data: serialize(d.data()) }));
			writeFileSync(join(outDir, `${name}.json`), JSON.stringify(docs, null, 2), "utf-8");
			manifest.collections[name] = docs.length;
			total += docs.length;
			console.log(`  ${name}: ${docs.length} docs`);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			manifest.skipped[name] = msg;
			console.log(`  ${name}: SKIPPED (${msg})`);
		}
	}

	manifest.totalDocs = total;
	writeFileSync(join(outDir, "_manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");

	console.log(`\nBackup complete -> ${outDir}`);
	console.log(`Collections with data: ${Object.values(manifest.collections).filter((n) => n > 0).length} | total docs: ${total}`);
	if (Object.keys(manifest.skipped).length) {
		console.log(`Skipped (permission/error): ${Object.keys(manifest.skipped).join(", ")}`);
	}
	process.exit(0);
}

main().catch((err) => {
	console.error("Export failed:", err);
	process.exit(1);
});
