import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin',
          '/book/',
          '/book',
          '/team/',
          '/team',
          '/apply/',
          '/apply',
          '/referral/',
          '/referral',
          '/feedback/',
          '/feedback',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://www.thenycmaid.com/sm.xml',
  }
}
