import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Map from 'ol/Map.js';
import Overlay from 'ol/Overlay.js';
import View from 'ol/View.js';
import Feature from 'ol/Feature.js';
import LineString from 'ol/geom/LineString.js';
import Point from 'ol/geom/Point.js';
import Polygon from 'ol/geom/Polygon.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import XYZ from 'ol/source/XYZ.js';
import VectorSource from 'ol/source/Vector.js';
import TileGrid from 'ol/tilegrid/TileGrid.js';
import CircleStyle from 'ol/style/Circle.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';
import { defaults as defaultInteractions } from 'ol/interaction/defaults.js';
import 'ol/ol.css';
import { fetchMarsLandmarks, marsMolaTileUrl, type MarsLandmark } from './marsLocations';
import { mapZones } from './data';

export type MarsCoordinate = readonly [number, number];

type MarsMapProps = {
  route: readonly MarsCoordinate[];
  roverProgress?: number;
  zoom?: number;
  selectedWaypoint?: number | null;
  activeLayers: readonly string[];
  siteCoordinates?: MarsCoordinate;
  onMapClick?: (coordinates: MarsCoordinate) => void;
  onMapMove?: (coordinates: MarsCoordinate) => void;
  onWaypointClick?: (index: number) => void;
};

const mapExtent: [number, number, number, number] = [-180, -90, 180, 90];
const resolutions = Array.from({ length: 8 }, (_, zoom) => 360 / (256 * 2 ** zoom));

const routeStyle = new Style({
  stroke: new Stroke({ color: '#e07b5b', width: 3 }),
});

const landmarkStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: '#c2d96d' }),
    stroke: new Stroke({ color: '#16201a', width: 2 }),
  }),
});

const waypointStyle = (index: number, selected: boolean) => new Style({
  image: new CircleStyle({
    radius: selected ? 9 : 7,
    fill: new Fill({ color: selected ? '#e07b5b' : '#151c27' }),
    stroke: new Stroke({ color: selected ? '#f0a184' : '#e8e4d9', width: 2 }),
  }),
  text: new Text({
    text: String(index + 1),
    fill: new Fill({ color: '#e8e4d9' }),
    font: '10px Share Tech Mono',
  }),
});

const zoneStyles: Record<string, Style> = {
  radiation: new Style({ fill: new Fill({ color: 'rgba(200, 110, 139, .28)' }), stroke: new Stroke({ color: '#c86e8b', width: 1 }) }),
  temperature: new Style({ fill: new Fill({ color: 'rgba(120, 185, 191, .2)' }), stroke: new Stroke({ color: '#78b9bf', width: 1 }) }),
  comms: new Style({ fill: new Fill({ color: 'rgba(112, 180, 215, .15)' }), stroke: new Stroke({ color: '#70b4d7', width: 1 }) }),
};

function zoneFeature(zone: { x: number; y: number; width: number; height: number }) {
  const left = -180 + (zone.x / 100) * 360;
  const right = -180 + ((zone.x + zone.width) / 100) * 360;
  const top = 90 - (zone.y / 100) * 180;
  const bottom = 90 - ((zone.y + zone.height) / 100) * 180;
  return new Feature(new Polygon([[[left, bottom], [left, top], [right, top], [right, bottom], [left, bottom]]]));
}

function formatCoordinates([longitude, latitude]: MarsCoordinate) {
  const eastLongitude = ((longitude % 360) + 360) % 360;
  return `${Math.abs(latitude).toFixed(1)}° ${latitude >= 0 ? 'N' : 'S'} / ${eastLongitude.toFixed(1)}° E`;
}

