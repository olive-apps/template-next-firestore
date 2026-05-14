import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// Neutral title — no Olive branding in the user-facing app. The worker will
// rewrite this based on the PRD.
export const metadata: Metadata = {
  title: "App",
  description: "A small app.",
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <main className="mx-auto max-w-2xl px-6 py-12">{children}</main>
      </body>
    </html>
  );
}
