export interface PlaceResult {
  placeId:  string
  name:     string
  address:  string
  lat:      number
  lng:      number
}

export async function searchCalisthenicParks(
  query: string,
  lat?: number,
  lng?: number,
): Promise<PlaceResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return []

  const body: Record<string, unknown> = {
    textQuery: query || 'calisthenics park outdoor gym bars',
    maxResultCount: 10,
  }

  if (lat !== undefined && lng !== undefined) {
    body.locationBias = {
      circle: { center: { latitude: lat, longitude: lng }, radius: 15000 },
    }
  }

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return (data.places ?? []).map((p: { id: string; displayName: { text: string }; formattedAddress: string; location: { latitude: number; longitude: number } }) => ({
      placeId: p.id,
      name:    p.displayName.text,
      address: p.formattedAddress,
      lat:     p.location.latitude,
      lng:     p.location.longitude,
    }))
  } catch {
    return []
  }
}

export async function getUsersAtPark(placeId: string) {
  const { createClient } = await import('@/lib/supabase/client')
  const sb = createClient()

  const { data } = await sb
    .from('user_parks')
    .select('user_id, name, user_profiles(display_name, avatar_url)')
    .eq('place_id', placeId)

  return data ?? []
}
