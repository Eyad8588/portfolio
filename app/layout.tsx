import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import Chat from "@/components/Chat";
import ThemeToggle from "@/components/ThemeToggle";
import { getProfile } from "@/lib/content";

const profile = getProfile();

export const metadata: Metadata = {
  title: { default: `${profile.name} — ${profile.role}`, template: `%s · ${profile.name}` },
  description: profile.headline,
  openGraph: { title: `${profile.name} — ${profile.role}`, description: profile.headline, type: "website" },
};
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0d12" },
    { media: "(prefers-color-scheme: light)", color: "#f7f7fb" },
  ],
};

// Set the theme before first paint (no flash). Saved choice > OS preference.
const themeScript = `try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <header className="nav">
          <div className="wrap nav-inner">
            <Link href="/" className="logo">
              {profile.name}
              <span>.ai</span>
            </Link>
            <nav aria-label="Main">
              <Link href="/#about">About</Link>
              <Link href="/#stack">Stack</Link>
              <Link href="/#projects">Projects</Link>
              <Link href="/#contact">Contact</Link>
            </nav>
            <ThemeToggle />
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="footer">
          <div className="wrap">
            © {new Date().getFullYear()} {profile.name} · Built with Next.js · The chat runs a local model in your browser.
          </div>
        </footer>
        <Chat />
      </body>
    </html>
  );
}
