import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="ip-hero ip-not-found">
      <p className="ip-eyebrow">404 / A little off course</p>
      <h1>
        Let’s find
        <br />a <span className="ip-accent">way back.</span>
      </h1>
      <p className="ip-deck">This page isn’t here. There’s more to explore in the work.</p>
      <Link className="ip-text-link" href="/work/">
        Explore the work ↗
      </Link>
    </main>
  );
}
