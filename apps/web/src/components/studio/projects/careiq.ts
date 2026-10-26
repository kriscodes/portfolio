import type { ProjectPreview } from './types';

type CareIQModule = {
  mountCareIQMonitor: (host: HTMLElement) => () => void;
};

let runtime: Promise<CareIQModule> | undefined;

async function loadRuntime(): Promise<CareIQModule> {
  // The approved synthetic app includes its own licensed React runtime. Keeping it
  // in an ESM asset avoids coupling its React root and CSS to the studio shell.
  const path = '/studio/projects/careiq-preview.js';
  runtime ??= import(/* webpackIgnore: true */ /* turbopackIgnore: true */ path).catch((error) => {
    runtime = undefined;
    throw error;
  });
  return runtime!;
}

function mountPreview(
  host: HTMLElement,
  mountCareIQMonitor: CareIQModule['mountCareIQMonitor'],
): ProjectPreview {
  const unmount = mountCareIQMonitor(host);
  const previousInert = host.inert;
  let disposed = false;
  host.inert = true;
  return {
    setActive(active) {
      if (!disposed) host.inert = !active;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      unmount();
      host.inert = previousInert;
    },
  };
}

// Resolve the asset before touching DOM, then let the shared loader check whether
// this request still owns its host. No top-level await means a failed asset load
// does not permanently poison the wrapper module and the caller can retry.
export async function loadPreview(): Promise<(host: HTMLElement) => ProjectPreview> {
  const { mountCareIQMonitor } = await loadRuntime();
  return (host) => mountPreview(host, mountCareIQMonitor);
}
