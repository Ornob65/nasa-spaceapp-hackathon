export type ScenarioId = 'safe' | 'science' | 'return';
export type SiteId = 'jezero' | 'gale' | 'utopia' | 'mawrth' | 'arsia';

export const sites = [
  { id: 'jezero', name: 'Jezero Crater', short: 'JEZERO', coordinates: '18.4° N / 77.6° E', latitude: 18.4, longitude: 77.6, x: 26, y: -3 },
  { id: 'gale', name: 'Gale Crater', short: 'GALE', coordinates: '5.4° S / 137.8° E', latitude: -5.4, longitude: 137.8, x: 5, y: 7 },
  { id: 'utopia', name: 'Utopia Planitia', short: 'UTOPIA', coordinates: '46.7° N / 117.5° E', latitude: 46.7, longitude: 117.5, x: -18, y: 23 },
  { id: 'mawrth', name: 'Mawrth Vallis', short: 'MAWRTH', coordinates: '24.6° N / 341.0° E', latitude: 24.6, longitude: -19, x: -32, y: 12 },
  { id: 'arsia', name: 'Arsia Mons', short: 'ARSIA', coordinates: '9.4° S / 239.0° E', latitude: -9.4, longitude: 239, x: 15, y: 18 },
] as const;

export const scenarios = {
  safe: {
    label: 'Conservative traverse',
    code: 'MSW-01',
    distance: '8.4 km',
    duration: '03:42',
    risk: 'LOW',
    riskValue: 22,
    slope: '11°',
    science: 2,
    comms: '96%',
    pathLength: '14.2 km',
    maxSlope: '7.2°',
    slopeStatus: 'SAFE',
    battery: '12.8 kWh',
    oxygenPoint: '3h 45 min',
    pnrIndex: 64,
    elevation: [42, 39, 45, 47, 42, 34, 28, 31, 49, 63, 58, 44, 37, 39, 44, 47, 41, 26, 18, 22, 38, 55, 61, 58, 51, 52],
    route: [[-25, 18], [-12, 12], [0, 7], [14, 2], [27, -4]],
  },
  science: {
    label: 'Science-rich traverse',
    code: 'MSW-02',
    distance: '11.8 km',
    duration: '05:18',
    risk: 'MODERATE',
    riskValue: 54,
    slope: '17°',
    science: 4,
    comms: '91%',
    pathLength: '18.6 km',
    maxSlope: '14.8°',
    slopeStatus: 'CAUTION',
    battery: '18.4 kWh',
    oxygenPoint: '4h 10 min',
    pnrIndex: 57,
    elevation: [45, 39, 43, 52, 48, 34, 26, 31, 58, 76, 69, 51, 38, 42, 49, 55, 47, 31, 20, 27, 46, 70, 79, 74, 62, 64],
    route: [[-25, 18], [-13, 9], [-7, -2], [6, -7], [19, -10], [29, -5]],
  },
  return: {
    label: 'Emergency return',
    code: 'MSW-03',
    distance: '5.1 km',
    duration: '02:06',
    risk: 'LOW',
    riskValue: 14,
    slope: '8°',
    science: 0,
    comms: '100%',
    pathLength: '9.8 km',
    maxSlope: '5.1°',
    slopeStatus: 'SAFE',
    battery: '8.2 kWh',
    oxygenPoint: '2h 20 min',
    pnrIndex: 72,
    elevation: [48, 45, 43, 40, 35, 29, 34, 47, 60, 55, 43, 35, 33, 38, 48, 62, 68, 61, 52, 51, 57, 64, 59, 54, 49, 50],
    route: [[29, -5], [19, -2], [9, 3], [0, 7], [-12, 12], [-25, 18]],
  },
} as const;

export const routesBySite = {
  jezero: {
    safe: [[-25, 18], [-12, 12], [0, 7], [14, 2], [27, -4]],
    science: [[-25, 18], [-13, 9], [-7, -2], [6, -7], [19, -10], [29, -5]],
    return: [[29, -5], [19, -2], [9, 3], [0, 7], [-12, 12], [-25, 18]],
  },
  gale: {
    safe: [[130, -2], [134, -4], [138, -5], [142, -7], [146, -5]],
    science: [[130, -2], [133, -7], [137, -10], [141, -6], [145, -3], [149, -6]],
    return: [[149, -6], [145, -4], [141, -2], [137, -5], [133, -4], [130, -2]],
  },
  utopia: {
    safe: [[110, 50], [114, 48], [118, 46], [122, 44], [126, 47]],
    science: [[109, 51], [113, 46], [117, 42], [122, 44], [126, 49], [130, 46]],
    return: [[130, 46], [126, 47], [122, 49], [118, 46], [114, 48], [110, 50]],
  },
  mawrth: {
    safe: [[-27, 28], [-23, 25], [-19, 23], [-15, 22], [-11, 25]],
    science: [[-28, 29], [-24, 23], [-20, 18], [-15, 21], [-11, 27], [-7, 24]],
    return: [[-7, 24], [-11, 25], [-15, 27], [-19, 23], [-23, 25], [-27, 28]],
  },
  arsia: {
    safe: [[-129, -6], [-125, -8], [-121, -9], [-117, -11], [-113, -8]],
    science: [[-130, -6], [-126, -11], [-121, -14], [-116, -10], [-112, -5], [-108, -9]],
    return: [[-108, -9], [-112, -7], [-116, -5], [-121, -9], [-125, -8], [-129, -6]],
  },
} as const;

