import type { StudioProject } from '../data';
import type { ProjectScreenState } from './types';
import {
  paintKristianProjectPreview as preview,
  paintKristianProjectScreen as projectScreen,
  paintKristianVoyageMap as voyageMap,
  paintKristianAboutWallPage as aboutWall,
} from './texturePainters';

export function paintKristianProjectPreview(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  id: string,
) {
  preview(context, width, height, id);
}

export function paintKristianProjectScreen(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: ProjectScreenState,
  projects: StudioProject[],
) {
  projectScreen(context, width, height, state, projects);
}

export const paintKristianVoyageMap = voyageMap;
export const paintKristianAboutWallPage = aboutWall;
