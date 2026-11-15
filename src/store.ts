import { create } from 'zustand';
import type { ScenarioId, SiteId } from './data';

type ViewMode = 'map' | 'globe';

type AppState = {
  scenario: ScenarioId;
  view: ViewMode;
  activeLayers: string[];
  selectedTarget: string | null;
  selectedSite: SiteId;
  autoRotate: boolean;
  telemetryProgress: number;
  setScenario: (scenario: ScenarioId) => void;
  setView: (view: ViewMode) => void;
  toggleLayer: (layer: string) => void;
  selectTarget: (target: string | null) => void;
  setSite: (site: SiteId) => void;
  toggleAutoRotate: () => void;
  setTelemetryProgress: (progress: number) => void;
};

export const useAppStore = create<AppState>((set) => ({
  scenario: 'safe',
  view: 'map',
  activeLayers: ['terrain', 'slope', 'rover', 'science'],
  selectedTarget: 'a',
  selectedSite: 'gale',
  autoRotate: true,
  telemetryProgress: 0,
  setScenario: (scenario) => set({ scenario }),
  setView: (view) => set({ view }),
  toggleLayer: (layer) => set((state) => ({
    activeLayers: state.activeLayers.includes(layer)
      ? state.activeLayers.filter((item) => item !== layer)
      : [...state.activeLayers, layer],
  })),
  selectTarget: (selectedTarget) => set({ selectedTarget }),
  setSite: (selectedSite) => set({ selectedSite }),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  setTelemetryProgress: (telemetryProgress) => set({ telemetryProgress }),
}));