export const layers = [
  { id: 'terrain', label: 'Terrain elevation', group: 'Terrain', color: '#cf6b45', enabled: true },
  { id: 'slope', label: 'Slope hazard', group: 'Terrain', color: '#e5ad58', enabled: true },
  { id: 'temperature', label: 'Temperature', group: 'Environment', color: '#78b9bf', enabled: false },
  { id: 'radiation', label: 'Radiation exposure', group: 'Environment', color: '#c86e8b', enabled: false },
  { id: 'rover', label: 'Rover traverses', group: 'Mission', color: '#d9d4c7', enabled: true },
  { id: 'comms', label: 'Comms visibility', group: 'Mission', color: '#70b4d7', enabled: false },
  { id: 'science', label: 'Science targets', group: 'Science', color: '#c2d96d', enabled: true },
] as const;

export const mapZones = {
  radiation: [
    { id: 'rad-a', x: 46, y: 28, width: 21, height: 24, level: 'ELEVATED' },
    { id: 'rad-b', x: 69, y: 57, width: 17, height: 20, level: 'MODERATE' },
  ],
  temperature: [
    { id: 'temp-a', x: 10, y: 18, width: 29, height: 26, level: 'COLD' },
    { id: 'temp-b', x: 62, y: 20, width: 25, height: 31, level: 'WARM' },
  ],
  comms: [
    { id: 'comms-a', x: 51, y: 48, width: 42, height: 34, level: '96% VISIBILITY' },
    { id: 'comms-b', x: 23, y: 38, width: 28, height: 25, level: '82% VISIBILITY' },
  ],
} as const;

export const scienceClusters = [
  { id: 'cluster-a', name: 'Delta sediment cluster', x: 36, y: 38, count: 4 },
  { id: 'cluster-b', name: 'Hydrated mineral cluster', x: 65, y: 63, count: 3 },
  { id: 'cluster-c', name: 'Basalt context cluster', x: 25, y: 57, count: 2 },
] as const;

export const roverTrail = [[-25, 18], [-20, 16], [-15, 13], [-10, 11], [-5, 9], [0, 7]] as const;

export const targets = [
  { id: 'a', name: 'Layered outcrop', type: 'Sedimentary exposure', x: 14, y: 2, detail: 'Exposed strata may preserve a record of ancient water activity.' },
  { id: 'b', name: 'Horizon ridge', type: 'Basaltic formation', x: -7, y: -2, detail: 'High-value context target for regional volcanic history.' },
  { id: 'c', name: 'Possible hydrated minerals', type: 'Spectral anomaly', x: 19, y: -10, detail: 'Orbital spectral data indicates a hydrated mineral signature.' },
];

export const missionOverview = {
  status: 'NOMINAL',
  objective: 'Characterize the ancient delta margin at Jezero Crater.',
  sol: '0042',
  landingSite: 'Gale Crater',
  phase: 'Traverse planning',
  nextWindow: '05:18 UTC',
};

export const missionTimeline = [
  { label: 'Landing systems checked', status: 'complete' },
  { label: 'Traverse route approved', status: 'complete' },
  { label: 'Science corridor in progress', status: 'active' },
  { label: 'Return window reserved', status: 'upcoming' },
] as const;

export const featuredDestinations = [
  { name: 'Utopia Planitia', coordinates: '46.7° N / 117.5° E', description: 'A broad northern plain offering a window into Mars’ buried water history.', fullDescription: 'Utopia Planitia is one of Mars’ largest lowland plains, with relatively open terrain that supports long-distance route planning and the study of buried volatiles.', terrain: 'NORTHERN PLAIN / IMPACT BASIN', scienceValue: 'Subsurface ice / resource mapping', missionUse: 'Long-range exploration candidate', image: '/images/mars-surface.jpg' },
  { name: 'Gale Crater', coordinates: '5.4° S / 137.8° E', description: 'A weathered impact basin selected for its accessible terrain and diverse sedimentary record.', fullDescription: 'Gale is a broad impact basin with a central mountain and exposed sedimentary units shaped by wind, water, and time. Its predictable route corridors make it a useful planning region for testing safe traverses while still reaching geologically diverse targets.', terrain: 'IMPACT BASIN / SEDIMENTARY UNITS', scienceValue: 'Layer history / climate record', missionUse: 'Current operational planning region', image: '/images/mars-surface.jpg' },
  { name: 'Jezero Crater', coordinates: '18.4° N / 77.6° E', description: 'An ancient lake basin and landing site for Perseverance.', fullDescription: 'Jezero preserves the fan-shaped margin of a former river delta, where sediment layers may record how water moved across early Mars.', terrain: 'DELTA MARGIN / LAYERED SEDIMENT', scienceValue: 'Ancient water activity / biosignature context', missionUse: 'Primary science-rich destination', image: '/images/mars-surface.jpg' },
  { name: 'Arsia Mons', coordinates: '9.4° S / 239.0° E', description: 'The southernmost volcano in the Tharsis region.', fullDescription: 'Arsia Mons is a massive shield volcano in the Tharsis region, offering a high-elevation setting for studying volcanic history and atmospheric processes.', terrain: 'SHIELD VOLCANO / THARSIS REGION', scienceValue: 'Volcanic history / atmospheric context', missionUse: 'Highland exploration candidate', image: '/images/mars-surface.jpg' },
];