export function MarsMap({ route, roverProgress = 0, zoom = 1, selectedWaypoint = null, activeLayers, siteCoordinates, onMapClick, onMapMove, onWaypointClick }: MarsMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const popupElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map>();
  const routeSourceRef = useRef(new VectorSource());
  const landmarkSourceRef = useRef(new VectorSource());
  const zoneSourceRef = useRef(new VectorSource());
  const onMapClickRef = useRef(onMapClick);
  const onMapMoveRef = useRef(onMapMove);
  const onWaypointClickRef = useRef(onWaypointClick);
  const [landmarks, setLandmarks] = useState<MarsLandmark[]>([]);
  const [loadError, setLoadError] = useState('');
  const [selectedLandmark, setSelectedLandmark] = useState<MarsLandmark | null>(null);
  const siteLongitude = siteCoordinates?.[0];
  const siteLatitude = siteCoordinates?.[1];

  onMapClickRef.current = onMapClick;
  onMapMoveRef.current = onMapMove;
  onWaypointClickRef.current = onWaypointClick;

  useEffect(() => {
    const controller = new AbortController();
    fetchMarsLandmarks(controller.signal)
      .then((items) => {
        setLandmarks(items);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load Mars landmarks.');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!mapElementRef.current || !popupElementRef.current) return;
    const tileLayer = new TileLayer({
      source: new XYZ({
        url: marsMolaTileUrl,
        projection: 'EPSG:4326',
        tileGrid: new TileGrid({ extent: mapExtent, origin: [-180, 90], resolutions, tileSize: 256 }),
        attributions: 'NASA / JPL-Caltech / USGS / ASU / Mars Trek',
        maxZoom: 7,
      }),
    });
    const routeLayer = new VectorLayer({ source: routeSourceRef.current, style: routeStyle });
    const landmarkLayer = new VectorLayer({ source: landmarkSourceRef.current, style: landmarkStyle });
    const zoneLayer = new VectorLayer({ source: zoneSourceRef.current });
    const popup = new Overlay({ element: popupElementRef.current, autoPan: { animation: { duration: 250 } } });
    const map = new Map({
      target: mapElementRef.current,
      layers: [tileLayer, zoneLayer, routeLayer, landmarkLayer],
      overlays: [popup],
      view: new View({ projection: 'EPSG:4326', center: siteCoordinates ? siteCoordinates.slice() : [0, 0], zoom: siteCoordinates ? 3 : 2, minZoom: 0, maxZoom: 7, extent: mapExtent }),
      controls: [],
      interactions: defaultInteractions({ mouseWheelZoom: true, dragPan: true, pinchZoom: true }),
    });

    map.on('pointermove', (event) => {
      const coordinate = event.coordinate as unknown as MarsCoordinate;
      onMapMoveRef.current?.(coordinate);
      const target = map.getTargetElement();
      if (target) target.style.cursor = map.hasFeatureAtPixel(event.pixel) ? 'pointer' : '';
    });
    map.on('singleclick', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (item) => item);
      const landmark = feature?.get('landmark') as MarsLandmark | undefined;
      const waypointIndex = feature?.get('waypointIndex') as number | undefined;
      if (landmark) {
        setSelectedLandmark(landmark);
        popup.setPosition(event.coordinate);
        return;
      }
      if (waypointIndex !== undefined) {
        onWaypointClickRef.current?.(waypointIndex);
        return;
      }
      popup.setPosition(undefined);
      setSelectedLandmark(null);
      onMapClickRef.current?.(event.coordinate as unknown as MarsCoordinate);
    });

    mapRef.current = map;
    return () => {
      map.setTarget(undefined);
      mapRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    const view = mapRef.current?.getView();
    if (view && siteLongitude !== undefined && siteLatitude !== undefined) {
      view.setCenter([siteLongitude, siteLatitude]);
      view.setZoom(3);
    }
  }, [siteLongitude, siteLatitude]);

  useEffect(() => {
    const source = landmarkSourceRef.current;
    source.clear();
    source.addFeatures(landmarks.map((landmark) => {
      const feature = new Feature({ geometry: new Point([landmark.longitude > 180 ? landmark.longitude - 360 : landmark.longitude, landmark.latitude]) });
      feature.set('landmark', landmark);
      return feature;
    }));
  }, [landmarks]);

  useEffect(() => {
    const source = zoneSourceRef.current;
    source.clear();
    const layers = [
      ['radiation', mapZones.radiation],
      ['temperature', mapZones.temperature],
      ['comms', mapZones.comms],
    ] as const;
    layers.forEach(([layer, zones]) => {
      if (!activeLayers.includes(layer)) return;
      zones.forEach((zone) => {
        const feature = zoneFeature(zone);
        feature.setStyle(zoneStyles[layer]);
        source.addFeature(feature);
      });
    });
  }, [activeLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getLayers().item(0).setVisible(activeLayers.includes('terrain'));
    map.getLayers().item(2).setVisible(activeLayers.includes('rover'));
    map.getLayers().item(3).setVisible(activeLayers.includes('science'));
  }, [activeLayers]);

  useEffect(() => {
    const source = routeSourceRef.current;
    source.clear();
    if (route.length > 1) source.addFeature(new Feature(new LineString(route.map(([longitude, latitude]) => [longitude, latitude]))));
    route.forEach(([longitude, latitude], index) => {
      const feature = new Feature(new Point([longitude, latitude]));
      feature.set('waypointIndex', index);
      feature.setStyle(waypointStyle(index, selectedWaypoint === index));
      source.addFeature(feature);
    });
    const roverPoint = route[Math.min(route.length - 1, Math.floor(roverProgress * route.length))];
    if (roverPoint) {
      const rover = new Feature(new Point(roverPoint.slice()));
      rover.setStyle(new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: '#78b9bf' }),
          stroke: new Stroke({ color: '#e8e4d9', width: 2 }),
        }),
        text: new Text({ text: 'ROVER', offsetY: -16, fill: new Fill({ color: '#e8e4d9' }), font: '10px Share Tech Mono' }),
      }));
      source.addFeature(rover);
    }
  }, [route, roverProgress, selectedWaypoint]);

  useEffect(() => {
    const view = mapRef.current?.getView();
    if (view) view.setZoom(2 + (zoom - 1) * 3);
  }, [zoom]);

  return (
    <div className="mars-map">
      <div ref={mapElementRef} className="mars-map__canvas" />
      <div ref={popupElementRef} className="mars-map__popup">
        {selectedLandmark && <><button className="mars-map__popup-close" onClick={() => { setSelectedLandmark(null); mapRef.current?.getOverlays().item(0).setPosition(undefined); }} aria-label="Close landmark details">×</button><strong>{selectedLandmark.name}</strong><span>{selectedLandmark.featureType}</span><p>{selectedLandmark.description}</p><small>{formatCoordinates([selectedLandmark.longitude, selectedLandmark.latitude])}</small></>}
      </div>
      <div className="mars-map__status" role="status" style={{ '--status-color': loadError ? '#e5ad58' : '#78b9bf' } as CSSProperties}>{loadError ? `LANDMARK FEED ERROR / ${loadError}` : `${landmarks.length || '...'} NASA LANDMARKS / EPSG:4326`}</div>
    </div>
  );
}
