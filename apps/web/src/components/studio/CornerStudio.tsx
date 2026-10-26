'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createStudioController, type StudioController } from './controller';
import type { StudioSceneAPI } from './scene/types';
import type { StudioModelState } from './state';
import StudioHeader from './StudioHeader';
import ProjectMonitor from './ProjectMonitor';
import LifeControls from './LifeControls';
import AboutTerminal from './AboutTerminal';
import SignNavigation from './SignNavigation';
import StudioFooter from './StudioFooter';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/rajdhani/latin-400.css';
import '@fontsource/rajdhani/latin-500.css';
import './studio.css';

const StudioCanvas = dynamic(() => import('./StudioCanvas'), { ssr: false });

export default function CornerStudio() {
  const root = useRef<HTMLDivElement>(null);
  const controller = useRef<StudioController | null>(null);
  const [connection, setConnection] = useState<{
    element: HTMLElement;
    controller: StudioController;
  } | null>(null);
  const [theme, setTheme] = useState<'day' | 'night'>('night');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const stateChanged = useCallback((state: StudioModelState) => setTheme(state.theme), []);
  const sceneReady = useCallback((scene: StudioSceneAPI | null) => {
    controller.current?.attachScene(scene);
    if (scene) setReady(true);
  }, []);
  const sceneFailed = useCallback((error: Error) => {
    console.error('Studio scene unavailable', error);
    setFailed(true);
  }, []);

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
      className={failed ? 'kd-no-scene' : ''}
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
            {connection && !failed && (
              <StudioCanvas
                sceneElement={connection.element}
                callbacks={connection.controller.callbacks}
                onReady={sceneReady}
                onError={sceneFailed}
              />
            )}
          </div>
          {!ready && !failed && (
            <p className="kd-scene-loading" role="status">
              Opening the studio…
            </p>
          )}
          {failed && (
            <section className="kd-scene-alternative" aria-label="Explore the portfolio">
              <p>
                The studio couldn’t open on this device. You can explore the same work and
                background here.
              </p>
              <nav aria-label="Portfolio pages">
                <Link href="/work/">Selected work</Link>
                <Link href="/about/">About Kristian</Link>
                <Link href="/contact/">Get in touch</Link>
              </nav>
            </section>
          )}
          <ProjectMonitor />
          <LifeControls />
          <AboutTerminal />
          <SignNavigation />
        </div>
      </div>
      <StudioFooter />
    </div>
  );
}
