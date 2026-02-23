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
        <Script id="sc-analytics" src="https://www.thenycmaid.com/t.js" strategy="afterInteractive" />
        <Script id="tawk-chat" strategy="afterInteractive">{`
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/6823effa7c5b09190cd447fe/1ir662r4n';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
          })();
        `}</Script>
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
