import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Public Firebase web config for api-pipeline-prod-231c3. Not secret — these
// values only identify the Firebase project to the Web SDK. The actual access
// gate is the per-app custom token signed at deploy time + the
// apps/{appId}/** Firestore security rule that checks request.auth.token.appId.
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyBGjiX0fEZjB-t-utzZ-lN2tlm3_lLLOSU",
  authDomain: "api-pipeline-prod-231c3.firebaseapp.com",
  projectId: "api-pipeline-prod-231c3",
  storageBucket: "api-pipeline-prod-231c3.firebasestorage.app",
  messagingSenderId: "111402115888",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_WEB_APP_ID ??
    "1:111402115888:web:09cdbbc21e80c827d91ef5",
};

let cachedApp: FirebaseApp | null = null;
let cachedFirestore: Firestore | null = null;
let cachedSignIn: Promise<User | null> | null = null;

export function firebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  const existing = getApps();
  if (existing.length > 0) {
    const first = existing[0];
    if (first) {
      cachedApp = first;
      return first;
    }
  }
  cachedApp = initializeApp(firebaseConfig);
  return cachedApp;
}

export function db(): Firestore {
  if (cachedFirestore) return cachedFirestore;
  cachedFirestore = getFirestore(firebaseApp());
  return cachedFirestore;
}

// The per-app envelope minted by api-pipeline's mintPerAppFirebaseCredential.
// `authMode === 'anonymous-appid'` is the v2-compatible default and the only
// mode currently emitted by production (Identity Platform multi-tenancy is not
// yet enabled on the project). `authMode === 'tenant'` is the opt-in mode the
// app's own sign-in UI uses; see signUpWithEmail / signInWithEmail in
// `src/lib/auth.ts`.
export interface PerAppEnvelope {
  readonly version: number;
  readonly appId: string;
  readonly customToken: string;
  readonly authMode?: "anonymous-appid" | "tenant";
  readonly tenantId?: string;
}

// Decode the base64-encoded JSON envelope injected by the deployer as
// NEXT_PUBLIC_FIREBASE_CUSTOM_TOKEN_B64. Exposed so the opt-in tenant-auth
// helpers in `src/lib/auth.ts` can read tenantId without re-implementing the
// decode.
export function decodeEnvelope(envelopeB64: string): PerAppEnvelope {
  const decoded =
    typeof atob === "function"
      ? atob(envelopeB64)
      : Buffer.from(envelopeB64, "base64").toString("utf8");
  return JSON.parse(decoded) as PerAppEnvelope;
}

// The deployer inlines this at build time. Throws when it's missing because
// every data-reading path needs it; failing loudly at the call site beats
// a silent unauthenticated-Firestore error two screens deeper.
export function readEnvelopeFromEnv(): PerAppEnvelope {
  const envelopeB64 = process.env.NEXT_PUBLIC_FIREBASE_CUSTOM_TOKEN_B64;
  if (!envelopeB64) {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_CUSTOM_TOKEN_B64 is not set. The deployer injects this at build time.",
    );
  }
  return decodeEnvelope(envelopeB64);
}

// Decode the per-app credential envelope minted by api-pipeline's
// mintPerAppFirebaseCredential and sign in.
//
// Branching on `envelope.authMode`:
//
//   - `'anonymous-appid'` (default, v2-compatible): immediately signs in
//     with the customToken. The resulting user carries
//     `request.auth.token.appId == appId` and the Firestore rule on
//     `apps/{appId}/{document=**}` permits the access. There is no
//     end-user identity inside the app.
//
//   - `'tenant'` (opt-in, only after Bill flips Identity Platform
//     multi-tenancy on the project): sets `auth.tenantId = tenantId` and
//     does NOT auto-sign-in. The app's own UI calls signUpWithEmail /
//     signInWithEmail / continueAsAppAnonymous from `src/lib/auth.ts` to
//     drive the end-user flow. The customToken is still available in the
//     envelope for the app-shared scope (apps/{appId}/{document=**}) —
//     `continueAsAppAnonymous` uses it.
//
// Static-export builds inline NEXT_PUBLIC_FIREBASE_CUSTOM_TOKEN_B64 into the
// JS bundle at build time. The custom token has a 24 hour lifetime; after
// that the deployed app's Firestore reads fail with 'unauthenticated' and
// the app must be rebuilt + redeployed. Longer-lived auth is a v2 concern.
export async function ensureSignedIn(): Promise<User | null> {
  if (cachedSignIn) return cachedSignIn;
  cachedSignIn = (async () => {
    const envelope = readEnvelopeFromEnv();
    const auth = getAuth(firebaseApp());
    if (envelope.authMode === "tenant" && envelope.tenantId) {
      // Tenant mode — wire the tenant scope, but defer sign-in to the
      // app's own UI. Returning null is the intentional contract: data
      // reads under `apps/{appId}/users/{uid}/**` require an authenticated
      // tenant user, which only the sign-in UI can produce.
      auth.tenantId = envelope.tenantId;
      return null;
    }
    // anonymous-appid mode (v2-compat default).
    const cred = await signInWithCustomToken(auth, envelope.customToken);
    return cred.user;
  })();
  return cachedSignIn;
}

export function currentUser(): User | null {
  return getAuth(firebaseApp()).currentUser;
}
