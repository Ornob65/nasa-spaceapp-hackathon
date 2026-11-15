import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowUpRight, Crosshair, Download, Layers3, Map,
  Orbit, Radio, Route, Satellite, ShieldCheck, Lightbulb, Thermometer, TriangleAlert, Menu, X,
} from 'lucide-react';
import { MarsMap, type MarsCoordinate } from './MarsMap';
import { MarsGlobe } from './MarsGlobe';
import { featuredDestinations, imagery, layers, missionOverview, missionTimeline, routesBySite, scenarios, sites, survivalProtocols, targets, telemetry, telemetryEvents, type ScenarioId } from './data';
import { fetchMarsLandmarks, type MarsLandmark } from './marsLocations';
import { fetchMarsWeather, type MarsWeather } from './marsWeather';
import { searchScienceImagery, type ScienceResult } from './scienceApi';
import { useAppStore } from './store';

const groups = ['Terrain', 'Environment', 'Mission', 'Science'];
type RoutePoint = readonly [number, number];
type FeaturedDestination = typeof featuredDestinations[number];

function formatDestinationCoordinates(latitude: number, longitude: number) {
  const eastLongitude = ((longitude % 360) + 360) % 360;
  return `${Math.abs(latitude).toFixed(1)}° ${latitude >= 0 ? 'N' : 'S'} / ${eastLongitude.toFixed(1)}° E`;
}

function mapBackendDestinations(landmarks: MarsLandmark[]): FeaturedDestination[] {
  return featuredDestinations.map((fallback) => {
    const landmark = landmarks.find((item) => item.name.toLowerCase() === fallback.name.toLowerCase());
    if (!landmark) return fallback;
    return {
      ...fallback,
      coordinates: formatDestinationCoordinates(landmark.latitude, landmark.longitude),
      description: landmark.description,
      fullDescription: landmark.description,
      terrain: `${landmark.featureType.toUpperCase()} / MARS SURFACE`,
      image: landmark.imageUrl ?? fallback.image,
    };
  });
}

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return pathname;
}

function useLocalClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function MarsSurface({ mode, roverProgress = 0, route: routeOverride, onMapClick, onMapMove, onWaypointClick, selectedWaypoint, zoom = 1 }: { mode: 'map' | 'globe'; roverProgress?: number; route?: readonly RoutePoint[]; onMapClick?: (coordinates: MarsCoordinate) => void; onMapMove?: (coordinates: MarsCoordinate) => void; onWaypointClick?: (index: number) => void; selectedWaypoint?: number | null; zoom?: number }) {
  const { scenario, activeLayers, selectedSite, autoRotate, toggleAutoRotate } = useAppStore();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [fullscreenMessage, setFullscreenMessage] = useState('');
  const route = routeOverride ?? routesBySite[selectedSite]?.[scenario] ?? scenarios[scenario].route;
  const siteCoordinates = sites.find((site) => site.id === selectedSite);
  const isGlobe = mode === 'globe';

  return (
    <div ref={surfaceRef} className={`surface ${isGlobe ? 'surface--globe' : ''}`}>
      {!isGlobe && <div className="surface__toolbar">
        <div className="surface__toolbar-actions"><button title="Fullscreen map" onClick={() => { if (!surfaceRef.current?.requestFullscreen) { setFullscreenMessage('Fullscreen is not supported in this browser.'); return; } surfaceRef.current.requestFullscreen().catch(() => setFullscreenMessage('Fullscreen request was blocked by the browser.')); }}><Map size={15} /></button></div>
      </div>}
      {fullscreenMessage && <div className="map-status-message" role="status">{fullscreenMessage}</div>}
      {isGlobe ? (
        <MarsGlobe autoRotate={autoRotate} onToggleAutoRotate={toggleAutoRotate} siteName={siteCoordinates?.short} siteCoordinates={siteCoordinates ? [siteCoordinates.longitude, siteCoordinates.latitude] : undefined} />
      ) : (
        <MarsMap route={route} zoom={zoom} roverProgress={roverProgress} selectedWaypoint={selectedWaypoint} activeLayers={activeLayers} siteCoordinates={siteCoordinates ? [siteCoordinates.longitude, siteCoordinates.latitude] : undefined} onMapClick={onMapClick} onMapMove={onMapMove} onWaypointClick={onWaypointClick} />
      )}
      {!isGlobe && <div className="surface__legend">
        <span><i className="legend-dot legend-dot--route" /> PLANNED ROUTE</span>
        <span><i className="legend-dot legend-dot--science" /> SCIENCE TARGET</span>
        {activeLayers.includes('radiation') && <span><i className="legend-dot legend-dot--radiation" /> RADIATION</span>}
        {activeLayers.includes('temperature') && <span><i className="legend-dot legend-dot--temperature" /> TEMPERATURE</span>}
        {activeLayers.includes('comms') && <span><i className="legend-dot legend-dot--comms" /> COMMS VISIBILITY</span>}
      </div>}
    </div>
  );
}

