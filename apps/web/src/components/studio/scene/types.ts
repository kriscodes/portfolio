import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';

export type StudioView = 'work' | 'life' | 'about';
export type LifeFocus = 'boat' | 'map' | 'outside' | null;
export type AboutFocus = 'story' | 'experience' | 'approach' | null;
export type Point2 = [number, number];
export interface ProjectedPlane {
  key: string;
  points: Point2[];
}
export interface StudioCameraOptions {
  animate?: boolean;
  immediate?: boolean;
  reducedMotion?: boolean;
  duration?: number;
}
export interface ProjectScreenState {
  collection?: 'work' | 'experiments';
  selected?: string | null;
  title?: string;
  status?: string;
  headerHeight?: number;
  footerHeight?: number;
  tabHeight?: number;
}
export interface StudioCallbacks {
  onNavigate?: (key: StudioView) => void;
  onRotate?: (degrees: number) => void;
  onViewChange?: (state: { key: StudioView | null; settled: boolean }) => void;
  onSignLayout?: (signs: (ProjectedPlane & { visible: boolean })[]) => void;
  onMonitorLayout?: (layout: { points: Point2[]; visible: boolean }) => void;
  onLifeLayout?: (layout: {
    focus: LifeFocus;
    visible: boolean;
    planes: ProjectedPlane[];
    mapWidth: number;
    controlsHeight: number;
  }) => void;
  onAboutLayout?: (layout: {
    focus: AboutFocus;
    visible: boolean;
    planes: ProjectedPlane[];
  }) => void;
  onLifeState?: (state: { playing: boolean; direction: number; focus: LifeFocus }) => void;
  onAboutState?: (state: { focus: AboutFocus }) => void;
}
export type StudioSceneCallbacks = StudioCallbacks;
export interface StudioSceneAPI {
  setTheme(progress: number): void;
  setAngle(degrees: number): void;
  navigateTo(key: StudioView, options?: StudioCameraOptions): boolean;
  resetView(options?: StudioCameraOptions): boolean;
  focusMonitor(enabled: boolean, options?: StudioCameraOptions): void;
  focusLife(key: LifeFocus, options?: StudioCameraOptions): void;
  focusAbout(key: AboutFocus, options?: StudioCameraOptions): void;
  setAboutPage(key: string, index: number): void;
  setLifePlaying(playing: boolean): void;
  reverseVoyage(): void;
  rippleWater(): void;
  setProjectScreen(state: ProjectScreenState): void;
  highlightSign(key: string | null): void;
  tick(now: number): void;
  render(): void;
  dispose(): void;
}
export interface StudioEngine {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  invalidate: () => void;
}
