export type MarsWeather = {
  sol: string;
  temperatureC: { average: number; minimum: number; maximum: number };
  pressurePa: { average: number; minimum: number; maximum: number };
  windSpeedMps: { average: number; minimum: number; maximum: number };
  windDirection: string;
  season: string;
  firstUtc: string;
  lastUtc: string;
  freshness: 'live' | 'cached';
};

type WeatherMetric = { av?: unknown; mn?: unknown; mx?: unknown };
type WeatherReading = {
  AT?: WeatherMetric;
  PRE?: WeatherMetric;
  HWS?: WeatherMetric;
  WD?: { most_common?: { compass_point?: unknown } };
  Season?: unknown;
  First_UTC?: unknown;
  Last_UTC?: unknown;
};

const marsWeatherUrl = 'https://api.nasa.gov/insight_weather/?api_key=DEMO_KEY&feedtype=json&ver=1.0';

const lastVerifiedWeather: Omit<MarsWeather, 'freshness'> = {
  sol: '681',
  temperatureC: { average: -62.434, minimum: -95.447, maximum: -4.444 },
  pressurePa: { average: 743.55, minimum: 718.463, maximum: 760.2244 },
  windSpeedMps: { average: 5.632, minimum: 0.228, maximum: 18.577 },
  windDirection: 'WNW',
  season: 'fall',
  firstUtc: '2020-10-25T22:29:51Z',
  lastUtc: '2020-10-26T23:09:26Z',
};

const numberValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export async function fetchMarsWeather(signal?: AbortSignal): Promise<MarsWeather> {
  const response = await fetch(marsWeatherUrl, { signal });
  if (response.status === 429) {
    return { ...lastVerifiedWeather, freshness: 'cached' };
  }
  if (!response.ok) throw new Error(`NASA weather request failed (${response.status}).`);

  const payload = await response.json() as { sol_keys?: unknown[] } & Record<string, unknown>;
  const solKeys = Array.isArray(payload.sol_keys)
    ? payload.sol_keys.filter((sol): sol is string | number => typeof sol === 'string' || typeof sol === 'number')
    : [];
  const latestSol = solKeys[solKeys.length - 1];
  const reading = latestSol === undefined ? undefined : payload[String(latestSol)] as WeatherReading | undefined;
  const temperatureAverage = numberValue(reading?.AT?.av);
  const temperatureMinimum = numberValue(reading?.AT?.mn);
  const temperatureMaximum = numberValue(reading?.AT?.mx);
  const pressureAverage = numberValue(reading?.PRE?.av);
  const pressureMinimum = numberValue(reading?.PRE?.mn);
  const pressureMaximum = numberValue(reading?.PRE?.mx);
  const windAverage = numberValue(reading?.HWS?.av);
  const windMinimum = numberValue(reading?.HWS?.mn);
  const windMaximum = numberValue(reading?.HWS?.mx);
  const windDirection = typeof reading?.WD?.most_common?.compass_point === 'string'
    ? reading.WD.most_common.compass_point
    : '';
  const season = typeof reading?.Season === 'string' ? reading.Season : '';
  const firstUtc = typeof reading?.First_UTC === 'string' ? reading.First_UTC : '';
  const lastUtc = typeof reading?.Last_UTC === 'string' ? reading.Last_UTC : '';

  if (
    latestSol === undefined
    || temperatureAverage === undefined || temperatureMinimum === undefined || temperatureMaximum === undefined
    || pressureAverage === undefined || pressureMinimum === undefined || pressureMaximum === undefined
    || windAverage === undefined || windMinimum === undefined || windMaximum === undefined
    || !season || !firstUtc || !lastUtc
  ) {
    throw new Error('NASA weather response did not include a complete latest-sol reading.');
  }

  return {
    sol: String(latestSol),
    temperatureC: { average: temperatureAverage, minimum: temperatureMinimum, maximum: temperatureMaximum },
    pressurePa: { average: pressureAverage, minimum: pressureMinimum, maximum: pressureMaximum },
    windSpeedMps: { average: windAverage, minimum: windMinimum, maximum: windMaximum },
    windDirection,
    season,
    firstUtc,
    lastUtc,
    freshness: 'live',
  };
}
