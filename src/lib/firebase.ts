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
let cachedSignIn: Promise<User> | null = null;

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

// Decode the per-app credential envelope minted by api-pipeline's
// mintPerAppFirebaseCredential and sign in. The customToken inside the
// envelope is a Firebase custom token whose developerClaims.appId is the
// app identifier; signInWithCustomToken exchanges it for an ID token whose
// request.auth.token.appId claim is what the apps/{appId}/** Firestore
// security rule reads.
//
// Static-export builds inline NEXT_PUBLIC_FIREBASE_CUSTOM_TOKEN_B64 into the
// JS bundle at build time. The custom token has a 24 hour lifetime; after
// that the deployed app's Firestore reads fail with 'unauthenticated' and
// the app must be rebuilt + redeployed. Longer-lived auth is a v2 concern.
export async function ensureSignedIn(): Promise<User> {
  if (cachedSignIn) return cachedSignIn;
  cachedSignIn = (async () => {
    const envelopeB64 = process.env.NEXT_PUBLIC_FIREBASE_CUSTOM_TOKEN_B64;
    if (!envelopeB64) {
      throw new Error(
        "NEXT_PUBLIC_FIREBASE_CUSTOM_TOKEN_B64 is not set. The deployer injects this at build time.",
      );
    }
    const decoded =
      typeof atob === "function"
        ? atob(envelopeB64)
        : Buffer.from(envelopeB64, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as {
      readonly customToken: string;
      readonly appId: string;
    };
    const auth = getAuth(firebaseApp());
    const cred = await signInWithCustomToken(auth, parsed.customToken);
    return cred.user;
  })();
  return cachedSignIn;
}

export function currentUser(): User | null {
  return getAuth(firebaseApp()).currentUser;
}
