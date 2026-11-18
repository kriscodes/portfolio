'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createTelltalePath, sailTransform, sampleSailGust } from './sail-motion';
import { createSailRenderer, type SailRenderer } from './sail-renderer';
import './sail-study.css';

const SAIL_IMAGE = '/images/editorial-sail-cloth.webp';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const RESTING_GUST = sampleSailGust(0);
type WindState = 'idle' | 'playing' | 'settling';

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
  const [inView, setInView] = useState(true);
  const [status, setStatus] = useState('The sail is at rest.');
  const stageRef = useRef<HTMLDivElement>(null);
  const clothRef = useRef<SVGGElement>(null);
  const telltaleRef = useRef<SVGPathElement>(null);
  const rendererRef = useRef<SailRenderer | null>(null);
  const visibilityRef = useRef(true);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    prefersReducedMotion,
    serverMotionPreference,
  );

  useEffect(() => {
    const preference = window.matchMedia(REDUCED_MOTION_QUERY);
    const stage = stageRef.current;

    function restoreStill() {
      rendererRef.current?.dispose();
      rendererRef.current = null;
      setWind('idle');
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
      rendererRef.current?.dispose();
      rendererRef.current = null;
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      preference.removeEventListener('change', onMotionPreferenceChange);
    };
  }, []);

  function catchWind() {
    if (!visibilityRef.current || document.hidden || prefersReducedMotion()) return;
    if (wind === 'settling') return;
    if (rendererRef.current) {
      rendererRef.current.settle();
      setWind('settling');
      setStatus('The wind is easing. The telltale is settling.');
      return;
    }

    const cloth = clothRef.current;
    const telltale = telltaleRef.current;
    if (!cloth || !telltale) return;

    rendererRef.current = createSailRenderer(cloth, telltale, () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
      setWind('idle');
      setStatus('The gust has passed. The sail is at rest.');
    });
    setWind('playing');
    setStatus('The telltale streams in a gentle gust. It will settle automatically.');
    rendererRef.current.start();
  }

  const buttonLabel = {
    idle: 'Catch the wind',
    playing: 'Let it settle',
    settling: 'Settling',
  }[wind];

  return (
    <figure className="sail-study" aria-label="An illustrative study in sailcloth and wind">
      <div ref={stageRef} className="sail-study-stage">
        <svg
          className="sail-study-art"
          viewBox="0 0 1350 1165"
          width="1350"
          height="1165"
          role="img"
          aria-label="An ivory mainsail with translucent woven cloth, stitched panels, and a small blue telltale."
        >
          <g ref={clothRef} transform={sailTransform(RESTING_GUST)}>
            <image href={SAIL_IMAGE} width="1350" height="1165" />
            <g transform="translate(1128 540)">
              <path
                ref={telltaleRef}
                className="sail-telltale"
                d={createTelltalePath(RESTING_GUST, 0)}
              />
            </g>
          </g>
        </svg>
      </div>
      <figcaption className="sail-study-caption">
        <button
          type="button"
          className="sail-wind-button"
          onClick={catchWind}
          disabled={reducedMotion || !inView || wind === 'settling'}
          aria-describedby="sail-study-description"
        >
          <span className="sail-wind-dot" aria-hidden="true" />
          {reducedMotion ? 'A moment of stillness' : buttonLabel}
          {!reducedMotion && <span aria-hidden="true">→</span>}
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
