import { createControllerRuntime } from './controller-runtime';
import type { StudioCallbacks, StudioSceneAPI } from './scene/types';
import type { StudioModelState } from './state';

export interface StudioController {
  callbacks: StudioCallbacks;
  attachScene(scene: StudioSceneAPI | null): void;
  dispose(): void;
}

/** Keeps projection-driven DOM updates outside React's per-frame render cycle. */
export function createStudioController(
  root: HTMLElement,
  onStateChange: (state: StudioModelState) => void,
): StudioController {
  return createControllerRuntime(root, onStateChange) as StudioController;
}
