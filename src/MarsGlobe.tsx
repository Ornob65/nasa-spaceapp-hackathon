import { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { fetchMarsLandmarks, marsMolaTileUrl, type MarsLandmark } from './marsLocations';

type MarsGlobeProps = {
  autoRotate: boolean;
  siteName?: string;
  siteCoordinates?: readonly [number, number];
  onToggleAutoRotate: () => void;
};

const marsEllipsoid = new Cesium.Ellipsoid(3396190, 3396190, 3396190);
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[character] ?? character));
}

function landmarkDescription(landmark: MarsLandmark) {
  return `<strong>${escapeHtml(landmark.name)}</strong><br/><span>${escapeHtml(landmark.featureType)}</span><p>${escapeHtml(landmark.description)}</p>`;
}

export function MarsGlobe({ autoRotate, siteName, siteCoordinates, onToggleAutoRotate }: MarsGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer>();
  const [landmarkCount, setLandmarkCount] = useState(0);
  const [loadError, setLoadError] = useState('');
  const siteLongitude = siteCoordinates?.[0];
  const siteLatitude = siteCoordinates?.[1];

  useEffect(() => {
    if (!containerRef.current) return;
    const globe = new Cesium.Globe(marsEllipsoid);
    const viewer = new Cesium.Viewer(containerRef.current, {
      globe,
      baseLayer: false,
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: true,
      navigationHelpButton: false,
      sceneModePicker: false,
      selectionIndicator: true,
      timeline: false,
      creditContainer: document.createElement('div'),
      shouldAnimate: true,
    });
    viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
      url: marsMolaTileUrl,
      tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid: marsEllipsoid }),
      rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
      maximumLevel: 7,
      credit: new Cesium.Credit('NASA / JPL-Caltech / USGS / ASU / Mars Trek'),
    }));
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#21191b');
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#090b0f');
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, -10, 6000000, marsEllipsoid),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
    });
    viewerRef.current = viewer;
    return () => {
      if (!viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const tick = () => {
      if (autoRotate) viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.0007);
    };
    if (viewer.isDestroyed()) return;
    viewer.clock.onTick.addEventListener(tick);
    return () => {
      if (!viewer.isDestroyed()) viewer.clock.onTick.removeEventListener(tick);
    };
  }, [autoRotate]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || siteLongitude === undefined || siteLatitude === undefined) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(siteLongitude, siteLatitude, 6000000, marsEllipsoid),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
      duration: 0.8,
    });
  }, [siteLongitude, siteLatitude]);

  useEffect(() => {
    const controller = new AbortController();
    fetchMarsLandmarks(controller.signal)
      .then((landmarks) => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        landmarks.forEach((landmark) => {
          viewer.entities.add({
            name: landmark.name,
            position: Cesium.Cartesian3.fromDegrees(landmark.longitude > 180 ? landmark.longitude - 360 : landmark.longitude, landmark.latitude, 5000, marsEllipsoid),
            point: {
              pixelSize: 8,
              color: Cesium.Color.fromCssColorString('#c2d96d'),
              outlineColor: Cesium.Color.fromCssColorString('#16201a'),
              outlineWidth: 2,
              disableDepthTestDistance: 500000,
            },
            description: new Cesium.ConstantProperty(landmarkDescription(landmark)),
          });
        });
        setLandmarkCount(landmarks.length);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load Mars landmarks.');
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="mars-globe">
      <div ref={containerRef} className="mars-globe__canvas" />
      <div className="mars-globe__overlay">
        <span>MARS / CESIUM ORBITAL VIEW</span>
        <span>{siteName ? `${siteName.toUpperCase()} / ` : ''}{loadError ? 'LANDMARK FEED ERROR' : `${landmarkCount || '...'} LANDMARKS`}</span>
      </div>
      <button className="globe__rotate" onClick={onToggleAutoRotate}><RotateCw size={13} /> AUTO ROTATE: {autoRotate ? 'ON' : 'OFF'}</button>
      {loadError && <div className="mars-globe__error" role="status">{loadError}</div>}
    </div>
  );
}
