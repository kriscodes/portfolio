import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Privacy — First-party analytics',
  'What Studio Insights measures across Portfolio, Lab, and Toolbox, and how to opt out.',
  '/privacy/',
);

export default function PrivacyPage() {
  return (
    <main id="main" className="ip-main">
      <section aria-labelledby="privacy-title">
        <div className="ip-about-hero">
          <div>
            <p className="ip-eyebrow">Studio Insights</p>
            <h1 id="privacy-title">
              A smaller
              <br />
              <span className="ip-accent">data footprint.</span>
            </h1>
          </div>
          <div className="ip-about-intro">
            <p>
              First-party analytics help me understand which work is useful, with limited data and a
              clear way to opt out.
            </p>
          </div>
        </div>
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">What is measured</h2>
          <div className="ip-prose">
            <h3>Activity, in aggregate.</h3>
            <p>
              Portfolio, Lab, and Toolbox can send approved page routes, coarse device categories,
              recognized referral sources and campaign labels, and a small set of project,
              experiment, tool, and link actions to analytics.kristiansalmeron.com. Email and social
              links are recorded only as click categories, never their addresses or a completed
              contact.
            </p>
            <p>
              Active time estimates periods when a page is visible and there has been activity
              within 60 seconds. Scroll measurement records only 25%, 50%, 75%, and 100% milestones.
              Only scrollable pages are measured after a scroll; short pages are not assigned
              milestones. No continuous scroll positions are stored.
            </p>
            <p>
              The collector never reads tool inputs, prompts, form values, generated output, names,
              or email addresses. It does not collect query strings or URL fragments, precise
              locations, recordings, fingerprints, or activity on unrelated websites. Only approved
              route and campaign labels are sent.
            </p>
          </div>
        </section>
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">Visits &amp; storage</h2>
          <div className="ip-prose">
            <h3>Short-lived identifiers.</h3>
            <p>
              Random first-party identifiers can be shared only across participating
              kristiansalmeron.com subdomains using secure cookies. The visitor identifier rotates
              daily at midnight Pacific time. Visits expire after 30 minutes of inactivity and also
              rotate at midnight; there is no returning-person metric. When shared cookies are
              blocked, measurement falls back to site-local storage and cannot reliably connect
              visits between sites.
            </p>
            <p>
              Identifiers are hashed before database storage. Page identifiers connect observed
              navigation into aggregate paths. Last observed pages are estimated exits after
              inactivity; they do not prove a browser was closed. Counts can be affected by multiple
              tabs, blocked requests, browser suspension, or missing referrers.
            </p>
            <p>
              Pending events may remain in this browser for up to 24 hours, limited to 100 events,
              so delivery can retry without counting the same event twice. Raw events remain in the
              application database on Render for 180 days. Hosting backups follow a separate
              retention policy. Hosting infrastructure processes request metadata to serve and
              protect the sites.
            </p>
            <p>
              Reports require the owner login. New timing, scroll, paths, and cross-site
              measurements begin only after the updated collector is installed; old visits are not
              reconstructed.
            </p>
          </div>
        </section>
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">Your choice</h2>
          <div className="ip-prose">
            <h3>Exclude this browser.</h3>
            <p>
              Global Privacy Control and Do Not Track are respected when the browser provides them.
              The links below set a browser preference and show a confirmation. An exclusion clears
              local identifiers and queued events when each participating site next runs. The owner
              login also excludes collection when its separate host-only session cookie reaches the
              collector.
            </p>
            <p>
              <a className="ip-text-link" href="https://kristiansalmeron.com/?analytics_opt_out=1">
                Exclude my visits ↗
              </a>
            </p>
            <p>
              <a className="ip-text-link" href="https://kristiansalmeron.com/?analytics_opt_out=0">
                Allow measurement again ↗
              </a>
            </p>
            <p>
              If cookies are blocked, set the choice separately on{' '}
              <a href="https://lab.kristiansalmeron.com/?analytics_opt_out=1">Lab</a> and{' '}
              <a href="https://toolbox.kristiansalmeron.com/?analytics_opt_out=1">Toolbox</a>. A
              blocked collector cannot save the preference, so check for confirmation. Choices do
              not carry to other browsers, devices, or in-app browsers; clearing browser storage can
              reset them. Browser privacy signals continue to override re-enabling.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
