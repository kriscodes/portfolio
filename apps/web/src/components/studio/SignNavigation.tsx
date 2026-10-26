export default function SignNavigation() {
  return (
    <>
      <nav className="kd-scene-navigation" aria-label="Studio destination signs">
        <button
          type="button"
          className="kd-sign-hit cursor-interaction"
          data-section="work"
          aria-label="Work — studio projects"
          aria-expanded="false"
        >
          <span>Work</span>
        </button>
        <button
          type="button"
          className="kd-sign-hit cursor-interaction"
          data-section="life"
          aria-label="Life — the sailing display"
          aria-expanded="false"
        >
          <span>Life</span>
        </button>
        <button
          type="button"
          className="kd-sign-hit cursor-interaction"
          data-section="about"
          aria-label="About — background and experience"
          aria-expanded="false"
        >
          <span>About</span>
        </button>
      </nav>
    </>
  );
}
