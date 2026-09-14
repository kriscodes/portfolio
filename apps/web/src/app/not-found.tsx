import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="page-intro not-found">
      <span className="eyebrow">404 / OFF THE MARKED TRAIL</span>
      <h1>
        A little
        <br />
        <em>off course.</em>
      </h1>
      <p>This page isn’t on the map. Let’s get you back to familiar ground.</p>
      <Link className="button primary" href="/">
        Back to base camp ↗
      </Link>
    </main>
  );
}
