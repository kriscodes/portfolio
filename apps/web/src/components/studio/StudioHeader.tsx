import { Moon, Sun } from 'lucide-react';
export default function StudioHeader() {
  return (
    <>
      <header className="kd-header">
        <button
          type="button"
          className="kd-brand cursor-interaction"
          data-logo="streetplate"
          aria-label="Kristian Salmeron — return to the overview"
        >
          <span className="kd-nameplate" aria-hidden="true">
            <span className="kd-first">KRISTIAN</span>
            <strong className="kd-last">SALMERON</strong>
            <i className="kd-bolt"></i>
          </span>
        </button>
        <nav className="kd-camera-nav" aria-label="Camera destinations">
          <button type="button" className="kd-return cursor-interaction" aria-current="page">
            Overview
          </button>
          <div className="kd-camera-destinations">
            <button type="button" className="cursor-interaction" data-camera="work">
              Work
            </button>
            <button type="button" className="cursor-interaction" data-camera="life">
              Life
            </button>
            <button type="button" className="cursor-interaction" data-camera="about">
              About
            </button>
          </div>
        </nav>
        <button
          type="button"
          className="kd-theme cursor-interaction"
          role="switch"
          aria-checked="true"
          aria-label="After Hours dark theme"
        >
          <span className="kd-theme-word kd-day-word">Open Desk</span>
          <span className="kd-toggle-track">
            <span className="kd-toggle-thumb">
              <Moon className="kd-thumb-moon" aria-hidden="true" />
              <Sun className="kd-thumb-sun" aria-hidden="true" />
            </span>
            <Sun aria-hidden="true" />
            <Moon aria-hidden="true" />
          </span>
          <span className="kd-theme-word kd-night-word">After Hours</span>
        </button>
      </header>
    </>
  );
}
