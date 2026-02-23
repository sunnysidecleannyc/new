import { ALL_NEIGHBORHOODS } from '@/lib/seo/locations'
import { AREAS } from '@/lib/seo/data/areas'
import { SERVICES } from '@/lib/seo/services'
import { BLOG_POSTS } from '@/lib/seo/blog-data'

const BASE_URL = 'https://www.cleaningservicesunnysideny.com'

export async function GET() {
  const now = new Date().toISOString()

  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = []

  // Homepage
  urls.push({ loc: BASE_URL, lastmod: now, changefreq: 'weekly', priority: '1.0' })

  // Static pages
  const staticPages = [
    { path: '/nyc-cleaning-services-offered', freq: 'weekly', pri: '0.9' },
    { path: '/service-areas', freq: 'weekly', pri: '0.9' },
    { path: '/about-nyc-cleaning-service-sunnyside-clean-nyc', freq: 'monthly', pri: '0.7' },
    { path: '/contact-nyc-cleaning-service-sunnyside-clean-nyc', freq: 'monthly', pri: '0.8' },
    { path: '/nyc-cleaning-service-pricing', freq: 'weekly', pri: '0.9' },
    { path: '/frequently-asked-cleaning-service-related-questions', freq: 'monthly', pri: '0.8' },
    { path: '/cleaning-tips-and-tricks', freq: 'weekly', pri: '0.7' },
  ]
  for (const p of staticPages) {
    urls.push({ loc: `${BASE_URL}${p.path}`, lastmod: now, changefreq: p.freq, priority: p.pri })
  }

  // Area pages (service-areas/{urlSlug})
  for (const area of AREAS) {
    urls.push({ loc: `${BASE_URL}/service-areas/${area.urlSlug}`, lastmod: now, changefreq: 'weekly', priority: '0.9' })
  }

  // Service pages (/services/{urlSlug})
  for (const service of SERVICES) {
    urls.push({ loc: `${BASE_URL}/services/${service.urlSlug}`, lastmod: now, changefreq: 'weekly', priority: '0.8' })
  }

  // Neighborhood pages (/service-areas/{urlSlug})
  for (const n of ALL_NEIGHBORHOODS) {
    urls.push({ loc: `${BASE_URL}/service-areas/${n.urlSlug}`, lastmod: now, changefreq: 'weekly', priority: '0.8' })
  }

  // Blog posts (/cleaning-tips-and-tricks/{slug})
  for (const post of BLOG_POSTS) {
    urls.push({ loc: `${BASE_URL}/cleaning-tips-and-tricks/${post.slug}`, lastmod: post.date, changefreq: 'monthly', priority: '0.7' })
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
