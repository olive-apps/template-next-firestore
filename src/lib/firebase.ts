import {
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Lazy singleton. firebase-admin is heavy and only initialized when actually
// needed — keeps the build-time graph small for surfaces that never call into
// Firestore.
let cachedApp: App | null = null;

function decodeServiceAccount(): ServiceAccount {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!encoded) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not set. The provisioning endpoint injects this at deploy time.",
    );
  }
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const parsed = JSON.parse(decoded) as ServiceAccount;
  return parsed;
}

export function getFirebaseApp(): App {
  if (cachedApp) return cachedApp;
  const existing = getApps();
  if (existing.length > 0) {
    const first = existing[0];
    if (first) {
      cachedApp = first;
      return first;
    }
  }
  const serviceAccount = decodeServiceAccount();
  cachedApp = initializeApp({
    credential: cert(serviceAccount),
  });
  return cachedApp;
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}
