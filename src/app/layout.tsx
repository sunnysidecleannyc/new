import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: '%s | Sunnyside Clean NYC',
    default: 'Sunnyside Clean NYC - Professional Cleaning Services in NYC',
  },
  description: 'NYC cleaning service from $49/hr. Manhattan, Brooklyn, Queens & surrounding areas. Licensed, insured, 5.0-star Google rating. (212) 202-8400',
  metadataBase: new URL('https://www.cleaningservicesunnysideny.com'),
  manifest: '/manifest.json',
  verification: {
    google: 'NNnXbWwC719b-mrOj9HIWyagIVKqKiiFLFMgcrKEHVE',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script id="nycmaid-analytics" src="/t.js" strategy="afterInteractive" />
        <Script id="error-catcher" strategy="beforeInteractive">{`
          window.addEventListener('error', function(e) {
            if (!e.message) return;
            fetch('/api/errors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: e.message, stack: e.error?.stack, url: location.href, source: 'window.onerror' })
            }).catch(function(){});
          });
          window.addEventListener('unhandledrejection', function(e) {
            var msg = e.reason?.message || String(e.reason);
            fetch('/api/errors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: msg, stack: e.reason?.stack, url: location.href, source: 'unhandled-promise' })
            }).catch(function(){});
          });
        `}</Script>
      </body>
    </html>
  );
}
