import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: {
    default: "EZTrack — Event Operations Platform",
    template: "%s | EZTrack",
  },
  description:
    "Advanced event guard and incident management system for festival security operations",
  openGraph: {
    title: "EZTrack — Event Operations Platform",
    description: "Advanced event guard and incident management system",
    type: "website",
  },
};

/* Inline theme script prevents FOUC — reads localStorage before paint.
   Content is a static literal string; no user data flows into it. */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('eztrack-theme');if(t==='light')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Safe: static string literal, no user-controlled data */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="min-h-screen antialiased font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','SF_Pro_Text','Inter',system-ui,sans-serif]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