export const telemetry = [
  { label: 'ROVER BATTERY', value: '78%', note: '12.8 kWh available', tone: 'green' },
  { label: 'COMMS LINK', value: '96%', note: 'Orbital relay nominal', tone: 'cyan' },
  { label: 'VELOCITY', value: '0.42', note: 'km/h / traverse mode', tone: 'rust' },
  { label: 'MISSION CLOCK', value: '04:32', note: 'Sol 0042 / local time', tone: 'amber' },
];

export const telemetryEvents = [
  { time: '04:32:18', message: 'Route checkpoint Delta-03 acknowledged', status: 'NOMINAL' },
  { time: '04:29:04', message: 'Spectrometer scan complete at Layered outcrop', status: 'SCIENCE' },
  { time: '04:12:41', message: 'Orbital relay handoff completed', status: 'LINKED' },
];

export const imagery = [
  { title: 'Candor Chasma', type: 'VALLEY', image: 'https://images-assets.nasa.gov/image/PIA00403/PIA00403~medium.jpg', caption: 'Central trough system of Valles Marineris.' },
  { title: 'Ophir Chasma', type: 'VALLEY', image: 'https://images-assets.nasa.gov/image/PIA09976/PIA09976~medium.jpg', caption: 'Northern trough section of Valles Marineris.' },
  { title: 'Planum Boreum', type: 'PLAIN', image: 'https://images-assets.nasa.gov/image/PIA00198/PIA00198~medium.jpg', caption: 'Northern polar plateau containing water ice cap.' },
  { title: 'Coprates Chasma', type: 'VALLEY', image: 'https://images-assets.nasa.gov/image/PIA21872/PIA21872~medium.jpg', caption: 'Eastern canyon section of Valles Marineris.' },
];

export const survivalProtocols = [
  { group: 'LIFE SUPPORT', title: 'Cabin pressure loss', priority: 'P1 / IMMEDIATE', trigger: 'Pressure falls below 7.0 kPa or suit warning activates.', steps: ['Seal the habitat or rover compartment.', 'Confirm suit pressure and switch to reserve oxygen.', 'Move to the nearest pressurized safe zone.', 'Report crew status over the primary relay.'] },
  { group: 'POWER', title: 'Critical battery reserve', priority: 'P1 / IMMEDIATE', trigger: 'Available rover power drops below 20%.', steps: ['Stop non-essential instruments and heaters.', 'Switch to low-power traverse mode.', 'Confirm the shortest safe return route.', 'Transmit a power budget and return estimate.'] },
  { group: 'COMMUNICATIONS', title: 'Orbital relay loss', priority: 'P2 / HIGH', trigger: 'No relay acknowledgement for two consecutive windows.', steps: ['Hold position and raise the high-gain antenna.', 'Attempt the secondary relay frequency.', 'Record the last confirmed coordinates.', 'Begin the pre-approved return protocol if link remains absent.'] },
  { group: 'NAVIGATION', title: 'Route confidence degraded', priority: 'P2 / HIGH', trigger: 'Terrain model mismatch or localization error exceeds 15 m.', steps: ['Pause the traverse and preserve current heading.', 'Compare visual landmarks with the surface map.', 'Recalculate the route around the uncertain terrain.', 'Do not cross an unverified hazard zone.'] },
  { group: 'DUST STORM', title: 'Regional dust event', priority: 'P1 / IMMEDIATE', trigger: 'Visibility drops below 500 m or dust index becomes severe.', steps: ['Secure instruments and reduce rover speed.', 'Orient solar arrays and communications hardware.', 'Navigate to the nearest shelter waypoint.', 'Monitor battery drain and wait for a safe window.'] },
  { group: 'MEDICAL', title: 'Crew medical response', priority: 'P1 / IMMEDIATE', trigger: 'Crew member reports injury, suit fault, or medical distress.', steps: ['Stop the rover and stabilize the crew member.', 'Confirm oxygen, temperature, and suit telemetry.', 'Contact mission control with the medical status code.', 'Return to the nearest habitat or extraction waypoint.'] },
];
