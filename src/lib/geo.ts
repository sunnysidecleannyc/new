const RADAR_API_KEY = process.env.RADAR_API_KEY || process.env.NEXT_PUBLIC_RADAR_API_KEY || ''

export const MAX_DISTANCE_MILES = 0.1

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://api.radar.io/v1/geocode/forward?query=${encodeURIComponent(address)}`,
      { headers: { 'Authorization': RADAR_API_KEY } }
    )
    const data = await res.json()
    if (data.addresses && data.addresses.length > 0) {
      return { lat: data.addresses[0].latitude, lng: data.addresses[0].longitude }
    }
  } catch (e) {
    console.error('Geocode error:', e)
  }
  return null
}

export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
