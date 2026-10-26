'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createStudioController, type StudioController } from './controller';
import type { StudioSceneAPI } from './scene/types';
import type { StudioModelState } from './state';
import StudioHeader from './StudioHeader';
import ProjectMonitor from './ProjectMonitor';
import LifeControls from './LifeControls';
import AboutTerminal from './AboutTerminal';
import SignNavigation from './SignNavigation';
import StudioFooter from './StudioFooter';
import StudioFallback from './StudioFallback';
import { readStudioState, saveStudioTheme } from './state';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/rajdhani/latin-400.css';
import '@fontsource/rajdhani/latin-500.css';
import './studio.css';

const StudioCanvas = dynamic(() => import('./StudioCanvas'), { ssr: false });

class StudioBoundary extends Component<
  { children: ReactNode; onUnavailable: (error: Error) => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onUnavailable(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function CornerStudio() {
  const [flat, setFlat] = useState(false);
  const [reason, setReason] = useState<'graphics' | 'chosen'>('graphics');
  const [theme, setTheme] = useState<'day' | 'night'>('night');
  useEffect(() => {
    setTheme(readStudioState().modelContent.theme);
    if (new URLSearchParams(window.location.search).get('view') === '2d') {
      setReason('chosen');
      setFlat(true);
    }
  }, []);
  const unavailable = useCallback(() => {
    setReason('graphics');
    setFlat(true);
  }, []);
  const selectView = (nextFlat: boolean) => {
    const url = new URL(window.location.href);
    if (nextFlat) url.searchParams.set('view', '2d');
    else url.searchParams.delete('view');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    setReason('chosen');
    setFlat(nextFlat);
  };
  if (flat)
    return (
      <StudioFallback
        theme={theme}
        reason={reason}
        onThemeChange={(next) => {
          setTheme(next);
          saveStudioTheme(next);
        }}
        onTry3D={() => selectView(false)}
      />
    );
  return (
    <StudioBoundary onUnavailable={unavailable}>
      <InteractiveStudio
        onUnavailable={unavailable}
        onThemeChange={setTheme}
        onFlatView={() => selectView(true)}
      />
    </StudioBoundary>
  );
}

function InteractiveStudio({
  onUnavailable,
  onThemeChange,
  onFlatView,
}: {
  onUnavailable: (error?: Error) => void;
  onThemeChange: (theme: 'day' | 'night') => void;
  onFlatView: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const controller = useRef<StudioController | null>(null);
  const [connection, setConnection] = useState<{
    element: HTMLElement;
    controller: StudioController;
  } | null>(null);
  const [theme, setTheme] = useState<'day' | 'night'>('night');
  const [ready, setReady] = useState(false);
  const stateChanged = useCallback(
    (state: StudioModelState) => {
      setTheme(state.theme);
      onThemeChange(state.theme);
    },
    [onThemeChange],
  );
  const sceneReady = useCallback((scene: StudioSceneAPI | null) => {
    controller.current?.attachScene(scene);
    if (scene) setReady(true);
  }, []);
  const sceneFailed = onUnavailable;

  useEffect(() => {
    if (ready) return;
    const timeout = window.setTimeout(
      () => onUnavailable(new Error('The 3D view did not finish opening.')),
      15_000,
    );
    return () => window.clearTimeout(timeout);
  }, [ready, onUnavailable]);

  useEffect(() => {
    if (!root.current) return;
    const current = createStudioController(root.current, stateChanged);
    controller.current = current;
    const element = root.current.querySelector<HTMLElement>('#kd-scene');
    if (element) setConnection({ element, controller: current });
    return () => {
      controller.current = null;
      current.dispose();
    };
  }, [stateChanged]);

  return (
    <div
      ref={root}
      id="ks-daynight"
      data-mode={theme}
      data-view="overview"
      aria-label="Kristian’s corner studio portfolio"
    >
      <div className="kd-atmosphere" aria-hidden="true" />
      <StudioHeader />
      <div className="kd-main">
        <div className="kd-scene-stage">
          <div
            className="kd-scene"
            id="kd-scene"
            role="img"
            aria-label="A corner studio with an indoor sailing display, plants and camera equipment. A white Silverado sits in the parking lot beside distant neon storefronts. Choose Work, Life or About, or drag to look around."
          >
            {connection && (
              <StudioCanvas
                sceneElement={connection.element}
                callbacks={connection.controller.callbacks}
                onReady={sceneReady}
                onError={sceneFailed}
              />
            )}
          </div>
          {!ready && (
            <p className="kd-scene-loading" role="status">
              Opening the studio…
            </p>
          )}
          <ProjectMonitor />
          <LifeControls />
          <AboutTerminal />
          <SignNavigation />
        </div>
      </div>
      <StudioFooter onFlatView={onFlatView} />
    </div>
  );
}
