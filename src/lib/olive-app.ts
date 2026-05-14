import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
} from "firebase-admin/firestore";
import { getDb } from "./firebase";

// The app identifier is a public value — the provisioning endpoint sets it as
// NEXT_PUBLIC_OLIVE_APP_ID so it's available on both the build/server side
// (Server Components, Route Handlers, build-time prerender) and the client.
export function getAppId(): string {
  const appId = process.env.NEXT_PUBLIC_OLIVE_APP_ID;
  if (!appId) {
    throw new Error(
      "NEXT_PUBLIC_OLIVE_APP_ID is not set. The provisioning endpoint sets this when the repo is created.",
    );
  }
  return appId;
}

// Every Firestore read/write in a user app is scoped to /apps/{appId}/{name}.
// Security rules enforce the boundary; this helper makes the scoping
// impossible to forget at the call site.
export function appCollection(name: string): CollectionReference<DocumentData> {
  return getDb().collection("apps").doc(getAppId()).collection(name);
}

export function appDoc(
  collectionName: string,
  docId: string,
): DocumentReference<DocumentData> {
  return appCollection(collectionName).doc(docId);
}
