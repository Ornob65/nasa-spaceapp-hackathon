export type MarsLandmark = {
  name: string;
  latitude: number;
  longitude: number;
  featureType: string;
  description: string;
  imageUrl?: string;
  elevation?: number;
  slope?: number;
};

export const marsLocationsUrl = 'https://mars-map-hackathon.onrender.com/api/mars-locations';
export const marsMolaTileUrl = 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg';

export function parseMarsLandmarks(payload: unknown): MarsLandmark[] {
  const records = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data
      : payload && typeof payload === 'object' && Array.isArray((payload as { locations?: unknown }).locations)
        ? (payload as { locations: unknown[] }).locations
        : [];

  return records.flatMap((record) => {
    if (!record || typeof record !== 'object') return [];
    const item = record as Record<string, unknown>;
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 360) return [];
    const elevation = Number(item.elevation ?? item.elevation_m ?? item.elevationMeters);
    const slope = Number(item.slope ?? item.slope_degrees ?? item.slopeDegrees);
    return [{
      name: String(item.name ?? 'Unnamed landmark'),
      latitude,
      longitude,
      featureType: String(item.feature_type ?? item.featureType ?? item.type ?? 'Unknown feature'),
      description: String(item.description ?? 'No description available.'),
      imageUrl: typeof item.image_url === 'string' ? item.image_url : undefined,
      elevation: Number.isFinite(elevation) ? elevation : undefined,
      slope: Number.isFinite(slope) ? slope : undefined,
    }];
  });
}

export async function fetchMarsLandmarks(signal: AbortSignal) {
  const response = await fetch(marsLocationsUrl, { signal });
  if (!response.ok) throw new Error(`Backend returned ${response.status}.`);
  const landmarks = parseMarsLandmarks(await response.json());
  if (!landmarks.length) throw new Error('Backend returned no valid Mars landmarks.');
  return landmarks;
}
