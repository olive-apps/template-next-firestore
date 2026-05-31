import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Neutral title — no Olive branding in the user-facing app. The worker will
// rewrite this based on the PRD.
export const metadata: Metadata = {
  title: "App",
  description: "A small app.",
};

// Editorial type stack — see OLIVE_APPS_DESIGN_LANGUAGE.md "The Roles".
// Variable fonts; next/font's contract is that when `axes` is specified,
// `weight` must be omitted (the font ships as a full variable axis range).
// Fraunces opens its opsz + SOFT axes; Inter and JetBrains Mono stay on
// their full variable weight range.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Inline pre-paint theme + font-size restorer. Reads localStorage and sets
// the attributes on <html> before first paint so the page never flashes the
// wrong mode or size on load.
const themeScript = `
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
    }
    var s = localStorage.getItem('fontSize');
    if (s && ['xs','s','m','l','xl'].indexOf(s) !== -1) {
      document.documentElement.setAttribute('data-font-size', s);
    }
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Material Symbols Outlined — single icon source. Variable font;
            the .material-symbols-outlined class in globals.css pins
            FILL/wght/GRAD/opsz defaults. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <main className="mx-auto max-w-2xl px-6 py-12 lg:px-12">{children}</main>
      </body>
    </html>
  );
}
