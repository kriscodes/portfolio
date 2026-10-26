import type { ProjectPreview, ProjectPreviewId } from './types';

export type { ProjectPreview, ProjectPreviewId } from './types';

const mounts = new WeakMap<HTMLElement, { preview?: ProjectPreview }>();

/** Load only the project that the visitor opens. Both previews are local and offline. */
export async function mountProjectPreview(
  id: ProjectPreviewId,
  host: HTMLElement,
): Promise<ProjectPreview> {
  mounts.get(host)?.preview?.dispose();
  const ticket: { preview?: ProjectPreview } = {};
  mounts.set(host, ticket);
  const mount =
    id === 'careiq'
      ? await (await import('./careiq')).loadPreview()
      : (await import('./neon-drift')).mountPreview;

  // A newer selection won while this module was loading. Do not replace its screen.
  if (mounts.get(host) !== ticket) return { dispose() {} };

  const preview = mount(host);
  let disposed = false;
  const handle: ProjectPreview = {
    setActive(active) {
      if (!disposed) preview.setActive?.(active);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      preview.dispose();
      if (mounts.get(host) === ticket) mounts.delete(host);
    },
  };
  ticket.preview = handle;
  return handle;
}
