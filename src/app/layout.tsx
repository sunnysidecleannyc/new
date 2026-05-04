import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: '%s | Sunnyside Clean NYC',
    default: 'Sunnyside Clean NYC - Professional Cleaning Services in NYC From $59/hr',
  },
  description: 'NYC house cleaning & cleaning service from $59/hr. Manhattan, Brooklyn & Queens. Licensed, insured, 5.0★ rated. Book online or call (212) 202-9030.',
  metadataBase: new URL('https://www.cleaningservicesunnysideny.com'),
  manifest: '/manifest.json',
  keywords: [
    'NYC cleaning service', 'house cleaning NYC', 'apartment cleaning New York',
    'deep cleaning service Manhattan', 'cleaning service Brooklyn', 'cleaning service Queens',
    'move in cleaning NYC', 'office cleaning New York', 'same day cleaning NYC',
    'affordable cleaning service NYC', 'weekly cleaning service NYC',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Sunnyside Clean NYC',
    images: [{ url: 'https://www.cleaningservicesunnysideny.com/icon-512.png', width: 512, height: 512, alt: 'Sunnyside Clean NYC' }],
    title: 'Sunnyside Clean NYC - Professional Cleaning Services in NYC From $59/hr',
    description: 'NYC house cleaning & cleaning service from $59/hr. Manhattan, Brooklyn & Queens. Licensed, insured, 5.0★ rated.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sunnyside Clean NYC - NYC Cleaning Service From $59/hr',
    description: 'Professional house cleaning across NYC. 5.0★ rated. Licensed & insured. Book online or call (212) 202-9030.',
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  alternates: {
    canonical: 'https://www.cleaningservicesunnysideny.com',
    languages: {
      'en-US': 'https://www.cleaningservicesunnysideny.com',
      'x-default': 'https://www.cleaningservicesunnysideny.com',
    },
  },
  verification: {
    google: 'NNnXbWwC719b-mrOj9HIWyagIVKqKiiFLFMgcrKEHVE',
  },
  other: {
    'format-detection': 'telephone=yes',
    'geo.region': 'US-NY',
    'geo.placename': 'New York City',
    'geo.position': '40.7589;-73.9851',
    'ICBM': '40.7589, -73.9851',
    'contact:phone_number': '+1-212-202-9030',
    'contact:email': 'hi@thenycmaid.com',
    'business:contact_data:street_address': '150 W 47th St',
    'business:contact_data:locality': 'New York',
    'business:contact_data:region': 'NY',
    'business:contact_data:postal_code': '10036',
    'business:contact_data:country_name': 'United States',
    'rating': 'general',
    'revisit-after': '3 days',
    'distribution': 'global',
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
        <Script id="tawk-chat" strategy="beforeInteractive">{`
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
