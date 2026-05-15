import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { db, ensureSignedIn } from "./firebase";

// The app identifier is a public value — the deployer sets it as
// NEXT_PUBLIC_OLIVE_APP_ID so it's available both at build time (static
// prerender) and in the inlined client bundle.
export function getAppId(): string {
  const appId = process.env.NEXT_PUBLIC_OLIVE_APP_ID;
  if (!appId) {
    throw new Error(
      "NEXT_PUBLIC_OLIVE_APP_ID is not set. The deployer sets this when the app is provisioned.",
    );
  }
  return appId;
}

// Every Firestore read/write is scoped to /apps/{appId}/{collection}. The
// custom-token auth user carries request.auth.token.appId == appId, and the
// Firestore rule allows this path and denies everything else. The helper
// makes that scoping impossible to forget at the call site.
export function appCollection(name: string): CollectionReference {
  return collection(db(), "apps", getAppId(), name);
}

export function appDoc(name: string, id: string): DocumentReference {
  return doc(db(), "apps", getAppId(), name, id);
}

// Any data-reading component must await this once at mount before reading.
// The underlying sign-in promise is cached, so repeated calls are free.
// Without it, Firestore rules reject reads with 'unauthenticated' because
// no appId claim is present.
export async function ensureReady(): Promise<void> {
  await ensureSignedIn();
}
