'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, ArrowLeftRight } from 'lucide-react';
import { paintKristianVoyageMap } from './scene/painters';

export default function FlatVoyage({ theme }: { theme: 'day' | 'night' }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const motion = useRef({ progress: 0.12, direction: 1 });
  const [playing, setPlaying] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPlaying(!preference.matches);
    const change = () => {
      if (preference.matches) setPlaying(false);
    };
    preference.addEventListener('change', change);
    return () => preference.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    let frame = 0;
    let previous = 0;
    let visible = true;
    let lastPaint = 0;
    let compact = element.clientWidth < 500;
    const draw = () =>
      paintKristianVoyageMap(context, element.width, element.height, {
        theme: theme === 'night' ? 1 : 0,
        progress: motion.current.progress,
        direction: motion.current.direction,
        controlsHeight: 60,
        compact,
        typeScale: compact ? 1.6 : 1,
      });
    const tick = (now: number) => {
      if (!playing || !visible || document.hidden) {
        previous = 0;
        return;
      }
      if (previous) {
        motion.current.progress +=
          (Math.min((now - previous) / 1000, 0.1) / 26) * motion.current.direction;
        if (motion.current.progress >= 1) {
          motion.current.progress = 1;
          motion.current.direction = -1;
        }
        if (motion.current.progress <= 0) {
          motion.current.progress = 0;
          motion.current.direction = 1;
        }
      }
      previous = now;
      if (now - lastPaint > 1000 / 30) {
        draw();
        lastPaint = now;
      }
      frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      draw();
      if (playing && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    observer.observe(element);
    const resize = new ResizeObserver(() => {
      compact = element.clientWidth < 500;
      draw();
    });
    resize.observe(element);
    document.addEventListener('visibilitychange', resume);
    resume();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener('visibilitychange', resume);
    };
  }, [theme, playing, revision]);

  return (
    <div className="sf-voyage">
      <div className="sf-window-bar">
        <span className="sf-window-lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>LIFE / THE CROSSING</span>
        <span>33.96° N · 118.46° W</span>
      </div>
      <canvas
        ref={canvas}
        width={1000}
        height={622}
        role="img"
        aria-label="Animated map of a sailboat travelling between Marina del Rey in Los Angeles and Avalon on Santa Catalina Island."
      />
      <div className="sf-voyage-controls">
        <span>
          <i className={playing ? 'sf-status-dot' : 'sf-status-dot paused'} aria-hidden="true" />
          {playing ? 'Under way' : 'At ease'}
        </span>
        <div>
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? 'Pause the voyage' : 'Play the voyage'}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Sail'}
          </button>
          <button
            type="button"
            onClick={() => {
              motion.current.direction *= -1;
              setRevision(revision + 1);
            }}
          >
            <ArrowLeftRight size={14} /> Reverse
          </button>
        </div>
      </div>
    </div>
  );
}
