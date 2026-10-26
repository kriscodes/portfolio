'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/rajdhani/latin-500.css';
import './studio-not-found.css';

const storageKey = 'kristian-corner-studio:v1';
type Theme = 'day' | 'night';

function readTheme(): Theme {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || 'null')?.modelContent?.theme === 'day'
      ? 'day'
      : 'night';
  } catch {
    return 'night';
  }
}

function saveTheme(theme: Theme) {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || 'null');
    const snapshot = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    const model = 'modelContent' in snapshot && snapshot.modelContent;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...snapshot,
        modelContent: {
          ...(model && typeof model === 'object' && !Array.isArray(model) ? model : {}),
          theme,
        },
      }),
    );
  } catch {
    // Theme controls remain usable when browser storage is unavailable.
  }
}

function EndOfStreet() {
  return (
    <div className="lost-street">
      <svg className="lost-street-art" viewBox="0 0 660 570" fill="none" aria-hidden="true">
        <defs>
          <pattern id="lost-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M36 0H0V36" className="lost-grid-line" />
          </pattern>
          <linearGradient
            id="lost-road-light"
            x1="315"
            y1="235"
            x2="320"
            y2="570"
            gradientUnits="userSpaceOnUse"
          >
            <stop className="lost-reflection-start" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M26 204 337 28l297 171-311 180L26 204Z" fill="url(#lost-grid)" />
        <path className="lost-building" d="m52 205 128-74v156L52 362V205Z" />
        <path className="lost-building-top" d="m52 205 128-74 114 66-129 74-113-66Z" />
        <path className="lost-building-edge" d="m180 131 114 66v156l-129 75V271" />
        <path
          className="lost-building-window"
          d="m72 231 27-16v61l-27 16v-61Zm43-25 27-15v61l-27 16v-62Z"
        />
        <path className="lost-road" d="m26 389 269-156 343 198-266 155L26 389Z" />
        <path className="lost-road-edge" d="m26 389 269-156 343 198M26 405l346 199 266-155" />
        <path className="lost-road-lane" d="m138 389 156-91 235 136" />
        <path className="lost-road-reflection" d="m268 319 75-44 220 127-76 44-219-127Z" />
        <path
          className="lost-crosswalk"
          d="m340 431 50-29m-36 37 50-29m-36 37 50-29m-36 37 50-29m-36 37 50-29"
        />
        <path className="lost-billboard-pole" d="M443 247v133m0-133 10-6v133l-10 6" />
        <path className="lost-billboard-side" d="m285 69 10-7 291 84v167l-11 8V154L285 69Z" />
        <path className="lost-billboard" d="m285 69 290 85v167l-290-85V69Z" />
        <path className="lost-billboard-inner" d="m298 87 264 77v139l-264-77V87Z" />
        <g transform="matrix(1 .293 0 1 310 94)">
          <text className="lost-billboard-label" x="0" y="-4">
            CORNER STUDIO / ROUTE STATUS
          </text>
          <text className="lost-four-oh-four" x="-4" y="112">
            404
          </text>
          <path className="lost-billboard-divider" d="M0 122h238" />
          <text className="lost-billboard-label" x="0" y="139">
            NO THROUGH ROAD
          </text>
          <circle className="lost-billboard-status" cx="230" cy="135" r="3" />
        </g>
        <path className="lost-sign-post" d="M207 277v186m-8-1 8 5 11-6" />
        <path className="lost-bollard" d="M517 398v27m-7 0h14M561 423v27m-7 0h14" />
        <path className="lost-bollard-light" d="M517 398v6m44 19v6" />
        <path className="lost-corner-mark" d="M27 92V62h30m542 420h30v-30" />
        <circle className="lost-map-point" cx="71" cy="485" r="4" />
        <text className="lost-map-label" x="84" y="489">
          YOU ARE STILL IN THE NEIGHBORHOOD.
        </text>
      </svg>
      <nav className="lost-street-signs" aria-label="Other directions">
        <Link className="lost-sign lost-sign-work" href="/work/">
          <span>
            Work <small>AVE</small>
          </span>
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link className="lost-sign lost-sign-about" href="/about/">
          <ArrowLeft aria-hidden="true" />
          <span>
            About <small>WAY</small>
          </span>
        </Link>
        <Link className="lost-sign lost-sign-contact" href="/contact/">
          <span>
            Contact <small>ST</small>
          </span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </nav>
    </div>
  );
}

export default function StudioNotFound() {
  const [theme, setTheme] = useState<Theme>('night');

  useEffect(() => {
    setTheme(readTheme());
    function syncTheme(event: StorageEvent) {
      if (event.key === storageKey) setTheme(readTheme());
    }
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  function toggleTheme() {
    const next = theme === 'night' ? 'day' : 'night';
    setTheme(next);
    saveTheme(next);
  }

  return (
    <main id="main" className="studio-lost" data-mode={theme}>
      <header className="lost-header">
        <Link className="lost-brand" href="/" aria-label="Kristian Salmeron — studio home">
          <span>KRISTIAN</span>
          <strong>SALMERON</strong>
          <i aria-hidden="true" />
        </Link>
        <button
          className="lost-theme"
          type="button"
          onClick={toggleTheme}
          role="switch"
          aria-checked={theme === 'night'}
          aria-label="After Hours dark theme"
        >
          {theme === 'night' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
          <span>{theme === 'night' ? 'After Hours' : 'Open Desk'}</span>
          <span className="lost-switch" aria-hidden="true">
            <i />
          </span>
        </button>
      </header>
      <section className="lost-main" aria-labelledby="lost-title">
        <div className="lost-copy">
          <p className="lost-eyebrow">
            <span aria-hidden="true" />
            404 / ROUTE NOT FOUND
          </p>
          <h1 id="lost-title">
            This street
            <br />
            ends <em>here.</em>
          </h1>
          <p className="lost-description">
            The address may have changed, or this route never existed. The studio is still just
            around the corner.
          </p>
          <Link className="lost-home" href="/">
            <ArrowLeft aria-hidden="true" />
            Back to the studio
          </Link>
        </div>
        <EndOfStreet />
      </section>
      <footer className="lost-footer">
        <span>KRISTIAN SALMERON / CORNER STUDIO</span>
        <span>
          THERE’S MORE AROUND THE CORNER <ArrowRight aria-hidden="true" />
        </span>
      </footer>
    </main>
  );
}
