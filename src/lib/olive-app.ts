import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db, ensureSignedIn, firebaseApp } from "./firebase";

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

// App-shared scope. Every read/write here is at /apps/{appId}/{collection}
// and is gated by the request.auth.token.appId == appId Firestore rule.
// Use these for data that all users (or the only "user," in anonymous-per-app
// mode) of the deployed app share — settings, content, public listings.
export function appCollection(name: string): CollectionReference {
  return collection(db(), "apps", getAppId(), name);
}

export function appDoc(name: string, id: string): DocumentReference {
  return doc(db(), "apps", getAppId(), name, id);
}

// Per-user scope (opt-in, only available when the deployed app runs in
// `authMode: 'tenant'`). Reads/writes here go to
// /apps/{appId}/users/{uid}/{collection}, gated by BOTH request.auth.uid
// AND request.auth.token.appId via the firestore.rules block added
// 2026-05-22. Throws if no user is signed in — apps must gate per-user
// surfaces behind a SignInPage so the helper has a uid to work with.
function currentUid(): string {
  const u = getAuth(firebaseApp()).currentUser;
  if (!u) {
    throw new Error(
      "userCollection / userDoc require a signed-in user. Gate per-user data behind <SignInPage /> first.",
    );
  }
  return u.uid;
}

export function userCollection(name: string): CollectionReference {
  return collection(db(), "apps", getAppId(), "users", currentUid(), name);
}

export function userDoc(name: string, id: string): DocumentReference {
  return doc(db(), "apps", getAppId(), "users", currentUid(), name, id);
}

// Any data-reading component must await this once at mount before reading.
// The underlying sign-in promise is cached, so repeated calls are free.
//
// In tenant mode, ensureReady() only wires `auth.tenantId` — it does NOT
// produce a signed-in user. The app's SignInPage drives the actual
// sign-up / sign-in. Reading app-shared data still works after the user
// signs in (their ID token carries the appId claim attached by
// set-app-claim); reading per-user data requires a signed-in user.
//
// In anonymous-appid mode, ensureReady() signs in with the customToken
// and the resulting user carries appId in their token — same as v2.
export async function ensureReady(): Promise<void> {
  await ensureSignedIn();
}