function TelemetrySection() {
  const { scenario, setTelemetryProgress } = useAppStore();
  const [isLive, setIsLive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [route, setRoute] = useState<readonly RoutePoint[]>(scenarios[scenario].route);
  const [selectedWaypoint, setSelectedWaypoint] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [coordinates, setCoordinates] = useState('18.4° N / 77.6° E');
  const [eventFilter, setEventFilter] = useState<'ALL' | 'NOMINAL' | 'SCIENCE' | 'LINKED'>('ALL');
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);
  const [events, setEvents] = useState(telemetryEvents);
  const activeScenario = scenarios[scenario];
  const activeRoute = route;
  const progress = (tick % 12) / 11;
  const battery = Math.max(61, 78 - Math.floor(tick / 3));
  const comms = 94 + ((tick * 3) % 4);
  const velocity = (0.42 + ((tick % 5) * 0.02)).toFixed(2);
  const missionMinutes = 272 + tick;
  const missionClock = `${String(Math.floor(missionMinutes / 60)).padStart(2, '0')}:${String(missionMinutes % 60).padStart(2, '0')}`;
  const liveTelemetry = [
    { ...telemetry[0], value: `${battery}%` },
    { ...telemetry[1], value: `${comms}%` },
    { ...telemetry[2], value: velocity },
    { ...telemetry[3], value: missionClock },
  ];
  const visibleEvents = events.filter((event) => eventFilter === 'ALL' || event.status === eventFilter);
  const routeDistance = route.reduce((total, point, index) => {
    if (index === 0) return 0;
    const previous = route[index - 1];
    return total + Math.hypot(point[0] - previous[0], point[1] - previous[1]) * 0.32;
  }, 0).toFixed(1);

  useEffect(() => {
    setTelemetryProgress(progress);
  }, [progress, setTelemetryProgress]);

  useEffect(() => {
    if (!isLive || isEditing) return;
    const interval = window.setInterval(() => setTick((value) => value + 1), 1500);
    return () => window.clearInterval(interval);
  }, [isLive, isEditing]);

  useEffect(() => {
    if (tick === 0 || !isLive || isEditing) return;
    const routeIndex = Math.min(activeRoute.length - 1, Math.floor(progress * activeRoute.length));
    const nextEvent = {
      time: `04:${String((32 + tick) % 60).padStart(2, '0')}:${String((18 + tick * 7) % 60).padStart(2, '0')}`,
      message: routeIndex === activeRoute.length - 1 ? 'Destination waypoint reached' : `Rover position update / waypoint ${String(routeIndex + 1).padStart(2, '0')}`,
      status: routeIndex === activeRoute.length - 1 ? 'ARRIVED' : 'NOMINAL',
    };
    setEvents((current) => [nextEvent, ...current].slice(0, 4));
  }, [tick, isLive, isEditing, activeRoute.length, progress]);

  useEffect(() => {
    setRoute(activeScenario.route);
    setSelectedWaypoint(null);
    setZoom(1);
  }, [activeScenario]);

  const handleMapClick = (event: MarsCoordinate) => {
    if (!isEditing) return;
    setRoute((current) => [...current, [Number(event[0].toFixed(1)), Number(event[1].toFixed(1))]]);
  };

  const handleMapMove = (event: MarsCoordinate) => {
    const [longitude, latitude] = event;
    setCoordinates(`${Math.abs(latitude).toFixed(1)}° ${latitude >= 0 ? 'N' : 'S'} / ${((longitude + 360) % 360).toFixed(1)}° E`);
  };

  const selectWaypoint = (index: number) => {
    setSelectedWaypoint(index);
    setIsEditing(true);
    setIsLive(false);
  };

  const deleteWaypoint = () => {
    if (selectedWaypoint === null || route.length <= 2) return;
    setRoute((current) => current.filter((_, index) => index !== selectedWaypoint));
    setSelectedWaypoint(null);
  };

  const renameWaypoint = () => {
    if (selectedWaypoint === null) return;
    const name = window.prompt('Waypoint label', `Waypoint ${selectedWaypoint + 1}`);
    if (name?.trim()) setEvents((current) => [{ time: 'NOW', message: `${name.trim()} waypoint label saved`, status: 'SCIENCE' }, ...current].slice(0, 4));
  };

  const startEditing = () => {
    setIsLive(false);
    setIsEditing(true);
  };

  const finishEditing = () => setIsEditing(false);

  return (
    <section className="telemetry section-band" id="telemetry">
      <div className="section-heading"><div><p className="eyebrow">ROVER OPERATIONS / SIMULATION</p><h2>Telemetry &amp; map.</h2></div><div className="telemetry-actions"><button className={`telemetry-edit-toggle ${isEditing ? 'telemetry-edit-toggle--active' : ''}`} onClick={isEditing ? finishEditing : startEditing}><Map size={13} /> {isEditing ? 'FINISH EDITING' : 'EDIT ROUTE'}</button><button className={`telemetry-live-toggle ${isLive ? 'telemetry-live-toggle--active' : ''}`} onClick={() => setIsLive((value) => !value)} disabled={isEditing}><i /> {isLive ? 'LIVE SIMULATION / PAUSE' : 'START LIVE SIMULATION'}</button></div></div>
      <div className="telemetry__layout"><div className="telemetry__map">      <div className="telemetry-map-tools"><span><Crosshair size={12} /> {coordinates}</span></div><MarsSurface mode="map" route={activeRoute} zoom={zoom} roverProgress={progress} onMapClick={handleMapClick} onMapMove={handleMapMove} onWaypointClick={selectWaypoint} selectedWaypoint={selectedWaypoint} /><div className={`route-editor-hint ${isEditing ? 'route-editor-hint--active' : ''}`}>{isEditing ? 'CLICK MAP TO ADD WAYPOINTS' : `${activeRoute.length} WAYPOINTS / ${routeDistance} KM / ${isLive ? 'ROVER IN MOTION' : 'ROVER STANDBY'}`}</div></div><div className="telemetry__side"><div className="route-edit-controls"><span>ROUTE / {activeRoute.length} POINTS / {routeDistance} KM</span><button onClick={() => setRoute((current) => current.slice(0, -1))} disabled={!isEditing || activeRoute.length <= 1}>UNDO LAST</button><button onClick={deleteWaypoint} disabled={!isEditing || selectedWaypoint === null || activeRoute.length <= 2}>DELETE</button><button onClick={renameWaypoint} disabled={!isEditing || selectedWaypoint === null}>LABEL</button><button onClick={() => setRoute(activeScenario.route)} disabled={!isEditing}>RESET ROUTE</button></div><div className="telemetry-cards">{liveTelemetry.map((item) => <div className={`telemetry-card telemetry-card--${item.tone}`} key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></div>)}</div><div className="event-feed"><div className="event-feed__toolbar"><div className="panel__label">RECENT TRANSMISSIONS <Radio size={14} /></div><div className="event-filters">{(['ALL', 'NOMINAL', 'SCIENCE', 'LINKED'] as const).map((filter) => <button className={eventFilter === filter ? 'event-filter--active' : ''} key={filter} onClick={() => setEventFilter(filter)}>{filter}</button>)}</div></div>{visibleEvents.map((event, index) => <div className={`event-row ${acknowledged.has(`${event.time}-${index}`) ? 'event-row--acknowledged' : ''}`} key={`${event.time}-${index}`}><time>{event.time}</time><span>{event.message}</span><b>{event.status}</b><button onClick={() => setAcknowledged((current) => new Set(current).add(`${event.time}-${index}`))}>{acknowledged.has(`${event.time}-${index}`) ? 'ACK' : 'ACKNOWLEDGE'}</button></div>)}</div></div></div>
    </section>
  );
}

