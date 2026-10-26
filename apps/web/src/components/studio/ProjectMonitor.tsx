export default function ProjectMonitor() {
  return (
    <>
      <section
        className="kd-monitor-ui"
        id="kd-project-monitor"
        aria-label="Projects on the studio monitor"
        hidden
        inert
      >
        <header className="kd-monitor-header">
          <nav className="kd-monitor-tabs" role="tablist" aria-label="Portfolio collections">
            <button
              type="button"
              className="cursor-interaction"
              role="tab"
              id="kd-monitor-tab-work"
              data-collection="work"
              aria-selected="true"
              aria-controls="kd-monitor-panel"
            >
              Work
            </button>
            <button
              type="button"
              className="cursor-interaction"
              role="tab"
              id="kd-monitor-tab-experiments"
              data-collection="experiments"
              aria-selected="false"
              aria-controls="kd-monitor-panel"
            >
              Experiments
            </button>
          </nav>
          <button
            type="button"
            className="kd-monitor-back cursor-interaction"
            data-project-action="index"
            aria-label="Back to Work"
            hidden
          >
            ← Back
          </button>
        </header>
        <div
          className="kd-monitor-panel"
          id="kd-monitor-panel"
          role="tabpanel"
          aria-labelledby="kd-monitor-tab-work"
        >
          <div className="kd-project-index">
            <div className="kd-library-stage">
              <button
                type="button"
                className="kd-library-card cursor-interaction"
                data-project="careiq"
                aria-label="Open CareIQ product preview"
              >
                <canvas
                  width="1112"
                  height="400"
                  data-project-preview="careiq"
                  aria-hidden="true"
                ></canvas>
                <span className="kd-library-meta">
                  <strong>CareIQ</strong>
                  <span className="kd-library-action">Open preview →</span>
                </span>
              </button>
              <button
                type="button"
                className="kd-library-card cursor-interaction"
                data-project="neon-drift"
                aria-label="Open Neon Drift creative experiment"
                hidden
              >
                <canvas
                  width="1112"
                  height="400"
                  data-project-preview="neon-drift"
                  aria-hidden="true"
                ></canvas>
                <span className="kd-library-meta">
                  <strong>Neon Drift</strong>
                  <span className="kd-library-action">Launch →</span>
                </span>
              </button>
            </div>
          </div>
          <div className="kd-project-runtime" hidden>
            <div className="kd-runtime-viewport">
              <div className="kd-runtime-scale">
                <div
                  className="kd-runtime-host"
                  data-runtime="careiq"
                  aria-label="CareIQ interactive sample-data preview"
                  hidden
                  inert
                ></div>
                <div
                  className="kd-runtime-host"
                  data-runtime="neon-drift"
                  aria-label="Neon Drift interactive light-trail experiment"
                  hidden
                  inert
                ></div>
              </div>
            </div>
          </div>
        </div>
        <footer className="kd-monitor-footer">
          <span className="kd-monitor-context">1 project</span>
          <span className="kd-monitor-status">Opens on this screen</span>
        </footer>
        <span className="kd-project-announcement kd-sr" aria-live="polite"></span>
      </section>
    </>
  );
}
