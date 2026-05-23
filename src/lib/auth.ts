"use client";

import {
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getAuth,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { firebaseApp, readEnvelopeFromEnv } from "./firebase";

// Opt-in end-user auth helpers for apps deployed in `authMode: 'tenant'`.
//
// All helpers assume `ensureSignedIn()` from `./firebase.ts` has already run
// (it sets `auth.tenantId = tenantId` for tenant-mode envelopes). The
// SignInPage component awaits ensureSignedIn() once at mount and then calls
// these helpers from event handlers.
//
// Until Bill flips Identity Platform multi-tenancy on the project, every
// deployed envelope is `authMode: 'anonymous-appid'` and this whole module
// is dormant. Apps that still wire the SignInPage component get an
// auth.tenantId = null at runtime and these helpers will fail with the
// underlying Firebase error — which is the right behavior, because the
// app shouldn't be running in tenant mode if the envelope didn't ship one.

// The api-pipeline route that attaches the appId custom claim onto a
// newly-signed-up tenant user. Without the claim, Firestore + Storage rules
// deny access at `apps/{appId}/users/{uid}/**`. The route is documented at
// api-pipeline/src/app/routes/ios/integrations/setAppClaimRoute.ts.
const SET_APP_CLAIM_URL = "https://api.olive.is/ios/v1/integrations/olive-apps/set-app-claim";

// Sign up a new end-user account inside the app's tenant. After
// createUserWithEmailAndPassword succeeds the new user's ID token does
// NOT carry an appId claim — Firestore + Storage rules at
// apps/{appId}/users/{uid}/** therefore deny access. We POST to
// set-app-claim to attach the claim, then force a token refresh so the
// claim takes effect immediately. Without the refresh the user's
// existing ID token (cached on the client) would lack the claim until
// it naturally expires (~1h).
export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const auth = getAuth(firebaseApp());
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const envelope = readEnvelopeFromEnv();
  if (envelope.authMode !== "tenant" || !envelope.tenantId) {
    // The app's deploy isn't in tenant mode — the set-app-claim route
    // would reject this call anyway. Throw early so the caller sees a
    // clear error instead of a 403.
    throw new Error(
      "signUpWithEmail requires authMode='tenant' — the deployer must opt in.",
    );
  }
  const idToken = await cred.user.getIdToken();
  const resp = await fetch(SET_APP_CLAIM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ tenantId: envelope.tenantId, uid: cred.user.uid }),
  });
  if (!resp.ok) {
    // Surface the server error in the message so the SignInPage can show
    // it. The caller decides whether to surface or retry — the new user
    // is signed in but lacks the appId claim, so subsequent Firestore
    // reads will fail until the claim is set.
    const body = await resp.text();
    throw new Error(`set-app-claim ${resp.status}: ${body.slice(0, 200)}`);
  }
  // Force-refresh so the new ID token carries the appId claim. Without
  // this the SDK keeps the un-claimed token for ~1h and rules deny reads.
  await cred.user.getIdToken(true);
  return cred.user;
}

// Sign in an existing end-user inside the tenant. The user's appId claim
// was attached at sign-up time; no second set-app-claim call is needed.
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const auth = getAuth(firebaseApp());
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOutCurrent(): Promise<void> {
  const auth = getAuth(firebaseApp());
  await signOut(auth);
}

// Sign in with the envelope's app-shared customToken — no end-user
// identity, just the appId claim. Useful when the app offers a
// "continue without an account" path so visitors can browse app-shared
// data (apps/{appId}/{document=**}) without committing to an account.
export async function continueAsAppAnonymous(): Promise<User> {
  const envelope = readEnvelopeFromEnv();
  const auth = getAuth(firebaseApp());
  const cred = await signInWithCustomToken(auth, envelope.customToken);
  return cred.user;
}

// React hook that subscribes to onAuthStateChanged and re-renders when the
// signed-in user changes. Returns null while loading or signed-out, so
// callers must distinguish "still loading" (initial render) from
// "signed out" (post-signOut). The simplest pattern is to render
// `<SignInPage />` whenever the hook returns null — the gate composes
// over both states.
export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(() => {
    // Synchronously read currentUser on first render so we don't flash
    // SignInPage when the user is already signed in.
    return getAuth(firebaseApp()).currentUser;
  });
  useEffect(() => {
    const auth = getAuth(firebaseApp());
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
    });
    return () => {
      unsub();
    };
  }, []);
  return user;
}
