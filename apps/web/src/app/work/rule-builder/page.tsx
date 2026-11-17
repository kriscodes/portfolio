import Link from 'next/link';
import RuleBuilder from '@/components/rule-builder';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata(
  'Claims-auditing rule builder — Complex logic, usable UI',
  'Frontend architecture for a claims-auditing rule builder associated with roughly $35M in FY2026 savings. Explore a separate synthetic example of nested logic, validation, and previews.',
  '/work/rule-builder/',
);

export default function RuleBuilderPage() {
  return (
    <main id="main" className="ip-main">
      <article aria-labelledby="rules-title">
        <header className="ip-case-hero">
          <Link className="ip-back" href="/work/">← Selected work</Link>
          <p className="ip-eyebrow">Claims-auditing rule builder / Highmark Health</p>
          <h1 id="rules-title">Complex logic.<br /><span className="ip-accent">Clear decisions.</span></h1>
          <p className="ip-deck">Give analysts a way to build, inspect, and preview complex rules without asking a developer to write every query.</p>
          <div className="ip-case-facts">
            <p><span>My contribution</span>Frontend architecture &amp; integration</p>
            <p><span>Core challenge</span>Nested logic, validation, preview &amp; scale</p>
            <p><span>Reported business outcome</span>Roughly $35M saved in FY2026</p>
          </div>
        </header>
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">The real project</h2>
          <div className="ip-prose"><h3>A difficult interaction, made usable.</h3>
            <p>I architected an interactive claims-auditing rule builder that let analysts express complex conditions across many data fields, nest them into logical groups, and preview rules against data. The application ran across millions of claims and was associated with roughly $35M in FY2026 savings.</p>
            <p>Finding an efficient direction for evaluating rules at scale took substantial investigation. The frontend had to help users understand what they were asking the system to do, while the team worked through the cost of executing it.</p>
            <p>The employer’s interface, data, rules, and internal implementation are confidential. The order-review demo below is a new, independent example of general approaches to these UI problems. Its design and execution model do not represent the internal application.</p>
          </div>
        </section>
        <RuleBuilder />
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">01 / Nested logic</h2>
          <div className="ip-prose"><h3>Make the grouping visible.</h3>
            <p>An AND inside an OR changes a rule’s meaning. This demonstration represents conditions and groups as a tree, with explicit ALL/ANY controls and a readable expression beside the editor.</p>
            <p>Drag handles move conditions or entire groups into another group. Equivalent move controls work with keyboard and touch. Moving a group into itself or a descendant is rejected, and nesting limits keep this example manageable.</p>
            <p>Reordering within a group preserves its meaning; moving between groups can change it. A preview is marked out of date after an edit so yesterday’s result cannot appear to validate today’s rule.</p>
          </div>
        </section>
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">02 / Validation</h2>
          <div className="ip-prose"><h3>Catch ambiguity at the point of entry.</h3>
            <p>Field types constrain the available comparisons and values. Empty groups and invalid amounts display actionable inline errors, and preview stays unavailable until the rule is valid.</p>
            <p>A production service would validate the same contract again, authorize the fields a user can access, and reject unsupported operations. A valid browser form alone is not a trusted execution plan.</p>
          </div>
        </section>
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">03 / Preview</h2>
          <div className="ip-prose"><h3>Connect the expression to examples.</h3>
            <p>The preview evaluates eight fictional orders and shows matches and non-matches next to their values. Change the total, switch a group from ALL to ANY, or move a condition to see how the result changes.</p>
            <p>For a production preview, I would use a bounded sample, record the rule revision, expose sample scope, and cancel obsolete requests. A sample count should never look like a full-dataset result.</p>
          </div>
        </section>
        <section className="ip-margin-section">
          <h2 className="ip-margin-label">04 / Performance</h2>
          <div className="ip-prose"><h3>Separate editing from expensive execution.</h3>
            <p>This browser example compiles a validated rule once per preview and short-circuits AND/OR groups. With eight rows, it demonstrates semantics; it does not demonstrate performance across millions of records.</p>
            <p>A generic approach to larger workloads is to keep editing local, run bounded previews on demand, and send full evaluations to an asynchronous service with cancellation, progress, and a rule-version identifier.</p>
            <p>Before choosing an execution strategy, measure representative rule shapes, nesting, selectivity, data volume, and query plans. Compare p50/p95 latency, resource use, and cancellation behavior. Indexing, pre-filtering, batching, and caching are candidates to test—not claims about this employer’s implementation.</p>
          </div>
        </section>
        <Link href="/work/gen-ui/" className="ip-next"><span>Next project</span><strong>Medical document viewer</strong><span aria-hidden="true">→</span></Link>
      </article>
    </main>
  );
}
