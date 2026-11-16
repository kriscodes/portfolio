'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { SailRenderer } from './sail-renderer';
import './sail-study.css';

const SAIL_IMAGE = '/images/editorial-sail.webp';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
type WindState = 'idle' | 'loading' | 'playing' | 'settling' | 'unavailable';

function subscribeToMotionPreference(onChange: () => void) {
  const preference = window.matchMedia(REDUCED_MOTION_QUERY);
  preference.addEventListener('change', onChange);
  return () => preference.removeEventListener('change', onChange);
}

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function serverMotionPreference() {
  return false;
}

export default function SailStudy() {
  const [wind, setWind] = useState<WindState>('idle');
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [inView, setInView] = useState(true);
  const [status, setStatus] = useState('The sail is at rest.');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<SailRenderer | null>(null);
  const requestRef = useRef(0);
  const visibilityRef = useRef(true);
  const loadRef = useRef<AbortController | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    prefersReducedMotion,
    serverMotionPreference,
  );

  useEffect(() => {
    const preference = window.matchMedia(REDUCED_MOTION_QUERY);
    const stage = stageRef.current;

    // Hidden or offscreen artwork must not keep an animation or GPU context alive.
    function restoreStill() {
      requestRef.current += 1;
      loadRef.current?.abort();
      rendererRef.current?.dispose();
      rendererRef.current = null;
      setCanvasVisible(false);
      setCanvasVersion((version) => version + 1);
      setWind((current) => (current === 'unavailable' ? current : 'idle'));
      setStatus('The sail is at rest.');
    }

    function onVisibilityChange() {
      if (document.hidden) restoreStill();
    }

    function onMotionPreferenceChange() {
      if (preference.matches) restoreStill();
    }

    const observer = new IntersectionObserver(([entry]) => {
      visibilityRef.current = entry.isIntersecting;
      setInView(entry.isIntersecting);
      if (!entry.isIntersecting) restoreStill();
    });
    if (stage) observer.observe(stage);
    document.addEventListener('visibilitychange', onVisibilityChange);
    preference.addEventListener('change', onMotionPreferenceChange);

    return () => {
      requestRef.current += 1;
      loadRef.current?.abort();
      rendererRef.current?.dispose();
      rendererRef.current = null;
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      preference.removeEventListener('change', onMotionPreferenceChange);
    };
  }, []);

  async function catchWind() {
    if (!visibilityRef.current) return;
    if (reducedMotion || wind === 'loading' || wind === 'settling' || wind === 'unavailable')
      return;
    if (wind === 'playing') {
      rendererRef.current?.settle();
      setWind('settling');
      setStatus('The wind is easing. The sail is settling.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const request = ++requestRef.current;
    const load = new AbortController();
    loadRef.current = load;
    setWind('loading');
    setStatus('Preparing the wind study.');

    try {
      // The still image renders first. Animation code loads only on interaction.
      const { createSailRenderer } = await import('./sail-renderer');
      if (request !== requestRef.current) return;
      const renderer = await createSailRenderer(
        canvas,
        SAIL_IMAGE,
        {
          onComplete() {
            if (request !== requestRef.current) return;
            rendererRef.current?.dispose();
            rendererRef.current = null;
            setCanvasVisible(false);
            setCanvasVersion((version) => version + 1);
            setWind('idle');
            setStatus('The gust has passed. The sail is at rest.');
          },
          onUnavailable() {
            if (request !== requestRef.current) return;
            rendererRef.current?.dispose();
            rendererRef.current = null;
            setCanvasVisible(false);
            setCanvasVersion((version) => version + 1);
            setWind('unavailable');
            setStatus('The still sail is available. Motion is unavailable in this browser.');
          },
        },
        load.signal,
      );

      if (
        request !== requestRef.current ||
        prefersReducedMotion() ||
        document.hidden ||
        !visibilityRef.current
      ) {
        renderer.dispose();
        return;
      }

      rendererRef.current = renderer;
      setCanvasVisible(true);
      setWind('playing');
      setStatus('A gentle gust fills the sail. It will settle automatically.');
      renderer.start();
    } catch {
      if (request !== requestRef.current) return;
      setCanvasVisible(false);
      setWind('unavailable');
      setStatus('The still sail is available. Motion is unavailable in this browser.');
    }
  }

  const buttonLabel = {
    idle: 'Catch the wind',
    loading: 'Preparing the wind',
    playing: 'Let it settle',
    settling: 'Settling',
    unavailable: 'Still study',
  }[wind];

  return (
    <figure className="sail-study" aria-label="An illustrative study in sailcloth and wind">
      <div ref={stageRef} className="sail-study-stage" data-animated={canvasVisible}>
        <Image
          src={SAIL_IMAGE}
          alt="An ivory mainsail with translucent woven cloth, stitched panels, and a small blue telltale."
          width={1350}
          height={1165}
          preload
          sizes="(max-width: 760px) 100vw, 56vw"
          className="sail-study-image"
        />
        <canvas
          key={canvasVersion}
          ref={canvasRef}
          className="sail-study-canvas"
          aria-hidden="true"
        />
      </div>
      <figcaption className="sail-study-caption">
        <button
          type="button"
          className="sail-wind-button"
          onClick={catchWind}
          disabled={
            reducedMotion ||
            !inView ||
            wind === 'loading' ||
            wind === 'settling' ||
            wind === 'unavailable'
          }
          aria-describedby="sail-study-description"
        >
          <span className="sail-wind-dot" aria-hidden="true" />
          {reducedMotion ? 'A moment of stillness' : buttonLabel}
          {!reducedMotion && wind !== 'unavailable' && <span aria-hidden="true">↗</span>}
        </button>
        <p id="sail-study-description">A study in tension, light, and motion.</p>
        <noscript>
          <p>The sail rests here. Enable JavaScript to catch the wind.</p>
        </noscript>
      </figcaption>
      <span className="sail-status" role="status">
        {status}
      </span>
    </figure>
  );
}
