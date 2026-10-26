export default function LifeControls() {
  return (
    <>
      <nav className="kd-life-navigation" aria-label="Explore the sailing display" hidden>
        <button
          type="button"
          className="kd-life-hit cursor-interaction"
          data-life="boat"
          aria-label="Explore the sailboat display"
        >
          <span>Sailboat and water</span>
        </button>
        <button
          type="button"
          className="kd-life-hit cursor-interaction"
          data-life="map"
          aria-label="Open the Catalina navigation screen"
        >
          <span>The Catalina crossing</span>
        </button>
        <button
          type="button"
          className="kd-life-hit cursor-interaction"
          data-life="outside"
          aria-label="Open the outdoors screen"
        >
          <span>Outside is my reset</span>
        </button>
      </nav>
      <div className="kd-life-map-controls" aria-label="Catalina voyage controls" hidden inert>
        <button
          type="button"
          className="cursor-interaction"
          data-voyage="play"
          aria-label="Pause the Catalina voyage"
        >
          Pause
        </button>
        <span className="kd-voyage-status" aria-live="polite">
          To Catalina
        </span>
        <button type="button" className="cursor-interaction" data-voyage="reverse">
          Sail back
        </button>
      </div>
      <span className="kd-life-status kd-sr" aria-live="polite"></span>
    </>
  );
}
