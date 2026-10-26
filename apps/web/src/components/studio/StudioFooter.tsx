export default function StudioFooter() {
  return (
    <>
      <footer className="kd-footer">
        <div className="kd-footer-location">
          <span className="kd-location-label">Studio</span>
          <span className="kd-location-detail">Overview</span>
        </div>
        <span className="kd-footer-hint">Drag to look around · Work / Life / About</span>
        <div className="kd-footer-actions">
          <nav className="kd-sailing-actions" aria-label="Sailing display pages" hidden inert>
            <button type="button" className="cursor-interaction" data-life="boat">
              Sailboat
            </button>
            <button type="button" className="cursor-interaction" data-life="map">
              Catalina
            </button>
            <button type="button" className="cursor-interaction" data-life="outside">
              Outdoors
            </button>
          </nav>
          <div className="kd-life-back" hidden>
            <button type="button" className="cursor-interaction" data-life-back>
              ← Overview
            </button>
          </div>
          <span className="kd-footer-address">kristiansalmeron.com</span>
        </div>
        <span className="kd-mode-status kd-sr" aria-live="polite">
          After Hours
        </span>
        <span className="kd-camera-status kd-sr" aria-live="polite">
          Overview
        </span>
      </footer>
    </>
  );
}