function TerrainProfile({ scenario, landmarks }: { scenario: typeof scenarios[ScenarioId]; landmarks: MarsLandmark[] }) {
  const terrainSamples = landmarks.filter((landmark) => landmark.elevation !== undefined);
  const usesBackendProfile = terrainSamples.length >= 2;
  const elevations = usesBackendProfile ? terrainSamples.map((landmark) => landmark.elevation as number) : scenario.elevation;
  const [selectedIndex, setSelectedIndex] = useState(() => Math.round((scenario.pnrIndex / 100) * (elevations.length - 1)));
  const maxElevation = Math.max(...elevations);
  const minElevation = Math.min(...elevations);
  const range = maxElevation - minElevation || 1;
  const toY = (elevation: number) => 88 - ((elevation - minElevation) / range) * 70;
  const points = elevations.map((elevation, index) => `${(index / (elevations.length - 1)) * 100},${toY(elevation)}`).join(' ');
  const fillPoints = `0,100 ${points} 100,100`;
  const calculatedSlopes = elevations.map((elevation, index) => terrainSamples[index]?.slope ?? Math.abs((elevations[Math.min(elevations.length - 1, index + 1)] ?? elevation) - (elevations[Math.max(0, index - 1)] ?? elevation)));
  const maximumSlope = calculatedSlopes.length ? Math.max(...calculatedSlopes) : 0;
  const slopeTone = maximumSlope <= 10 ? 'safe' : 'caution';
  const activeIndex = Math.min(selectedIndex, elevations.length - 1);
  const selectedElevation = elevations[activeIndex];
  const selectedSlope = calculatedSlopes[activeIndex];
  const selectedDistance = `${((activeIndex / (elevations.length - 1)) * Number.parseFloat(scenario.pathLength)).toFixed(1)} km`;
  const selectedX = (activeIndex / (elevations.length - 1)) * 100;

  useEffect(() => {
    setSelectedIndex(Math.min(elevations.length - 1, Math.round((scenario.pnrIndex / 100) * (elevations.length - 1))));
  }, [scenario, elevations.length]);

  const selectFromChart = (clientX: number, element: HTMLDivElement) => {
    const position = Math.max(0, Math.min(1, (clientX - element.getBoundingClientRect().left) / element.getBoundingClientRect().width));
    setSelectedIndex(Math.round(position * (elevations.length - 1)));
  };

  return (
    <section className="mola-section">
      <div className="mola-heading">
        <h2>Mola Terrain Cross-Section &amp; Slope</h2>
        <span>{usesBackendProfile ? 'MARS TREK / MOLA 463M' : 'MISSION ROUTE PROFILE'} · PATH LENGTH : {scenario.pathLength}</span>
      </div>
      <div className="mola-panel">
        <div
          className="mola-chart"
          role="slider"
          tabIndex={0}
          aria-label="Select a point on the MOLA terrain profile"
          aria-valuemin={0}
          aria-valuemax={elevations.length - 1}
          aria-valuenow={activeIndex}
          onClick={(event) => selectFromChart(event.clientX, event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') setSelectedIndex((index) => Math.max(0, index - 1));
            if (event.key === 'ArrowRight') setSelectedIndex((index) => Math.min(elevations.length - 1, index + 1));
          }}
        >
          <div className="mola-chart__grid" />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="MOLA terrain elevation cross-section">
            <polygon className="mola-chart__fill" points={fillPoints} />
            <polyline className="mola-chart__line" points={points} />
            <line className="mola-chart__pnr" x1={scenario.pnrIndex} x2={scenario.pnrIndex} y1="0" y2="100" />
            <line className="mola-chart__cursor" x1={selectedX} x2={selectedX} y1="0" y2="100" />
            <circle className="mola-chart__point" cx={selectedX} cy={toY(selectedElevation)} r="2.2" />
          </svg>
          <span className="mola-chart__annotation" style={{ left: `${scenario.pnrIndex}%` }}>PNR (O2 ABORT)</span>
          <span className="mola-chart__selection" style={{ left: `${selectedX}%` }}>INSPECT</span>
          <span className="mola-chart__axis mola-chart__axis--low">LOW ELEVATION</span>
          <span className="mola-chart__axis mola-chart__axis--high">HIGH ELEVATION</span>
        </div>
        <div className="mola-readout"><span>PROFILE POINT {String(activeIndex + 1).padStart(2, '0')} / {elevations.length}</span><strong>{selectedDistance}</strong><span>REL. ELEVATION {selectedElevation} · LOCAL SLOPE {selectedSlope.toFixed(1)}°</span></div>
        <div className="mola-metrics">
          <div className={`mola-metric mola-metric--${slopeTone}`}><span>MAX SLOPE</span><strong>{maximumSlope.toFixed(1)}° <em>[{slopeTone === 'safe' ? 'SAFE' : 'CAUTION'}]</em></strong></div>
          <div className="mola-metric mola-metric--battery"><span>ROVER BATTERY</span><strong>{scenario.battery}</strong></div>
          <div className="mola-metric mola-metric--pnr"><span>OXYGEN POINT OF NO RETURN</span><strong>{scenario.oxygenPoint}</strong></div>
        </div>
      </div>
      <button className="mola-export" onClick={() => {
        const profileSource = usesBackendProfile ? 'NASA Mars Trek MOLA 463m' : 'Mission route elevation fixture';
        const csv = `metric,value,source\npath_length,${scenario.pathLength},${profileSource}\nselected_profile_distance,${selectedDistance},${profileSource}\nselected_relative_elevation,${selectedElevation},${profileSource}\nselected_local_slope,${selectedSlope.toFixed(1)} degrees,${profileSource}\nmax_slope,${maximumSlope.toFixed(1)} degrees,${profileSource}\nrover_battery,${scenario.battery},mission estimate\noxygen_point_of_no_return,${scenario.oxygenPoint},mission estimate`;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        link.download = `markswalk-${scenario.code.toLowerCase()}-manifest.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      }}><Download size={15} /> Export Mission Traverse Manifest (.CSV)</button>
    </section>
  );
}

function SurvivalPlaybook({ destinations }: { destinations: FeaturedDestination[] }) {
  const groups = [...new Set(survivalProtocols.map((protocol) => protocol.group))];

  return (
    <section className="playbook">
      <div className="playbook__hero">
        <p className="eyebrow">MARKSWALK FIELD MANUAL / SAFETY SYSTEMS</p>
        <h1>Survival <em>playbook.</em></h1>
        <p>Decision-ready procedures for the moments when the Martian environment stops being predictable.</p>
        <div className="playbook__meta"><span>REV 01 / SOL 0042</span><span>FOR TRAINING USE</span></div>
      </div>
      <div className="playbook__notice"><TriangleAlert size={18} /><div><strong>Use the lowest-risk verified procedure first.</strong><span>These protocols are demonstration fixtures, not operational flight guidance. Always defer to mission control and certified mission procedures.</span></div></div>
      <section className="playbook-destinations"><div className="protocol-group__heading"><p className="eyebrow">SURFACE INTELLIGENCE / DESTINATION BRIEFINGS</p><span>{destinations.length} FEATURED REGIONS</span></div><div className="playbook-destination-grid">{destinations.map((destination, index) => <article className="playbook-destination" key={destination.name}><img src={destination.image} alt={destination.name} /><div className="playbook-destination__body"><div className="protocol-card__top"><span className="protocol-card__code">DESTINATION / {String(index + 1).padStart(2, '0')}</span><span className="playbook-destination__coordinates">{destination.coordinates}</span></div><h2>{destination.name}</h2><p className="playbook-destination__description">{destination.fullDescription}</p><div className="playbook-destination__facts"><div><span>TERRAIN</span><strong>{destination.terrain}</strong></div><div><span>SCIENCE VALUE</span><strong>{destination.scienceValue}</strong></div><div><span>MISSION USE</span><strong>{destination.missionUse}</strong></div></div><a className="destination-card__button" href="/mission-planner">Explore in Mission Planner <ArrowUpRight size={14} /></a></div></article>)}</div></section>
      {groups.map((group) => <section className="protocol-group" key={group}><div className="protocol-group__heading"><p className="eyebrow">{group}</p><span>{survivalProtocols.filter((protocol) => protocol.group === group).length} PROCEDURE{survivalProtocols.filter((protocol) => protocol.group === group).length === 1 ? '' : 'S'}</span></div><div className="protocol-grid">{survivalProtocols.filter((protocol) => protocol.group === group).map((protocol) => <article className="protocol-card" key={protocol.title}><div className="protocol-card__top"><span className={`protocol-priority ${protocol.priority.startsWith('P1') ? 'protocol-priority--critical' : ''}`}>{protocol.priority}</span><span className="protocol-card__code">MK / {String(survivalProtocols.indexOf(protocol) + 1).padStart(2, '0')}</span></div><h2>{protocol.title}</h2><p className="protocol-trigger"><strong>TRIGGER</strong>{protocol.trigger}</p><ol>{protocol.steps.map((step) => <li key={step}>{step}</li>)}</ol></article>)}</div></section>)}
    </section>
  );
}

function ScienceImagerySection() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScienceResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<ScienceResult | null>(null);

  useEffect(() => {
    if (!selectedImage) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      setResults(await searchScienceImagery(query));
    } catch (requestError) {
      setResults(null);
      setError(requestError instanceof Error ? requestError.message : 'Science database request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const cards = results ?? imagery.map((item) => ({
    title: item.title,
    type: item.type,
    image: item.image,
    caption: item.caption,
  }));

  return (
    <section className="imagery section-band" id="science-imagery">
      <div className="section-heading">
        <div><p className="eyebrow">SCIENCE LOG / SURFACE DATABASE</p><h2>Science &amp; imagery.</h2></div>
        <span className="imagery__count">{results ? `${cards.length} RESULTS` : 'DEFAULT BRIEFING'}</span>
      </div>
      <form className="imagery-search" onSubmit={handleSearch}>
        <label htmlFor="science-search">SEARCH MARS FEATURES</label>
        <div className="imagery-search__controls">
          <input id="science-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Jezero, crater, mineral..." />
          <button type="submit" disabled={isLoading}>{isLoading ? <><span className="search-spinner" /> SEARCHING</> : 'SEARCH DATABASE'}</button>
        </div>
      </form>
      {error && <p className="imagery__message imagery__message--error" role="alert">{error}</p>}
      {!isLoading && !error && results && cards.length === 0 && <p className="imagery__message" role="status">No science records matched “{query}”. Try a broader search.</p>}
      <div className="imagery-grid">
        {cards.map((item, index) => <article className="image-card" key={`${item.title}-${index}`}>
          <button className="image-card__preview" type="button" onClick={() => setSelectedImage(item)} aria-label={`View ${item.title} fullscreen`}>
            <img src={item.image} alt={item.title} />
          </button>
          <div className="image-card__body">
            <span>{String(index + 1).padStart(2, '0')} / {item.type}</span>
            <h3>{item.title}</h3>
            <p>{item.caption}</p>
          </div>
        </article>)}
      </div>
      {selectedImage && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={`${selectedImage.title} image viewer`} onClick={(event) => { if (event.target === event.currentTarget) setSelectedImage(null); }}>
        <div className="image-lightbox__content">
          <button className="image-lightbox__close" type="button" onClick={() => setSelectedImage(null)} aria-label="Close fullscreen image">×</button>
          <img src={selectedImage.image} alt={selectedImage.title} />
          <div className="image-lightbox__caption">
            <span>{selectedImage.type}</span>
            <h3>{selectedImage.title}</h3>
            <p>{selectedImage.caption}</p>
          </div>
        </div>
      </div>}
    </section>
  );
}

function App() {
  const { scenario, setScenario, activeLayers, toggleLayer, selectedTarget, selectedSite, setSite, telemetryProgress } = useAppStore();
  const [backendLandmarks, setBackendLandmarks] = useState<MarsLandmark[]>([]);
  const [backendLandmarkError, setBackendLandmarkError] = useState('');
  const [marsWeather, setMarsWeather] = useState<MarsWeather | null>(null);
  const [marsWeatherError, setMarsWeatherError] = useState('');
  const [marsWeatherUpdatedAt, setMarsWeatherUpdatedAt] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const activeScenario = scenarios[scenario];
  const target = useMemo(() => targets.find((item) => item.id === selectedTarget), [selectedTarget]);
  const pathname = usePathname();
  const localClock = useLocalClock();
  const isPlannerPage = pathname === '/mission-planner';
  const isPlaybookPage = pathname === '/survival-playbook';
  const destinations = backendLandmarks.length ? mapBackendDestinations(backendLandmarks) : featuredDestinations;
  const selectedSiteDetails = sites.find((site) => site.id === selectedSite);

  useEffect(() => {
    const controller = new AbortController();
    fetchMarsLandmarks(controller.signal)
      .then(setBackendLandmarks)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setBackendLandmarkError(error instanceof Error ? error.message : 'Unable to load Mars locations.');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadWeather = () => {
      fetchMarsWeather(controller.signal)
        .then((weather) => {
          setMarsWeather(weather);
          setMarsWeatherError('');
          setMarsWeatherUpdatedAt(weather.freshness === 'live' ? Date.now() : null);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setMarsWeatherError(error instanceof Error ? error.message : 'Unable to load NASA Mars weather.');
        });
    };

    loadWeather();
    const interval = window.setInterval(loadWeather, 5 * 60 * 1000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  const weatherUpdated = marsWeatherUpdatedAt
    ? new Date(marsWeatherUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    : null;
  const temperature = marsWeather ? `${marsWeather.temperatureC.average.toFixed(1)}° C` : '—';
  const temperatureRange = marsWeather ? `${marsWeather.temperatureC.minimum.toFixed(1)}° / ${marsWeather.temperatureC.maximum.toFixed(1)}° C` : '—';
  const wind = marsWeather ? `${(marsWeather.windSpeedMps.average * 3.6).toFixed(1)} km/h ${marsWeather.windDirection}` : '—';
  const windRange = marsWeather ? `${(marsWeather.windSpeedMps.minimum * 3.6).toFixed(1)} / ${(marsWeather.windSpeedMps.maximum * 3.6).toFixed(1)} km/h` : '—';
  const pressure = marsWeather ? `${(marsWeather.pressurePa.average / 100).toFixed(1)} hPa` : '—';
  const pressureRange = marsWeather ? `${(marsWeather.pressurePa.minimum / 100).toFixed(1)} / ${(marsWeather.pressurePa.maximum / 100).toFixed(1)} hPa` : '—';
  const observationWindow = marsWeather ? `${marsWeather.firstUtc.replace('T', ' ').replace('Z', ' UTC')} — ${marsWeather.lastUtc.replace('T', ' ').replace('Z', ' UTC')}` : '—';

  return (
    <main className={isPlannerPage ? 'page--planner' : isPlaybookPage ? 'page--playbook' : 'page--home'}>
      <nav className={`nav ${isMenuOpen ? 'nav--menu-open' : ''}`}>
        <a className="brand" href="/"><span className="brand__mark">M</span><span>MARKSWALK</span></a>
        <div className="nav__links"><a onClick={() => setIsMenuOpen(false)} className={`nav__link ${!isPlannerPage && !isPlaybookPage ? 'nav__link--active' : ''}`} href="/">Home</a><a onClick={() => setIsMenuOpen(false)} className={`nav__link ${isPlannerPage ? 'nav__link--active' : ''}`} href="/mission-planner">Mission Planner</a><a onClick={() => setIsMenuOpen(false)} className="nav__link" href="/#telemetry">Telemetry &amp; Map</a><a onClick={() => setIsMenuOpen(false)} className="nav__link" href="/#science-imagery">Science &amp; Imagery</a><a onClick={() => setIsMenuOpen(false)} className={`nav__link ${isPlaybookPage ? 'nav__link--active' : ''}`} href="/survival-playbook">Survival Playbook</a></div>
        <div className="nav__status"><span className="status-dot" /> <span className="nav__clock" aria-label="Local time">{localClock}</span><span className="nav__divider" /><span className="nav__date">SOL 0042</span></div>
        <button className="nav__menu" type="button" aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>{isMenuOpen ? <X size={19} /> : <Menu size={19} />}</button>
      </nav>

      {isPlaybookPage && <SurvivalPlaybook destinations={destinations} />}

      <section className="hero">
        <div className="hero__image" />
        <div className="hero__copy"><h1>Plan the next<br /><em>human step</em> on Mars.</h1><p className="hero__lede">A layered field guide for navigating the Martian surface — built from terrain, climate, and the science that waits below the dust.</p><a className="hero__cta" href="/mission-planner">Open mission planner <ArrowUpRight size={16} /></a></div>
        <div className="hero__meta"><span>15.4° S / 184.3° E</span></div>
      </section>

      <section className="overview section-band" id="overview">
        <div className="section-heading"><div><p className="eyebrow">MISSION CONTROL / CURRENT BRIEF</p><h2>Mission overview.</h2></div><span className="overview__status"><i /> {missionOverview.status}</span></div>
        <div className="overview__grid">
          <div className="overview__brief"><p className="overview__objective">{missionOverview.objective}</p><p className="overview__note">Markswalk is building a safe, science-first traverse from orbital terrain, environmental, and spectral observations.</p><a className="text-link" href="/mission-planner">Open route workspace <ArrowUpRight size={14} /></a></div>
          <div className="overview__facts"><div><span>MISSION SOL</span><strong>{missionOverview.sol}</strong></div><div><span>LANDING REGION</span><strong>{missionOverview.landingSite}</strong></div><div><span>MISSION PHASE</span><strong>{missionOverview.phase}</strong></div><div><span>NEXT COMM WINDOW</span><strong>{missionOverview.nextWindow}</strong></div></div>
        </div>
        <div className="mission-status-grid">
          <div className="mission-status-card mission-status-card--progress"><span>MISSION COMPLETION</span><strong>{Math.round(((scenario === 'science' ? 61 : scenario === 'return' ? 82 : 48) + telemetryProgress * 8))}%</strong><div className="progress-track"><i style={{ width: `${Math.min(100, (scenario === 'science' ? 61 : scenario === 'return' ? 82 : 48) + telemetryProgress * 8)}%` }} /></div><small>Route execution / {activeScenario.code}</small></div>
          <div className="mission-status-card"><span>CURRENT ROVER LOCATION</span><strong>{sites.find((site) => site.id === selectedSite)?.name}</strong><small>{sites.find((site) => site.id === selectedSite)?.coordinates} / waypoint 03</small></div>
          <div className="mission-status-card"><span>NEXT OBJECTIVE</span><strong>{scenario === 'science' ? 'Survey hydrated minerals' : 'Reach Delta-03 checkpoint'}</strong><small>Target window / {missionOverview.nextWindow}</small></div>
          <div className="mission-status-card mission-status-card--warning"><span>RISK SUMMARY</span><strong>{activeScenario.risk} EXPOSURE</strong><small>{activeScenario.risk === 'LOW' ? 'No active critical warnings' : 'Slope caution on science corridor'}</small></div>
        </div>
        <div className="mission-brief-lower"><div className="mission-warnings"><div className="panel__label">ACTIVE WARNINGS <span>PROTOTYPE ESTIMATES</span></div><p><i /> {activeScenario.risk === 'LOW' ? 'No active critical warnings. Maintain nominal traverse speed.' : 'Slope hazard detected near the science corridor. Review alternate route.'}</p><p><i /> Communications window opens at {missionOverview.nextWindow}.</p></div><div className="mission-timeline"><div className="panel__label">MISSION TIMELINE <span>{activeScenario.duration} PLANNED</span></div>{missionTimeline.map((item) => <div className={`timeline-row timeline-row--${item.status}`} key={item.label}><i /> <span>{item.label}</span><b>{item.status}</b></div>)}</div></div>
        <div className="featured-destinations"><div className="featured-destinations__heading"><div><p className="eyebrow">EXPLORE THE SURFACE</p><h3>Featured destinations.</h3></div>{backendLandmarkError && <span className="destination-feed-status">BACKEND FEED ERROR</span>}</div><div className="destination-grid">{destinations.map((destination) => <article className="destination-card" key={destination.name}><img src={destination.image} alt={destination.name} /><div className="destination-card__body"><span>{destination.coordinates}</span><h4>{destination.name}</h4><p>{destination.description}</p><a className="destination-card__button" href="/survival-playbook">Explore <ArrowUpRight size={14} /></a></div></article>)}</div></div>
      </section>

      <section className="planner" id="planner">
        <div className="section-heading"><div><p className="eyebrow">LIVE MISSION PLANNER</p><h2>Choose your traverse.</h2></div><div className="mission-code"><span>MISSION</span><strong>{activeScenario.code}</strong></div></div>
        <div className="site-selector"><span className="site-selector__label">SELECT LANDING REGION</span>{sites.map((site) => <button className={selectedSite === site.id ? 'site-option site-option--active' : 'site-option'} key={site.id} onClick={() => setSite(site.id)}><strong>{site.name}</strong><small>{site.coordinates}</small></button>)}</div>
        <div className="planner__grid">
          <div className="planner-map-stack">
          <div className="map-card">
            <div className="map-card__head"><div className="map-card__title"><Map size={14} /> 2D SURFACE / PRIMARY PLANNING</div><span className="map-card__live"><i /> DATA LINK ACTIVE</span></div>
            <MarsSurface mode="map" />
            <div className="map-card__foot"><span><span className="telemetry-icon"><Radio size={13} /></span> ORBITAL TELEMETRY / NOMINAL</span><span>UPDATED 04:32:18 UTC</span></div>
          </div>
          <div className="map-card map-card--globe">
            <div className="map-card__head"><div className="map-card__title"><Orbit size={14} /> 3D GLOBE / CONTEXT</div><span className="map-card__live"><i /> ORBITAL VIEW</span></div>
            <MarsSurface mode="globe" />
            <div className="map-card__foot"><span /><span>LIVE ORIENTATION</span></div>
          </div>
          </div>
          <aside className="sidebar">
            <div className="panel scenario-panel"><div className="panel__label">TRAVERSE PROFILE / {selectedSiteDetails?.short} <span>01 / 03</span></div><div className="scenario-list">{(Object.keys(scenarios) as ScenarioId[]).map((id, index) => <button className={`scenario-option ${scenario === id ? 'scenario-option--active' : ''}`} key={id} onClick={() => setScenario(id)}><span className="scenario-option__number">0{index + 1}</span><span><strong>{scenarios[id].label}</strong><small>{id === 'safe' ? 'Low exposure / steady pace' : id === 'science' ? 'Maximum discovery yield' : 'Rapid return to habitat'}</small></span><ArrowUpRight size={14} /></button>)}</div></div>
            <div className="panel"><div className="panel__label">ACTIVE LAYERS <Layers3 size={14} /></div><div className="layer-list">{groups.map((group) => <div className="layer-group" key={group}><span className="layer-group__title">{group}</span>{layers.filter((layer) => layer.group === group).map((layer) => <button className="layer-row" key={layer.id} onClick={() => toggleLayer(layer.id)}><i className={`layer-toggle ${activeLayers.includes(layer.id) ? 'layer-toggle--on' : ''}`} style={{ '--layer-color': layer.color } as CSSProperties} /><span>{layer.label}</span><span className="layer-row__state">{activeLayers.includes(layer.id) ? 'ON' : 'OFF'}</span></button>)}</div>)}</div></div>
          </aside>
        </div>
      </section>

      <section className="metrics"><div className="section-heading section-heading--compact"><div><p className="eyebrow">ROUTE TELEMETRY</p><h2>{activeScenario.label}</h2></div><span className={`risk-badge risk-badge--${activeScenario.risk.toLowerCase()}`}><ShieldCheck size={15} /> {activeScenario.risk} EXPOSURE</span></div><div className="metric-grid"><div className="metric"><span className="metric__label"><Route size={14} /> DISTANCE</span><strong>{activeScenario.distance}</strong><small>walking path</small></div><div className="metric"><span className="metric__label"><Satellite size={14} /> EST. DURATION</span><strong>{activeScenario.duration}</strong><small>including science stops</small></div><div className="metric"><span className="metric__label"><Thermometer size={14} /> MAX SLOPE</span><strong>{activeScenario.slope}</strong><small>within suit tolerance</small></div><div className="metric"><span className="metric__label"><Lightbulb size={14} /> SCIENCE STOPS</span><strong>{activeScenario.science}</strong><small>priority targets</small></div><div className="metric"><span className="metric__label"><Radio size={14} /> COMMS LINK</span><strong>{activeScenario.comms}</strong><small>visibility coverage</small></div></div></section>
      <section className="quick-update section-band"><div className="section-heading"><div><p className="eyebrow">PLANETARY CONDITIONS / SOL {marsWeather?.sol ?? '—'}</p><h2>Quick update: Mars.</h2></div><span className={`update-time ${marsWeatherError || marsWeather?.freshness === 'cached' ? 'update-time--error' : ''}`}>{marsWeatherError ? 'NASA WEATHER ERROR' : marsWeather?.freshness === 'cached' ? 'NASA WEATHER CACHED' : weatherUpdated ? `UPDATED ${weatherUpdated} UTC` : 'LOADING NASA WEATHER'}</span></div><div className="update-grid update-grid--expanded"><div className="update-weather"><div className="weather-icon"><Thermometer size={22} /></div><div><span>INSIGHT WEATHER STATION</span><strong>{marsWeather ? `SOL ${marsWeather.sol} / ${marsWeather.season.toUpperCase()}` : marsWeatherError ? 'Weather unavailable' : 'Loading weather...'}</strong><small>NASA InSight Weather Service{marsWeather?.freshness === 'cached' ? ' / LAST VERIFIED READING' : ''}</small></div></div><div className="update-stat"><span>TEMPERATURE AVG</span><strong>{temperature}</strong></div><div className="update-stat"><span>TEMPERATURE MIN / MAX</span><strong>{temperatureRange}</strong></div><div className="update-stat"><span>WIND AVG / DIRECTION</span><strong>{wind}</strong></div><div className="update-stat"><span>WIND MIN / MAX</span><strong>{windRange}</strong></div><div className="update-stat"><span>PRESSURE AVG</span><strong>{pressure}</strong></div><div className="update-stat"><span>PRESSURE MIN / MAX</span><strong>{pressureRange}</strong></div><div className="update-stat update-stat--wide"><span>OBSERVATION WINDOW</span><strong>{observationWindow}</strong></div></div></section>
      <TelemetrySection />
      <TerrainProfile scenario={activeScenario} landmarks={backendLandmarks} />

      {isPlannerPage && <section className="detail-grid" id="science"><div className="detail-card detail-card--target"><div className="detail-card__head"><div><p className="eyebrow">SELECTED SCIENCE TARGET</p><h3>{target?.name ?? 'No target selected'}</h3></div><span className="target-index">TARGET / {target ? '01' : '--'}</span></div>{target ? <><div className="target-type"><Lightbulb size={14} /> {target.type}</div><p>{target.detail}</p><div className="source">SOURCE / MRO CRISM SPECTRAL DATA <ArrowUpRight size={13} /></div></> : <p>Enable the Science targets layer and select a marker on the map.</p>}</div><div className="detail-card"><div className="detail-card__head"><div><p className="eyebrow">FIELD CONDITIONS</p><h3>InSight station / SOL {marsWeather?.sol ?? '—'}</h3></div><span className={`condition-live ${marsWeatherError ? 'condition-live--error' : ''}`}><i /> {marsWeatherError ? 'UNAVAILABLE' : 'LIVE'}</span></div><div className="condition-grid"><div><span>TEMPERATURE</span><strong>{temperature}</strong></div><div><span>WIND</span><strong>{wind}</strong></div><div><span>SURFACE PRESSURE</span><strong>{pressure}</strong></div></div><div className="source">SOURCE / NASA INSIGHT WEATHER SERVICE <ArrowUpRight size={13} /></div></div></section>}
      <ScienceImagerySection />
      <footer><span>MARKSWALK</span><span><span className="footer-dot">●</span> NASA SPACE APPS 2026</span></footer>
    </main>
  );
}

export default App;
