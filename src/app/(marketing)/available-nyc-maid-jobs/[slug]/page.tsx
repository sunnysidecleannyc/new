import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ALL_NEIGHBORHOODS, getNeighborhoodsByArea, type Neighborhood } from '@/lib/seo/locations'
import { AREAS } from '@/lib/seo/data/areas'
import { breadcrumbSchema, localBusinessSchema } from '@/lib/seo/schema'
import JsonLd from '@/components/marketing/JsonLd'
import Breadcrumbs from '@/components/marketing/Breadcrumbs'

export function generateStaticParams() {
  return ALL_NEIGHBORHOODS.map(n => ({ slug: n.slug }))
}

function getNeighborhood(slug: string): Neighborhood | undefined {
  return ALL_NEIGHBORHOODS.find(n => n.slug === slug)
}

function getAreaName(areaSlug: string): string {
  return AREAS.find(a => a.slug === areaSlug)?.name || areaSlug
}

function getStateAbbr(areaSlug: string): string {
  if (areaSlug === 'new-jersey') return 'NJ'
  return 'NY'
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const n = getNeighborhood(slug)
  if (!n) return {}

  const title = `🧹 Cleaning Jobs in ${n.name} — Starting $30/hr + Bonuses | Trabajo de Limpieza`
  const description = `💰 Now hiring cleaners in ${n.name}! Starting $30/hr + bonus programs. Zelle in <30 min. 100% tips. Open 24/7 🇺🇸🇪🇸 | Contratando en ${n.name} — desde $30/hr + bonos. (212) 202-8400`

  return {
    title,
    description,
    alternates: { canonical: `https://www.thenycmaid.com/available-nyc-maid-jobs/${n.slug}` },
    openGraph: {
      title: `Cleaning Jobs in ${n.name} | The NYC Maid`,
      description,
      url: `https://www.thenycmaid.com/available-nyc-maid-jobs/${n.slug}`,
    },
  }
}

