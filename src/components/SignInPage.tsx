"use client";

import { useState, type FormEvent } from "react";
import {
  continueAsAppAnonymous,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/auth";

// Opt-in sign-in surface for apps deployed in `authMode: 'tenant'`. Wire
// this only when the spec calls for end-user accounts — for the default
// anonymous-per-app deploy mode, the homepage renders directly.
//
// Composition pattern (in `page.tsx` or a layout):
//
//     "use client";
//     import { useCurrentUser } from "@/lib/auth";
//     import { SignInPage } from "@/components/SignInPage";
//     export default function Page() {
//       const user = useCurrentUser();
//       if (!user) return <SignInPage />;
//       return <HomePage />;
//     }
//
// Visual register matches the rest of the template — serif, third-person
// captions, no marketing voice, no exclamation. Native form elements
// only; no UI library.

type Mode = "signin" | "signup";

export function SignInPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      // useCurrentUser() in the parent component re-renders past the gate
      // once the auth state changes — no router push needed.
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  async function onContinueAnonymous() {
    setError(null);
    setBusy(true);
    try {
      await continueAsAppAnonymous();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  const otherMode: Mode = mode === "signin" ? "signup" : "signin";

  return (
    <div className="mx-auto max-w-sm space-y-8 py-12">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl tracking-editorial">
          {mode === "signin" ? "Sign in" : "Sign up"}
        </h1>
        <p className="text-base text-[var(--muted)]">
          {mode === "signin"
            ? "Enter the email and password used at sign-up."
            : "A small account, scoped to this app."}
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="font-serif text-sm text-[var(--muted)]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full border-b border-[var(--hairline)] bg-transparent py-2 font-serif text-base outline-none focus:border-[var(--foreground)]"
          />
        </label>
        <label className="block space-y-1">
          <span className="font-serif text-sm text-[var(--muted)]">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full border-b border-[var(--hairline)] bg-transparent py-2 font-serif text-base outline-none focus:border-[var(--foreground)]"
          />
        </label>
        {error ? (
          <p className="font-serif text-sm text-[var(--muted)]">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full border border-[var(--foreground)] py-2 font-serif tracking-editorial disabled:opacity-50"
        >
          {busy
            ? "Olive is thinking."
            : mode === "signin"
              ? "SIGN IN"
              : "SIGN UP"}
        </button>
      </form>

      <div className="space-y-3 text-center">
        <button
          type="button"
          onClick={() => {
            setMode(otherMode);
            setError(null);
          }}
          className="font-serif text-sm text-[var(--muted)] underline-offset-4 hover:underline"
        >
          {mode === "signin"
            ? "No account. Sign up instead."
            : "Have an account. Sign in instead."}
        </button>
        <div>
          <button
            type="button"
            onClick={onContinueAnonymous}
            disabled={busy}
            className="font-serif text-sm text-[var(--muted)] underline-offset-4 hover:underline disabled:opacity-50"
          >
            Continue without an account.
          </button>
        </div>
      </div>
    </div>
  );
}

function messageFor(err: unknown): string {
  if (err instanceof Error) {
    // Strip Firebase's bracketed error code prefix; the user just needs
    // one sentence about what didn't happen.
    const m = /\/(.+?)\)/.exec(err.message);
    if (m && m[1]) {
      return humanize(m[1]);
    }
    return err.message;
  }
  return "Something didn't work. Try again, or come back in a moment.";
}

function humanize(code: string): string {
  switch (code) {
    case "email-already-in-use":
      return "That email already has an account here. Try signing in.";
    case "invalid-email":
      return "That email looks off. Check it and try again.";
    case "weak-password":
      return "Pick a longer password — at least six characters.";
    case "wrong-password":
    case "invalid-credential":
      return "The email and password don't match. Try again.";
    case "user-not-found":
      return "No account for that email. Sign up instead.";
    case "too-many-requests":
      return "Too many tries in a row. Wait a moment before the next.";
    default:
      return "Something didn't work. Try again, or come back in a moment.";
  }
}
