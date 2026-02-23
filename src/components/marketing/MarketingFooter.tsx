import Link from 'next/link'

const manhattanLinks = [
  { name: 'Upper East Side', href: '/service-areas/upper-east-side-cleaning-services' },
  { name: 'Upper West Side', href: '/service-areas/upper-west-side-cleaning-services' },
  { name: 'Midtown', href: '/service-areas/midtown-manhattan-cleaning-services' },
  { name: "Hell's Kitchen", href: '/service-areas/hells-kitchen-cleaning-services' },
  { name: 'Chelsea', href: '/service-areas/chelsea-cleaning-services' },
  { name: 'SoHo', href: '/service-areas/soho-cleaning-services' },
  { name: 'Tribeca', href: '/service-areas/tribeca-cleaning-services' },
  { name: 'West Village', href: '/service-areas/west-village-cleaning-services' },
  { name: 'East Village', href: '/service-areas/east-village-cleaning-services' },
  { name: 'Financial District', href: '/service-areas/financial-district-cleaning-services' },
  { name: 'Gramercy', href: '/service-areas/gramercy-cleaning-services' },
  { name: 'Murray Hill', href: '/service-areas/murray-hill-cleaning-services' },
]

const otherAreaLinks = [
  { name: 'Brooklyn Heights', href: '/service-areas/brooklyn-heights-cleaning-services' },
  { name: 'Park Slope', href: '/service-areas/park-slope-cleaning-services' },
  { name: 'DUMBO', href: '/service-areas/dumbo-cleaning-services' },
  { name: 'Williamsburg', href: '/service-areas/williamsburg-cleaning-services' },
  { name: 'Long Island City', href: '/service-areas/long-island-city-cleaning-services' },
  { name: 'Astoria', href: '/service-areas/astoria-cleaning-services' },
  { name: 'Forest Hills', href: '/service-areas/forest-hills-cleaning-services' },
  { name: 'Sunnyside', href: '/service-areas/sunnyside-cleaning-services' },
]

const serviceFooterLinks = [
  { name: 'Deep Cleaning', href: '/services/nyc-deep-cleaning-service' },
  { name: 'Apartment Cleaning', href: '/services/nyc-apartment-cleaning-service' },
  { name: 'House Cleaning', href: '/services/nyc-house-cleaning-service' },
  { name: 'Moving Cleaning', href: '/services/nyc-moving-cleaning-service' },
  { name: 'Same-Day Cleaning', href: '/services/nyc-same-day-cleaning-service' },
  { name: 'Window Cleaning', href: '/services/nyc-window-cleaning-service' },
  { name: 'Junk Removal', href: '/services/nyc-junk-removal-cleaning-service' },
  { name: 'Home Organizing', href: '/services/nyc-home-organizing-service' },
  { name: 'Common Area Cleaning', href: '/services/nyc-common-area-cleaning-service' },
  { name: 'Office Cleaning', href: '/services/nyc-office-cleaning-service' },
  { name: 'Recurring Cleaning', href: '/services/nyc-maid-service' },
]

export default function MarketingFooter() {
  return (
    <footer className="bg-[#1E2A4A] text-gray-400">
      {/* Main footer brand */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <h2 className="font-[family-name:var(--font-bebas)] text-white text-3xl md:text-4xl tracking-wide text-center mb-1">Sunnyside Clean NYC</h2>
        <p className="text-center text-gray-400 text-sm tracking-wide mb-2">A NYC Maid Services Company</p>
        <div className="w-16 h-[2px] bg-[#A8F0DC] mx-auto mb-12" />
      </div>

      {/* Links grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
          <div>
            <h3 className="text-xs font-semibold text-gray-300 tracking-[0.2em] uppercase mb-5">Manhattan</h3>
            <ul className="space-y-2.5">
              {manhattanLinks.map(link => (
                <li key={link.href}><Link href={link.href} className="text-sm hover:text-white transition-colors">{link.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-300 tracking-[0.2em] uppercase mb-5">More Areas</h3>
            <ul className="space-y-2.5">
              {otherAreaLinks.map(link => (
                <li key={link.href}><Link href={link.href} className="text-sm hover:text-white transition-colors">{link.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-300 tracking-[0.2em] uppercase mb-5">Services</h3>
            <ul className="space-y-2.5">
              {serviceFooterLinks.map(link => (
                <li key={link.href}><Link href={link.href} className="text-sm hover:text-white transition-colors">{link.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-300 tracking-[0.2em] uppercase mb-5">Company</h3>
            <ul className="space-y-2.5">
              <li><Link href="/about-nyc-cleaning-service-sunnyside-clean-nyc" className="text-sm hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact-nyc-cleaning-service-sunnyside-clean-nyc" className="text-sm hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/nyc-cleaning-service-pricing" className="text-sm hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/frequently-asked-cleaning-service-related-questions" className="text-sm hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/service-areas" className="text-sm hover:text-white transition-colors">Service Areas</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-300 tracking-[0.2em] uppercase mb-5">Resources</h3>
            <ul className="space-y-2.5">
              <li><a href="https://buy.stripe.com/8x2aEZ4FL0wYfxe5f0fnO03" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors">Make a Payment</a></li>
              <li><a href="https://www.thenycmaid.com/book/new" className="text-sm hover:text-white transition-colors">Book a Cleaning</a></li>
              <li><Link href="/cleaning-tips-and-tricks" className="text-sm hover:text-white transition-colors">Cleaning Tips</Link></li>
              <li><a href="mailto:hello@cleaningservicesunnysideny.com" className="text-sm hover:text-white transition-colors">Email Us</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500">
            <Link href="/privacy-policy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="/terms-conditions" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="/refund-policy" className="hover:text-gray-300 transition-colors">Refunds</Link>
            <Link href="/legal" className="hover:text-gray-300 transition-colors">Legal</Link>
            <Link href="/do-not-share-policy" className="hover:text-gray-300 transition-colors">Do Not Share</Link>
          </div>
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Sunnyside Clean NYC &middot; A NYC Maid Services Company &middot; <a href="tel:2122028400" className="text-[#A8F0DC]/70 hover:text-[#A8F0DC]">(212) 202-8400</a> &middot; NYC Web Design by{' '}<a href="https://www.consortiumnyc.com/" target="_blank" rel="noopener noreferrer" className="text-[#A8F0DC] font-semibold hover:text-white underline underline-offset-2 decoration-[#A8F0DC]/50">Consortium NYC</a></p>
        </div>
      </div>
    </footer>
  )
}
