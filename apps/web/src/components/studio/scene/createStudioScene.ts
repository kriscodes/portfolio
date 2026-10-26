import { assembleStudio } from './assembleStudio';
import type { StudioCallbacks, StudioEngine, StudioSceneAPI } from './types';

/** Fiber owns the renderer and its loop; the model owns only its scene objects. */
export function createStudioScene(
  element: HTMLElement,
  callbacks: StudioCallbacks,
  engine: StudioEngine,
): StudioSceneAPI {
  return assembleStudio(element, callbacks, engine) as StudioSceneAPI;
}

export type { StudioCallbacks, StudioSceneAPI } from './types';