export default async function NeighborhoodJobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const n = getNeighborhood(slug)
  if (!n) notFound()

  const areaName = getAreaName(n.area)
  const stateAbbr = getStateAbbr(n.area)
  const nearby = ALL_NEIGHBORHOODS.filter(nb => n.nearby.includes(nb.slug)).slice(0, 6)
  const sameArea = getNeighborhoodsByArea(n.area).filter(nb => nb.slug !== n.slug).slice(0, 12)

  const jobSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: `Professional House Cleaner — ${n.name}`,
    description: `Now hiring experienced house cleaners in ${n.name}, ${areaName}. Starting at $30/hr paid via Zelle within 30 minutes of every completed job. Bonus programs for retention, client satisfaction, and five-star reviews. 100% of tips are yours. Flexible schedule 24/7. Full bilingual team portal (English/Spanish) with GPS, job details, and payment tracking. Apply at thenycmaid.com/apply or text (212) 202-8400.`,
    datePosted: '2026-02-01',
    validThrough: '2026-12-31',
    employmentType: ['FULL_TIME', 'PART_TIME'],
    hiringOrganization: {
      '@type': 'Organization',
      name: 'The NYC Maid',
      sameAs: 'https://www.thenycmaid.com',
      logo: 'https://www.thenycmaid.com/icon-512.png',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: n.name,
        addressRegion: stateAbbr,
        postalCode: n.zip_codes[0],
        addressCountry: 'US',
      },
      geo: { '@type': 'GeoCoordinates', latitude: n.lat, longitude: n.lng },
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: { '@type': 'QuantitativeValue', value: 30, minValue: 30, unitText: 'HOUR' },
    },
    directApply: true,
    industry: 'Cleaning Services',
    occupationalCategory: '37-2012.00',
    qualifications: 'Minimum 1 year professional cleaning experience. Must pass background check. Must provide own cleaning supplies.',
    jobBenefits: 'Same-day Zelle pay within 30 minutes, bonus programs for retention and client satisfaction and five-star reviews, 100% of tips, flexible scheduling 24/7, bilingual team portal (English/Spanish), GPS directions, steady recurring clients',
    workHours: 'Flexible — set your own schedule',
    experienceRequirements: {
      '@type': 'OccupationalExperienceRequirements',
      monthsOfExperience: 12,
    },
  }

  return (
    <>
      <JsonLd data={[
        localBusinessSchema(),
        breadcrumbSchema([
          { name: 'Home', url: 'https://www.thenycmaid.com' },
          { name: 'Careers', url: 'https://www.thenycmaid.com/available-nyc-maid-jobs' },
          { name: `Jobs in ${n.name}`, url: `https://www.thenycmaid.com/available-nyc-maid-jobs/${n.slug}` },
        ]),
        jobSchema,
      ]} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#1E2A4A] to-[#243352] py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-[#A8F0DC] text-sm font-semibold tracking-[0.2em] uppercase mb-4">Now Hiring in {n.name}</p>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[#A8F0DC] text-xs font-semibold tracking-[0.2em] uppercase">Open 24/7</p>
            <span className="text-white/30">·</span>
            <p className="text-white/60 text-xs">NYC, Long Island &amp; NJ</p>
          </div>
          <h1 className="font-[family-name:var(--font-bebas)] text-3xl md:text-5xl lg:text-6xl text-white tracking-wide leading-[0.95] mb-6">
            Cleaning Jobs in {n.name} — Starting $30/hr + Bonuses
          </h1>
          <p className="text-white/60 text-lg max-w-2xl leading-relaxed mb-4">
            We need experienced cleaners in {n.name}, {areaName}. You bring your skills and supplies — we bring steady clients, starting at $30/hr paid via Zelle within 30 minutes, bonus programs for top performers, and 100% of tips go directly to you.
          </p>
          <p className="text-white/60 text-lg max-w-2xl leading-relaxed mb-4">
            Necesitamos limpiadores experimentados en {n.name}. Trae tus habilidades y suministros — nosotros traemos clientes estables, desde $30/hr por Zelle en menos de 30 minutos, programas de bonos, y el 100% de las propinas son tuyas.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-5 mt-8">
            <Link href="/apply" className="bg-[#A8F0DC] text-[#1E2A4A] px-10 py-4 rounded-lg font-bold text-sm tracking-widest uppercase hover:bg-[#8DE8CC] transition-colors">
              Apply Now / Aplica Ahora
            </Link>
            <a href="sms:2122028400" className="text-white/70 font-medium text-lg py-4 hover:text-white transition-colors underline underline-offset-4">
              or Text (212) 202-8400
            </a>
          </div>
        </div>
      </section>

      {/* Pay highlights */}
      <section className="bg-[#A8F0DC] py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#1E2A4A] tracking-wide">$30/hr</p>
              <p className="text-[#1E2A4A]/60 text-xs font-medium">Every Job</p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#1E2A4A] tracking-wide">&lt;30 Min</p>
              <p className="text-[#1E2A4A]/60 text-xs font-medium">Zelle Pay</p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#1E2A4A] tracking-wide">100%</p>
              <p className="text-[#1E2A4A]/60 text-xs font-medium">Tips Are Yours</p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#1E2A4A] tracking-wide">Flexible</p>
              <p className="text-[#1E2A4A]/60 text-xs font-medium">Your Schedule</p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-bebas)] text-3xl text-[#1E2A4A] tracking-wide">Bilingue</p>
              <p className="text-[#1E2A4A]/60 text-xs font-medium">EN / ES Portal</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <Breadcrumbs items={[
          { name: 'Careers', href: '/available-nyc-maid-jobs' },
          { name: `Jobs in ${n.name}`, href: `/available-nyc-maid-jobs/${n.slug}` },
        ]} />

        {/* About this neighborhood */}
        <section className="mb-16">
          <h2 className="font-[family-name:var(--font-bebas)] text-3xl text-[#1E2A4A] tracking-wide mb-4">Why Clean in {n.name}? / ¿Por Qué Limpiar en {n.name}?</h2>
          <p className="text-gray-600 text-lg mb-3">
            {n.name} is one of our busiest areas. Residents here have {n.housing_types.slice(0, 3).join(', ')}, and they need reliable, experienced cleaners they can trust. Cleaning in {n.name} means steady recurring clients, short commutes if you live nearby, and consistent work.
          </p>
          <p className="text-gray-400 italic mb-6">
            {n.name} es una de nuestras áreas más activas. Los residentes necesitan limpiadores confiables y experimentados. Limpiar en {n.name} significa clientes recurrentes estables, viajes cortos si vives cerca, y trabajo constante.
          </p>
          {n.zip_codes.length > 0 && (
            <p className="text-gray-500 text-sm">Zip codes served / Códigos postales: {n.zip_codes.join(', ')}</p>
          )}
        </section>

        {/* What we offer — bilingual */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-[#1E2A4A] tracking-wide mb-4">What You Get</h2>
            <div className="space-y-3">
              {[
                { icon: '💰', en: '$30/hr — paid via Zelle within 30 minutes of every completed job', es: '$30/hr — pagado por Zelle en menos de 30 minutos' },
                { icon: '💵', en: '100% of tips are yours — we never take a cut', es: '100% de las propinas son tuyas — nunca tomamos nada' },
                { icon: '📱', en: 'Full team portal — track jobs, payments, GPS directions, client notes', es: 'Portal completo del equipo — trabajos, pagos, GPS, notas de clientes' },
                { icon: '🗓️', en: 'Flexible schedule — you choose your days and hours', es: 'Horario flexible — tú eliges tus días y horas' },
                { icon: '🔄', en: 'Steady recurring clients — reliable weekly/biweekly income', es: 'Clientes recurrentes — ingresos semanales confiables' },
                { icon: '🌐', en: 'Bilingual portal — full English & Spanish support', es: 'Portal bilingüe — soporte completo en inglés y español' },
                { icon: '📍', en: 'GPS directions to every job — never get lost', es: 'Direcciones GPS a cada trabajo — nunca te pierdas' },
                { icon: '📋', en: 'Detailed job notes — know exactly what each client expects', es: 'Notas detalladas — sabe exactamente lo que espera cada cliente' },
              ].map(item => (
                <div key={item.en} className="flex gap-3 items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-gray-800 text-sm">{item.en}</p>
                    <p className="text-gray-400 text-xs italic">{item.es}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-[#1E2A4A] tracking-wide mb-4">Team Portal / Portal del Equipo</h2>
            <p className="text-gray-600 text-sm mb-2">
              Every team member gets access to our full team portal — available in English and Spanish. Here&apos;s what you can do:
            </p>
            <p className="text-gray-400 text-xs italic mb-4">
              Cada miembro del equipo tiene acceso a nuestro portal completo — disponible en inglés y español.
            </p>
            <div className="border border-gray-200 rounded-xl p-6 space-y-3">
              {[
                { feature: 'View all upcoming jobs', detail: 'Date, time, address, service type, and pay rate', es: 'Ver todos los trabajos — fecha, hora, dirección, tarifa' },
                { feature: 'GPS directions', detail: 'One-tap navigation to every job location', es: 'Direcciones GPS a cada trabajo' },
                { feature: 'Client notes', detail: 'Special instructions directly from the client — preferences, access codes, focus areas', es: 'Notas del cliente — instrucciones, códigos de acceso' },
                { feature: 'Payment tracking', detail: 'See every payment sent — amount, date, and confirmation', es: 'Seguimiento de pagos — monto, fecha, confirmación' },
                { feature: 'Check in / check out', detail: 'Log your start and end times for every job', es: 'Entrada/salida — registra tus horas' },
                { feature: 'Job history', detail: 'Full history of every job you\'ve completed and payment received', es: 'Historial completo de trabajos y pagos' },
                { feature: 'Claim available jobs', detail: 'When new jobs open up in your area, claim them directly from the portal', es: 'Reclama trabajos nuevos en tu área directamente' },
              ].map(item => (
                <div key={item.feature}>
                  <p className="font-semibold text-[#1E2A4A] text-sm">{item.feature}</p>
                  <p className="text-gray-500 text-xs">{item.detail}</p>
                  <p className="text-gray-400 text-xs italic">{item.es}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who we're looking for */}
        <section className="bg-[#1E2A4A] rounded-xl p-8 md:p-10 mb-16">
          <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-white tracking-wide mb-2">Who We&apos;re Looking For / A Quién Buscamos</h2>
          <p className="text-white/50 text-sm mb-6">We need fully devoted team members who take pride in their work and treat every client&apos;s home like their own.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { en: 'Minimum 1 year professional cleaning experience', es: 'Mínimo 1 año de experiencia profesional en limpieza' },
              { en: 'Bring your own supplies and equipment', es: 'Trae tus propios suministros y equipo' },
              { en: 'Reliable, punctual, and detail-oriented', es: 'Confiable, puntual y detallista' },
              { en: 'Must pass background check', es: 'Debe pasar verificación de antecedentes' },
              { en: 'Positive attitude and professional demeanor', es: 'Actitud positiva y comportamiento profesional' },
              { en: 'Committed to quality — every job, every time', es: 'Comprometido con la calidad — cada trabajo, cada vez' },
            ].map(item => (
              <div key={item.en} className="flex items-start gap-3">
                <span className="text-[#A8F0DC] mt-0.5 flex-shrink-0">&#10003;</span>
                <div>
                  <p className="text-white text-sm">{item.en}</p>
                  <p className="text-white/40 text-xs italic">{item.es}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Earnings */}
        <section className="bg-[#A8F0DC] rounded-xl p-8 md:p-10 mb-16">
          <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-[#1E2A4A] tracking-wide mb-1">Potential Earnings in {n.name}</h2>
          <p className="text-[#1E2A4A]/40 text-xs italic mb-6">Ganancias Potenciales en {n.name}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-[#1E2A4A]/50 text-xs uppercase tracking-widest mb-1">Part-Time / Medio Tiempo</p>
              <p className="font-bold text-[#1E2A4A] text-2xl">$375/week</p>
              <p className="text-[#1E2A4A]/50 text-xs mt-1">5 jobs/week + tips / 5 trabajos/semana + propinas</p>
            </div>
            <div>
              <p className="text-[#1E2A4A]/50 text-xs uppercase tracking-widest mb-1">Regular</p>
              <p className="font-bold text-[#1E2A4A] text-2xl">$750/week</p>
              <p className="text-[#1E2A4A]/50 text-xs mt-1">10 jobs/week + tips / 10 trabajos/semana + propinas</p>
            </div>
            <div>
              <p className="text-[#1E2A4A]/50 text-xs uppercase tracking-widest mb-1">Full-Time / Tiempo Completo</p>
              <p className="font-bold text-[#1E2A4A] text-2xl">$1,350–$1,500/week</p>
              <p className="text-[#1E2A4A]/50 text-xs mt-1">18–20 jobs/week + tips / 18–20 trabajos/semana + propinas</p>
            </div>
          </div>
          <p className="text-center text-[#1E2A4A]/50 text-xs mt-4">Based on average 2.5 hour job at $30/hr. 100% of tips go to you.</p>
          <p className="text-center text-[#1E2A4A]/30 text-xs italic mt-1">Basado en trabajo promedio de 2.5 horas a $30/hr. 100% de las propinas son tuyas.</p>
        </section>

        {/* Apply CTA */}
        <section className="border-2 border-[#1E2A4A] rounded-xl p-8 md:p-10 mb-16 text-center">
          <h2 className="font-[family-name:var(--font-bebas)] text-3xl text-[#1E2A4A] tracking-wide mb-2">Ready to Start? / ¿Listo para Empezar?</h2>
          <p className="text-gray-600 mb-6">Apply in 2 minutes. We review applications within 24–48 hours.<br/>Aplica en 2 minutos. Revisamos solicitudes en 24–48 horas.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link href="/apply" className="bg-[#1E2A4A] text-white px-10 py-4 rounded-lg font-bold text-sm tracking-widest uppercase hover:bg-[#1E2A4A]/90 transition-colors">
              Apply Now / Aplica Ahora
            </Link>
            <a href="sms:2122028400" className="text-[#1E2A4A] font-semibold underline underline-offset-4 hover:no-underline">
              Text (212) 202-8400
            </a>
          </div>
        </section>

        {/* Nearby job openings */}
        {nearby.length > 0 && (
          <section className="mb-16">
            <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-[#1E2A4A] tracking-wide mb-4">Also Hiring Nearby / También Contratando Cerca</h2>
            <div className="flex flex-wrap gap-2">
              {nearby.map(nb => (
                <Link key={nb.slug} href={`/available-nyc-maid-jobs/${nb.slug}`} className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-[#A8F0DC]/20 hover:text-[#1E2A4A] transition-colors">
                  {nb.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* More jobs in the area */}
        {sameArea.length > 0 && (
          <section className="mb-16">
            <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-[#1E2A4A] tracking-wide mb-4">More Jobs in {areaName} / Más Trabajos en {areaName}</h2>
            <div className="flex flex-wrap gap-2">
              {sameArea.map(nb => (
                <Link key={nb.slug} href={`/available-nyc-maid-jobs/${nb.slug}`} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-[#A8F0DC]/20 hover:text-[#1E2A4A] transition-colors">
                  {nb.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="text-center">
          <Link href="/available-nyc-maid-jobs" className="text-[#1E2A4A] font-semibold hover:underline">&larr; View All Positions / Ver Todas las Posiciones</Link>
        </div>
      </div>
    </>
  )
}
