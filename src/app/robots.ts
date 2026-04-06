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
          '/api/',
        ],
      },
      // Allow AI search crawlers (ChatGPT, Claude, Perplexity, Apple)
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'Claude-Web', 'anthropic-ai', 'Applebot', 'PerplexityBot'],
        allow: '/',
        disallow: [
          '/admin/',
          '/admin',
          '/book/',
          '/book',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://www.cleaningservicesunnysideny.com/sm.xml',
    host: 'https://www.cleaningservicesunnysideny.com',
  }
}
