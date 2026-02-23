'use client'
import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import WebsitesMap from '@/components/WebsitesMap'

interface Website {
  domain: string
  location: string
  region: string
  url: string
  lat?: number
  lng?: number
}

export default function WebsitesPage() {
  useEffect(() => { document.title = 'Websites | The NYC Maid' }, []);
  const [websites, setWebsites] = useState<Website[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')

  useEffect(() => {
    loadWebsites()
  }, [])

  const loadWebsites = () => {
    const sites: Website[] = [
      // ========== MANHATTAN ==========
      // Upper East Side
      { domain: 'uesmaid.com', location: 'Upper East Side', region: 'Manhattan', url: 'https://uesmaid.com', lat: 40.7736, lng: -73.9566 },
      { domain: 'uescleaningservice.com', location: 'Upper East Side', region: 'Manhattan', url: 'https://uescleaningservice.com', lat: 40.7736, lng: -73.9566 },
      { domain: 'uescarpetcleaner.com', location: 'Upper East Side', region: 'Manhattan', url: 'https://uescarpetcleaner.com', lat: 40.7736, lng: -73.9566 },
      
      // Upper West Side
      { domain: 'uwsmaid.com', location: 'Upper West Side', region: 'Manhattan', url: 'https://uwsmaid.com', lat: 40.7870, lng: -73.9754 },
      { domain: 'uwscleaningservice.com', location: 'Upper West Side', region: 'Manhattan', url: 'https://uwscleaningservice.com', lat: 40.7870, lng: -73.9754 },
      { domain: 'uwscarpetcleaner.com', location: 'Upper West Side', region: 'Manhattan', url: 'https://uwscarpetcleaner.com', lat: 40.7870, lng: -73.9754 },
      
      // Midtown
      { domain: 'midtownmaid.com', location: 'Midtown', region: 'Manhattan', url: 'https://midtownmaid.com', lat: 40.7549, lng: -73.9840 },
      { domain: 'cleaningserviceinmidtown.com', location: 'Midtown', region: 'Manhattan', url: 'https://cleaningserviceinmidtown.com', lat: 40.7549, lng: -73.9840 },
      
      // Central Park
      { domain: 'centralparkcleaningservice.com', location: 'Central Park', region: 'Manhattan', url: 'https://centralparkcleaningservice.com', lat: 40.7829, lng: -73.9654 },
      
      // Hell's Kitchen
      { domain: 'hellskitchenmaid.com', location: "Hell's Kitchen", region: 'Manhattan', url: 'https://hellskitchenmaid.com', lat: 40.7638, lng: -73.9918 },
      { domain: 'hellskitchencleaningservice.com', location: "Hell's Kitchen", region: 'Manhattan', url: 'https://hellskitchencleaningservice.com', lat: 40.7638, lng: -73.9918 },
      
      // Chelsea / Hudson Yards
      { domain: 'chelseacleaningservice.com', location: 'Chelsea', region: 'Manhattan', url: 'https://chelseacleaningservice.com', lat: 40.7465, lng: -74.0014 },
      { domain: 'hudsonyardsmaid.com', location: 'Hudson Yards', region: 'Manhattan', url: 'https://hudsonyardsmaid.com', lat: 40.7539, lng: -74.0020 },
      
      // Columbus Circle
      { domain: 'columbuscirclecleaningservice.com', location: 'Columbus Circle', region: 'Manhattan', url: 'https://columbuscirclecleaningservice.com', lat: 40.7681, lng: -73.9819 },
      
      // Tribeca
      { domain: 'tribecamaid.com', location: 'Tribeca', region: 'Manhattan', url: 'https://tribecamaid.com', lat: 40.7163, lng: -74.0086 },
      { domain: 'tribecacleaningservice.com', location: 'Tribeca', region: 'Manhattan', url: 'https://tribecacleaningservice.com', lat: 40.7163, lng: -74.0086 },
      
      // SoHo
      { domain: 'sohomaid.com', location: 'SoHo', region: 'Manhattan', url: 'https://sohomaid.com', lat: 40.7233, lng: -74.0030 },
      { domain: 'sohocleaningservice.com', location: 'SoHo', region: 'Manhattan', url: 'https://sohocleaningservice.com', lat: 40.7233, lng: -74.0030 },
      
      // West Village
      { domain: 'westvillagemaid.com', location: 'West Village', region: 'Manhattan', url: 'https://westvillagemaid.com', lat: 40.7358, lng: -74.0036 },
      { domain: 'westvillagecleaningservice.com', location: 'West Village', region: 'Manhattan', url: 'https://westvillagecleaningservice.com', lat: 40.7358, lng: -74.0036 },
      
      // Greenwich Village
      { domain: 'greenwichvillagemaid.com', location: 'Greenwich Village', region: 'Manhattan', url: 'https://greenwichvillagemaid.com', lat: 40.7336, lng: -73.9997 },
      { domain: 'greenwichvillagecleaningservice.com', location: 'Greenwich Village', region: 'Manhattan', url: 'https://greenwichvillagecleaningservice.com', lat: 40.7336, lng: -73.9997 },
      
      // East Village
      { domain: 'eastvillagemaid.com', location: 'East Village', region: 'Manhattan', url: 'https://eastvillagemaid.com', lat: 40.7264, lng: -73.9818 },
      
      // Lower East Side
      { domain: 'lesmaid.com', location: 'Lower East Side', region: 'Manhattan', url: 'https://lesmaid.com', lat: 40.7156, lng: -73.9874 },
      
      // Union Square
      { domain: 'unionsquarecleaningservice.com', location: 'Union Square', region: 'Manhattan', url: 'https://unionsquarecleaningservice.com', lat: 40.7359, lng: -73.9911 },
      
      // Gramercy
      { domain: 'grammercymaid.com', location: 'Gramercy', region: 'Manhattan', url: 'https://grammercymaid.com', lat: 40.7378, lng: -73.9847 },
      
      // Murray Hill / Kips Bay
      { domain: 'murrayhillmaid.com', location: 'Murray Hill', region: 'Manhattan', url: 'https://murrayhillmaid.com', lat: 40.7478, lng: -73.9755 },
      { domain: 'kipsbaymaid.com', location: 'Kips Bay', region: 'Manhattan', url: 'https://kipsbaymaid.com', lat: 40.7425, lng: -73.9785 },
      
      // Stuyvesant Town
      { domain: 'stuytownmaid.com', location: 'Stuyvesant Town', region: 'Manhattan', url: 'https://stuytownmaid.com', lat: 40.7310, lng: -73.9760 },
      { domain: 'stuytowncleaningservice.com', location: 'Stuyvesant Town', region: 'Manhattan', url: 'https://stuytowncleaningservice.com', lat: 40.7310, lng: -73.9760 },
      
      // NoMad / Flatiron
      { domain: 'nomadmaid.com', location: 'NoMad', region: 'Manhattan', url: 'https://nomadmaid.com', lat: 40.7450, lng: -73.9885 },
      { domain: 'flatironmaid.com', location: 'Flatiron', region: 'Manhattan', url: 'https://flatironmaid.com', lat: 40.7410, lng: -73.9897 },
      
      // Harlem
      { domain: 'harlemmaid.com', location: 'Harlem', region: 'Manhattan', url: 'https://harlemmaid.com', lat: 40.8116, lng: -73.9465 },
      
      // Battery Park / FiDi
      { domain: 'batteryparkmaid.com', location: 'Battery Park', region: 'Manhattan', url: 'https://batteryparkmaid.com', lat: 40.7033, lng: -74.0170 },
      { domain: 'fidimaid.com', location: 'Financial District', region: 'Manhattan', url: 'https://fidimaid.com', lat: 40.7074, lng: -74.0113 },
      
      // Roosevelt Island
      { domain: 'rooseveltislandcleaningservice.com', location: 'Roosevelt Island', region: 'Manhattan', url: 'https://rooseveltislandcleaningservice.com', lat: 40.7614, lng: -73.9511 },
      
      // General Manhattan
      { domain: 'manhtattanmaidservice.com', location: 'Manhattan', region: 'Manhattan', url: 'https://manhtattanmaidservice.com', lat: 40.7831, lng: -73.9712 },

      // ========== BROOKLYN ==========
      { domain: 'parkslopemaid.com', location: 'Park Slope', region: 'Brooklyn', url: 'https://parkslopemaid.com', lat: 40.6710, lng: -73.9778 },
      { domain: 'brooklynheightsmaid.com', location: 'Brooklyn Heights', region: 'Brooklyn', url: 'https://brooklynheightsmaid.com', lat: 40.6958, lng: -73.9936 },
      { domain: 'sunsetparkmaid.com', location: 'Sunset Park', region: 'Brooklyn', url: 'https://sunsetparkmaid.com', lat: 40.6453, lng: -74.0154 },
      { domain: 'cleaningservicebrooklynny.com', location: 'Brooklyn', region: 'Brooklyn', url: 'https://cleaningservicebrooklynny.com', lat: 40.6782, lng: -73.9442 },
      { domain: 'cleaningservicedumbony.com', location: 'DUMBO', region: 'Brooklyn', url: 'https://cleaningservicedumbony.com', lat: 40.7033, lng: -73.9888 },

      // ========== QUEENS ==========
      { domain: 'licmaid.com', location: 'Long Island City', region: 'Queens', url: 'https://licmaid.com', lat: 40.7447, lng: -73.9485 },
      { domain: 'cleaningservicelongislandcity.com', location: 'Long Island City', region: 'Queens', url: 'https://cleaningservicelongislandcity.com', lat: 40.7447, lng: -73.9485 },
      { domain: 'cleaningserviceastoriany.com', location: 'Astoria', region: 'Queens', url: 'https://cleaningserviceastoriany.com', lat: 40.7614, lng: -73.9246 },
      { domain: 'cleaningservicesunnysideny.com', location: 'Sunnyside', region: 'Queens', url: 'https://cleaningservicesunnysideny.com', lat: 40.7433, lng: -73.9196 },
      { domain: 'jacksonheightsmaid.com', location: 'Jackson Heights', region: 'Queens', url: 'https://jacksonheightsmaid.com', lat: 40.7557, lng: -73.8831 },
      { domain: 'regoparkmaid.com', location: 'Rego Park', region: 'Queens', url: 'https://regoparkmaid.com', lat: 40.7264, lng: -73.8616 },
      { domain: 'foresthillsmaid.com', location: 'Forest Hills', region: 'Queens', url: 'https://foresthillsmaid.com', lat: 40.7185, lng: -73.8448 },
      { domain: 'kewgardensmaid.com', location: 'Kew Gardens', region: 'Queens', url: 'https://kewgardensmaid.com', lat: 40.7070, lng: -73.8309 },
      { domain: 'flushingmaid.com', location: 'Flushing', region: 'Queens', url: 'https://flushingmaid.com', lat: 40.7674, lng: -73.8330 },
      { domain: 'baysidemaid.com', location: 'Bayside', region: 'Queens', url: 'https://baysidemaid.com', lat: 40.7682, lng: -73.7772 },
      { domain: 'cleaningservicequeensny.com', location: 'Queens', region: 'Queens', url: 'https://cleaningservicequeensny.com', lat: 40.7282, lng: -73.7949 },
      { domain: 'maidservicequeensny.com', location: 'Queens', region: 'Queens', url: 'https://maidservicequeensny.com', lat: 40.7282, lng: -73.7949 },

      // ========== LONG ISLAND ==========
      { domain: 'greatneckmaid.com', location: 'Great Neck', region: 'Long Island', url: 'https://greatneckmaid.com', lat: 40.8007, lng: -73.7285 },
      { domain: 'manhassetmaid.com', location: 'Manhasset', region: 'Long Island', url: 'https://manhassetmaid.com', lat: 40.7979, lng: -73.6993 },
      { domain: 'portwashingtonmaid.com', location: 'Port Washington', region: 'Long Island', url: 'https://portwashingtonmaid.com', lat: 40.8257, lng: -73.6982 },
      { domain: 'gardencitymaid.com', location: 'Garden City', region: 'Long Island', url: 'https://gardencitymaid.com', lat: 40.7268, lng: -73.6343 },

      // ========== NEW JERSEY ==========
      { domain: 'hobokenmaidservice.com', location: 'Hoboken', region: 'New Jersey', url: 'https://hobokenmaidservice.com', lat: 40.7439, lng: -74.0324 },
      { domain: 'jerseycitymaid.com', location: 'Jersey City', region: 'New Jersey', url: 'https://jerseycitymaid.com', lat: 40.7178, lng: -74.0431 },
      { domain: 'weehawkenmaid.com', location: 'Weehawken', region: 'New Jersey', url: 'https://weehawkenmaid.com', lat: 40.7697, lng: -74.0204 },
      { domain: 'edgewatermaid.com', location: 'Edgewater', region: 'New Jersey', url: 'https://edgewatermaid.com', lat: 40.8271, lng: -73.9754 },

      // ========== FLORIDA - TAMPA ==========
      { domain: 'thetampamaid.com', location: 'Tampa', region: 'Florida', url: 'https://thetampamaid.com', lat: 27.9506, lng: -82.4572 },
      { domain: 'southtampamaid.com', location: 'South Tampa', region: 'Florida', url: 'https://southtampamaid.com', lat: 27.9103, lng: -82.4754 },
      { domain: 'newtampamaid.com', location: 'New Tampa', region: 'Florida', url: 'https://newtampamaid.com', lat: 28.0748, lng: -82.3837 },
      { domain: 'channelsidemaid.com', location: 'Channelside', region: 'Florida', url: 'https://channelsidemaid.com', lat: 27.9392, lng: -82.4481 },
      { domain: 'hydeparkmaid.com', location: 'Hyde Park', region: 'Florida', url: 'https://hydeparkmaid.com', lat: 27.9306, lng: -82.4783 },
      { domain: 'westchasemaid.com', location: 'Westchase', region: 'Florida', url: 'https://westchasemaid.com', lat: 28.0542, lng: -82.5992 },
      { domain: 'carrollwoodmaid.com', location: 'Carrollwood', region: 'Florida', url: 'https://carrollwoodmaid.com', lat: 28.0522, lng: -82.5140 },
      { domain: 'seminoleheightsmaid.com', location: 'Seminole Heights', region: 'Florida', url: 'https://seminoleheightsmaid.com', lat: 27.9931, lng: -82.4593 },
      { domain: 'palmaceiamaid.com', location: 'Palma Ceia', region: 'Florida', url: 'https://palmaceiamaid.com', lat: 27.9219, lng: -82.4863 },
      { domain: 'beachparkmaid.com', location: 'Beach Park', region: 'Florida', url: 'https://beachparkmaid.com', lat: 27.9103, lng: -82.4960 },
      { domain: 'parklandestatesmaid.com', location: 'Parkland Estates', region: 'Florida', url: 'https://parklandestatesmaid.com', lat: 27.9447, lng: -82.4254 },
      { domain: 'davislandsmaid.com', location: 'Davis Islands', region: 'Florida', url: 'https://davislandsmaid.com', lat: 27.9182, lng: -82.4493 },
      
      // Florida - St Pete
      { domain: 'downtownstpetemaid.com', location: 'Downtown St. Pete', region: 'Florida', url: 'https://downtownstpetemaid.com', lat: 27.7709, lng: -82.6390 },
      { domain: 'oldnortheastmaid.com', location: 'Old Northeast', region: 'Florida', url: 'https://oldnortheastmaid.com', lat: 27.7821, lng: -82.6298 },
      { domain: 'snellislemaid.com', location: 'Snell Isle', region: 'Florida', url: 'https://snellislemaid.com', lat: 27.7868, lng: -82.6238 },
      
      // Florida - Clearwater
      { domain: 'clearwaterbeachmaid.com', location: 'Clearwater Beach', region: 'Florida', url: 'https://clearwaterbeachmaid.com', lat: 27.9785, lng: -82.8274 },
      { domain: 'sandkeymaid.com', location: 'Sand Key', region: 'Florida', url: 'https://sandkeymaid.com', lat: 27.9230, lng: -82.8521 },

      // ========== NYC METRO (General/Brand Sites) ==========
      { domain: 'thenycmaid.com', location: 'NYC', region: 'NYC Metro', url: 'https://www.thenycmaid.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'thenycmaidservice.com', location: 'NYC', region: 'NYC Metro', url: 'https://thenycmaidservice.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'maidny.com', location: 'NYC', region: 'NYC Metro', url: 'https://maidny.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'thenyccleaningservice.com', location: 'NYC', region: 'NYC Metro', url: 'https://thenyccleaningservice.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'thenyccleaningcrew.com', location: 'NYC', region: 'NYC Metro', url: 'https://thenyccleaningcrew.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'thebestnychousecleaningservice.com', location: 'NYC', region: 'NYC Metro', url: 'https://thebestnychousecleaningservice.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'nychousecleanernearme.com', location: 'NYC', region: 'NYC Metro', url: 'https://nychousecleanernearme.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'cleanservicenyc.com', location: 'NYC', region: 'NYC Metro', url: 'https://cleanservicenyc.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'citycleannyc.com', location: 'NYC', region: 'NYC Metro', url: 'https://citycleannyc.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'samedaycleannyc.com', location: 'NYC', region: 'NYC Metro', url: 'https://samedaycleannyc.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'nycemergencycleaning.com', location: 'NYC', region: 'NYC Metro', url: 'https://nycemergencycleaning.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'nycspringcleaningmaid.com', location: 'NYC', region: 'NYC Metro', url: 'https://nycspringcleaningmaid.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'nycholidaymaid.com', location: 'NYC', region: 'NYC Metro', url: 'https://nycholidaymaid.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'imlookingforamaidinnyctoday.com', location: 'NYC', region: 'NYC Metro', url: 'https://imlookingforamaidinnyctoday.com', lat: 40.7589, lng: -73.9851 },

      // ========== NATIONAL ==========
      { domain: 'theusamaid.com', location: 'USA', region: 'National', url: 'https://theusamaid.com', lat: 39.8283, lng: -98.5795 },
      { domain: 'imlookingforamaidnearme.com', location: 'USA', region: 'National', url: 'https://imlookingforamaidnearme.com', lat: 39.8283, lng: -98.5795 },

      // ========== OTHER SERVICES ==========
      { domain: 'thenycdogwalker.com', location: 'NYC - Pet Services', region: 'Other', url: 'https://thenycdogwalker.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'nycpetsittingservice.com', location: 'NYC - Pet Services', region: 'Other', url: 'https://nycpetsittingservice.com', lat: 40.7589, lng: -73.9851 },
      { domain: 'petcleaningnyc.com', location: 'NYC - Pet Services', region: 'Other', url: 'https://petcleaningnyc.com', lat: 40.7589, lng: -73.9851 },
    ]

    setWebsites(sites)
  }

  const filteredWebsites = websites.filter(site => {
    const matchesSearch = site.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.domain.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = selectedRegion === 'all' || site.region === selectedRegion
    return matchesSearch && matchesRegion
  })

  const regions = ['all', ...Array.from(new Set(websites.map(s => s.region))).sort()]

  const getRegionColor = (region: string) => {
    const colors: Record<string, string> = {
      'Manhattan': '#3b82f6',
      'Brooklyn': '#10b981',
      'Queens': '#f59e0b',
      'Long Island': '#8b5cf6',
      'New Jersey': '#ec4899',
      'Florida': '#ef4444',
      'NYC Metro': '#6366f1',
      'National': '#64748b',
      'Other': '#14b8a6'
    }
    return colors[region] || '#000000'
  }

  // Count by region
  const regionCounts = websites.reduce((acc, site) => {
    acc[site.region] = (acc[site.region] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader currentPage="websites" />

      <main className="p-3 md:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#1E2A4A] mb-2">
            Website Network <span className="text-gray-500 font-normal">| {websites.length} sites</span>
          </h2>
          <p className="text-gray-600">Coverage across NYC, NJ, FL, and national reach</p>
        </div>

        {/* Region Stats */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(regionCounts).sort((a, b) => b[1] - a[1]).map(([region, count]) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(selectedRegion === region ? 'all' : region)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                selectedRegion === region 
                  ? 'ring-2 ring-offset-1' 
                  : 'opacity-80 hover:opacity-100'
              }`}
              style={{ 
                backgroundColor: getRegionColor(region) + '20',
                color: getRegionColor(region),
                borderColor: getRegionColor(region)
              }}
            >
              {region}: {count}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search locations or domains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-[#1E2A4A]"
          />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-[#1E2A4A]"
          >
            {regions.map(region => (
              <option key={region} value={region}>
                {region === 'all' ? 'All Regions' : region}
              </option>
            ))}
          </select>
        </div>

        {/* Map */}
        <div className="mb-6">
          <WebsitesMap websites={filteredWebsites} />
        </div>

        {/* Website Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWebsites.map((site) => (
            <a
              key={site.domain}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-lg p-4 hover:border-[#1E2A4A] hover:shadow-md transition-all"
              style={{ borderColor: getRegionColor(site.region) + '40' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getRegionColor(site.region) }}
                    />
                    <h3 className="font-semibold text-[#1E2A4A] truncate">{site.location}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{site.region}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate">{site.domain}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          ))}
        </div>

        {filteredWebsites.length === 0 && (
          <p className="text-center text-gray-500 py-12">No websites found</p>
        )}
      </main>
    </div>
  )
}
