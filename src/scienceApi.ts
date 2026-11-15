export type ScienceResult = {
  title: string;
  type: string;
  image: string;
  caption: string;
};

type BackendRecord = Record<string, unknown>;
type ScienceResponse = {
  success: boolean;
  data: unknown;
};

const fallbackImage = '/images/mars-surface.jpg';
const scienceEndpoint = 'https://mars-map-hackathon.onrender.com/api/mars-locations';

const asText = (record: BackendRecord, keys: string[], fallback: string) => {
  const value = keys.map((key) => record[key]).find((item) => typeof item === 'string' && item.trim());
  return typeof value === 'string' ? value.trim() : fallback;
};

const normalizeRecord = (record: BackendRecord, index: number): ScienceResult => {
  const title = asText(record, ['name', 'title', 'crater_name', 'feature_name'], `Mars feature ${index + 1}`);
  const latitude = asText(record, ['latitude', 'lat'], '');
  const longitude = asText(record, ['longitude', 'lon', 'lng'], '');
  const coordinates = latitude && longitude ? `Coordinates: ${latitude}, ${longitude}.` : 'Mars surface feature from the mission database.';

  return {
    title,
    type: asText(record, ['type', 'feature_type', 'category'], 'MARTIAN SURFACE FEATURE').toUpperCase(),
    image: asText(record, ['image', 'image_url', 'img_url', 'thumbnail', 'thumbnail_url'], fallbackImage),
    caption: asText(record, ['description', 'caption', 'summary', 'details'], coordinates),
  };
};

export async function searchScienceImagery(query: string): Promise<ScienceResult[]> {
  const endpoint = new URL(scienceEndpoint);
  const normalizedQuery = query.trim();
  if (normalizedQuery) endpoint.searchParams.set('search', normalizedQuery);

  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Science database request failed (${response.status}).`);
  }

  const payload = await response.json() as ScienceResponse;
  if (!payload || payload.success !== true || !Array.isArray(payload.data)) {
    throw new Error('Science database returned an invalid response.');
  }

  return payload.data.flatMap((record, index) => (
    record && typeof record === 'object'
      ? [normalizeRecord(record as BackendRecord, index)]
      : []
  ));
}
