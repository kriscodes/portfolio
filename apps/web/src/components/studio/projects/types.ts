export type ProjectPreviewId = 'careiq' | 'neon-drift';

export interface ProjectPreview {
  /** Pause rendering and pointer input when the monitor is outside its close-up. */
  setActive?: (active: boolean) => void;
  /** Safe to call more than once. Releases the React root, RAF, observers and listeners. */
  dispose: () => void;
}
