export interface Area {
  slug: string
  urlSlug: string
  name: string
  state: string
  description: string
  lat: number
  lng: number
}

export const AREAS: Area[] = [
  {
    slug: 'manhattan',
    urlSlug: 'nyc-cleaning-services',
    name: 'Manhattan',
    state: 'NY',
    description: 'Professional cleaning services across Manhattan — from the Upper East Side to the Financial District.',
    lat: 40.7831,
    lng: -73.9712,
  },
  {
    slug: 'queens',
    urlSlug: 'queens-cleaning-services',
    name: 'Queens',
    state: 'NY',
    description: 'Reliable cleaning services throughout Queens — Sunnyside, Astoria, LIC, Jackson Heights and more.',
    lat: 40.7282,
    lng: -73.7949,
  },
  {
    slug: 'brooklyn',
    urlSlug: 'brooklyn-cleaning-services',
    name: 'Brooklyn',
    state: 'NY',
    description: 'Trusted cleaning services across Brooklyn — Williamsburg, Park Slope, DUMBO, Bushwick and beyond.',
    lat: 40.6782,
    lng: -73.9442,
  },
  {
    slug: 'bronx',
    urlSlug: 'bronx-cleaning-services',
    name: 'The Bronx',
    state: 'NY',
    description: 'Dependable cleaning services in The Bronx — residential and commercial cleaning you can count on.',
    lat: 40.8448,
    lng: -73.8648,
  },
  {
    slug: 'staten-island',
    urlSlug: 'staten-island-cleaning-services',
    name: 'Staten Island',
    state: 'NY',
    description: 'Quality cleaning services on Staten Island — homes, apartments, and offices.',
    lat: 40.5795,
    lng: -74.1502,
  },
  {
    slug: 'long-island',
    urlSlug: 'long-island-cleaning-services',
    name: 'Long Island',
    state: 'NY',
    description: 'Premium cleaning services across Long Island — Nassau and Suffolk County homes.',
    lat: 40.7891,
    lng: -73.1350,
  },
]
