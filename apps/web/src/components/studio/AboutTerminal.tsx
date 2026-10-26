export default function AboutTerminal() {
  return (
    <>
      <section className="kd-about-reader" aria-label="About terminal content" hidden inert>
        <header className="kd-about-screen-brand">ABOUT / KRISTIAN SALMERON</header>
        <nav className="kd-about-tabs" role="tablist" aria-label="About Kristian">
          <button
            type="button"
            className="cursor-interaction"
            role="tab"
            id="kd-about-tab-story"
            data-about-tab="story"
            aria-selected="true"
            aria-controls="kd-about-panel"
          >
            Background
          </button>
          <button
            type="button"
            className="cursor-interaction"
            role="tab"
            id="kd-about-tab-experience"
            data-about-tab="experience"
            aria-selected="false"
            aria-controls="kd-about-panel"
          >
            Experience
          </button>
          <button
            type="button"
            className="cursor-interaction"
            role="tab"
            id="kd-about-tab-approach"
            data-about-tab="approach"
            aria-selected="false"
            aria-controls="kd-about-panel"
          >
            Approach
          </button>
        </nav>
        <div
          className="kd-about-leaf"
          id="kd-about-panel"
          role="tabpanel"
          aria-labelledby="kd-about-tab-story"
        >
          <div className="kd-about-page-copy">
            <div className="kd-about-prose">
              <p className="kd-about-eyebrow"></p>
              <h2 className="kd-about-title"></h2>
              <p className="kd-about-body"></p>
            </div>
            <div className="kd-about-proof">
              <strong></strong>
              <span></span>
            </div>
          </div>
          <footer className="kd-about-paging">
            <button
              type="button"
              className="cursor-interaction"
              data-about-page="previous"
              aria-label="Previous terminal page"
            >
              ← Previous
            </button>
            <span className="kd-about-page-count"></span>
            <button
              type="button"
              className="cursor-interaction"
              data-about-page="next"
              aria-label="Next terminal page"
            >
              Next →
            </button>
          </footer>
        </div>
      </section>
      <span className="kd-about-status kd-sr" aria-live="polite"></span>
    </>
  );
}
