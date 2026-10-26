'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { KRISTIAN_ABOUT } from './data';
import { readStudioState, saveStudioState } from './state';
import type { ProjectPreviewId } from './projects';
import StudioIllustration from './StudioIllustration';
import FlatVoyage from './FlatVoyage';
import PreviewDialog from './PreviewDialog';
import './fallback.css';

type AboutKey = 'story' | 'experience' | 'approach';

export default function StudioFallback({
  theme,
  onThemeChange,
  onTry3D,
  reason,
}: {
  theme: 'day' | 'night';
  onThemeChange: (theme: 'day' | 'night') => void;
  onTry3D: () => void;
  reason: 'graphics' | 'chosen';
}) {
  const [project, setProject] = useState<ProjectPreviewId | null>(null);
  const [about, setAbout] = useState<AboutKey>('story');
  const [pages, setPages] = useState<Record<string, number>>({
    story: 0,
    experience: 0,
    approach: 0,
  });
  const currentSection = KRISTIAN_ABOUT[about];
  const pageIndex = pages[about] || 0;
  const currentPage = currentSection.pages[pageIndex];

  useEffect(() => {
    const restore = (scroll: boolean) => {
      const model = readStudioState().modelContent;
      setProject(model.project && model.section === 'work' ? model.project : null);
      setAbout(model.aboutView);
      setPages(model.aboutPages);
      if (scroll && model.section)
        document.getElementById(model.section)?.scrollIntoView({ block: 'start' });
    };
    restore(true);
    const changed = () => restore(true);
    window.addEventListener('popstate', changed);
    window.addEventListener('hashchange', changed);
    return () => {
      window.removeEventListener('popstate', changed);
      window.removeEventListener('hashchange', changed);
    };
  }, []);

  const openProject = (id: ProjectPreviewId) => {
    setProject(id);
    const snapshot = readStudioState();
    Object.assign(snapshot.modelContent, {
      section: 'work',
      project: id,
      collection: id === 'neon-drift' ? 'experiments' : 'work',
    });
    saveStudioState(snapshot);
  };
  const closeProject = useCallback(() => {
    setProject(null);
    const snapshot = readStudioState();
    snapshot.modelContent.project = null;
    saveStudioState(snapshot);
  }, []);
  const chooseAbout = (key: AboutKey, page = pages[key] || 0) => {
    setAbout(key);
    setPages((previous) => ({ ...previous, [key]: page }));
    const snapshot = readStudioState();
    snapshot.modelContent.section = 'about';
    snapshot.modelContent.aboutView = key;
    snapshot.modelContent.aboutPages[key] = page;
    saveStudioState(snapshot);
  };

  return (
    <div className="studio-flat" data-mode={theme} id="studio-top">
      <header className="sf-header">
        <a href="#studio-top" className="sf-brand" aria-label="Kristian Salmeron — studio overview">
          <span>KRISTIAN</span>
          <strong>SALMERON</strong>
          <ArrowUpRight size={14} />
        </a>
        <nav aria-label="Studio destinations">
          <a href="#work">Work</a>
          <a href="#life">Life</a>
          <a href="#about">About</a>
        </nav>
        <button
          type="button"
          className="sf-theme"
          onClick={() => onThemeChange(theme === 'night' ? 'day' : 'night')}
          aria-label={
            theme === 'night'
              ? 'Switch to Open Desk light theme'
              : 'Switch to After Hours dark theme'
          }
        >
          {theme === 'night' ? <Moon size={15} /> : <Sun size={15} />}
          <span>{theme === 'night' ? 'After Hours' : 'Open Desk'}</span>
        </button>
      </header>

      <div className="sf-view-note">
        <span>
          <i className="sf-status-dot" aria-hidden="true" />
          2D STUDIO
          <span className="sf-note-detail">
            {reason === 'graphics'
              ? 'The 3D view isn’t available here. The studio is still open.'
              : 'A different view of the same studio.'}
          </span>
        </span>
        <button type="button" onClick={onTry3D}>
          Try the 3D view <ArrowUpRight size={13} />
        </button>
      </div>

      <section className="sf-hero" aria-labelledby="sf-intro-title">
        <div className="sf-hero-copy">
          <p className="sf-eyebrow">SOFTWARE / ARCHITECTURE / LIFE</p>
          <h2 id="sf-intro-title">
            Complex systems.
            <br />
            <em>Clear experiences.</em>
          </h2>
          <p className="sf-intro">
            I build software, connect systems, and make room for a life beyond the screen.
          </p>
          <a className="sf-primary" href="#work">
            Explore the work <ArrowRight size={18} />
          </a>
          <a className="sf-hero-more" href="#about">
            Meet Kristian <ArrowDown size={14} />
          </a>
        </div>
        <div className="sf-hero-art">
          <StudioIllustration theme={theme} />
          <span className="sf-art-caption">
            <i aria-hidden="true" />
            CORNER STUDIO <span>Work Ave. / Life Ln. / About Way</span>
          </span>
        </div>
      </section>

      <section className="sf-section" id="work" aria-labelledby="sf-work-title">
        <div className="sf-section-heading">
          <div>
            <p className="sf-eyebrow">
              <span>01</span> WORK AVENUE
            </p>
            <h2 id="sf-work-title">From idea to useful.</h2>
          </div>
          <Link href="/work/" className="sf-text-link">
            All work <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="sf-project-grid">
          <article className="sf-project sf-careiq">
            <div className="sf-project-art sf-careiq-art" aria-hidden="true">
              <div className="sf-app-rail">
                <strong>✚</strong>
                <i />
                <i />
                <i />
              </div>
              <div className="sf-app-content">
                <span>YOUR FRONT DESK, IN FOCUS</span>
                <strong>A little more room to care.</strong>
                <div className="sf-mini-stats">
                  <i>
                    05 <small>appointments</small>
                  </i>
                  <i>
                    02 <small>documents ready</small>
                  </i>
                </div>
                <div className="sf-mini-patient">
                  <b>AM</b>
                  <span>
                    Alex Morgan<small>New patient consultation</small>
                  </span>
                  <em>Checked in</em>
                </div>
                <div className="sf-mini-patient">
                  <b>JL</b>
                  <span>
                    Jordan Lee<small>Follow-up visit</small>
                  </span>
                  <em>Scheduled</em>
                </div>
              </div>
            </div>
            <div className="sf-project-body">
              <p className="sf-card-meta">
                <span className="sf-status-dot" aria-hidden="true" />
                IN DEVELOPMENT · SAMPLE DATA
              </p>
              <h3>
                CareIQ <span>01</span>
              </h3>
              <p>
                A calmer front desk for independent practices. Intake, scheduling, and the details
                that keep care moving.
              </p>
              <div className="sf-tags">
                <span>TypeScript</span>
                <span>Next.js</span>
                <span>PostgreSQL</span>
              </div>
              <div className="sf-card-actions">
                <button type="button" className="sf-primary" onClick={() => openProject('careiq')}>
                  Explore the demo <ArrowUpRight size={16} />
                </button>
                <Link href="/work/care-iq/">
                  Read the case study <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </article>
          <article className="sf-project sf-genui">
            <div className="sf-project-art sf-genui-art" aria-hidden="true">
              <span className="sf-art-index">DOCUMENT DELIVERY / REIMAGINED</span>
              <div className="sf-pdf-sheet">
                <span>PDF</span>
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="sf-render-metric">
                <span>INITIAL RENDER</span>
                <strong>
                  <s>~15 min</s>
                  <ArrowRight size={28} />
                  <em>&lt;5 sec</em>
                </strong>
                <span>LESS WAITING. MORE DOING.</span>
              </div>
            </div>
            <div className="sf-project-body">
              <p className="sf-card-meta">HIGHMARK HEALTH · ENGINEERING CASE STUDY</p>
              <h3>
                NLP Gen UI <span>02</span>
              </h3>
              <p>
                Progressive PDF delivery that brought the initial wait from minutes to seconds for
                medical coding workflows.
              </p>
              <div className="sf-tags">
                <span>Architecture</span>
                <span>Progressive delivery</span>
                <span>Apryse</span>
              </div>
              <div className="sf-card-actions">
                <Link className="sf-primary" href="/work/gen-ui/">
                  Explore the case study <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </article>
        </div>
        <article className="sf-experiment">
          <div className="sf-drift-art" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div>
            <p className="sf-eyebrow">OFF THE CLOCK / EXPERIMENTS</p>
            <h3>Neon Drift</h3>
            <p>
              Light trails, shifting currents, and a little creative coding. Drag to draw. See where
              it goes.
            </p>
          </div>
          <button type="button" onClick={() => openProject('neon-drift')}>
            Enter the playground <ArrowUpRight size={18} />
          </button>
        </article>
      </section>

      <section className="sf-section sf-life" id="life" aria-labelledby="sf-life-title">
        <div className="sf-section-heading">
          <div>
            <p className="sf-eyebrow">
              <span>02</span> LIFE LANE
            </p>
            <h2 id="sf-life-title">Outside is my reset.</h2>
          </div>
          <span className="sf-section-aside">A little farther from the desk.</span>
        </div>
        <div className="sf-life-grid">
          <FlatVoyage theme={theme} />
          <div className="sf-outside">
            <div className="sf-photo">
              <img
                src="/images/instagram-redwoods.jpg"
                alt="A quiet road winding through towering redwoods, photographed by Kristian Salmeron."
                loading="lazy"
                width={512}
                height={640}
              />
              <span>
                LESS SIGNAL.
                <br />
                MORE PERSPECTIVE.
              </span>
            </div>
            <p>
              Salt air, open water, a trail that goes a little farther. I love the change of
              pace—and coming back with a fresh perspective.
            </p>
            <a
              className="sf-text-link"
              href="https://www.instagram.com/capt_kris"
              target="_blank"
              rel="noreferrer"
            >
              Through my lens <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </section>

      <section className="sf-section sf-about" id="about" aria-labelledby="sf-about-title">
        <div className="sf-section-heading">
          <div>
            <p className="sf-eyebrow">
              <span>03</span> ABOUT WAY
            </p>
            <h2 id="sf-about-title">The work behind the story.</h2>
          </div>
          <Link href="/about/" className="sf-text-link">
            More about me <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="sf-terminal">
          <div className="sf-window-bar">
            <span className="sf-window-lights" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>KRISTIAN SALMERON / BACKGROUND</span>
            <span className="sf-status-dot" aria-hidden="true" />
          </div>
          <div className="sf-about-tabs" role="tablist" aria-label="About Kristian">
            {(['story', 'experience', 'approach'] as AboutKey[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={'sf-tab-' + key}
                aria-controls="sf-about-panel"
                aria-selected={about === key}
                tabIndex={about === key ? 0 : -1}
                onClick={() => chooseAbout(key)}
                onKeyDown={(event) => {
                  const keys: AboutKey[] = ['story', 'experience', 'approach'];
                  const current = keys.indexOf(key);
                  const next =
                    event.key === 'ArrowRight'
                      ? (current + 1) % 3
                      : event.key === 'ArrowLeft'
                        ? (current + 2) % 3
                        : event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? 2
                            : -1;
                  if (next >= 0) {
                    event.preventDefault();
                    chooseAbout(keys[next]);
                    document.getElementById('sf-tab-' + keys[next])?.focus();
                  }
                }}
              >
                {KRISTIAN_ABOUT[key].title}
              </button>
            ))}
          </div>
          <div
            className="sf-about-panel"
            role="tabpanel"
            id="sf-about-panel"
            aria-labelledby={'sf-tab-' + about}
            tabIndex={0}
          >
            <div>
              <p className="sf-eyebrow">{currentPage.eyebrow}</p>
              <h3>{currentPage.title}</h3>
              <p>{currentPage.body}</p>
            </div>
            <div className="sf-proof">
              <strong>{currentPage.proof}</strong>
              <span>{currentPage.proofLabel}</span>
            </div>
          </div>
          <div className="sf-terminal-footer">
            <span>
              0{pageIndex + 1} <span>/ 0{currentSection.pages.length}</span>
            </span>
            <div>
              <button
                type="button"
                disabled={pageIndex === 0}
                onClick={() => chooseAbout(about, pageIndex - 1)}
                aria-label="Previous background page"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                type="button"
                disabled={pageIndex === currentSection.pages.length - 1}
                onClick={() => chooseAbout(about, pageIndex + 1)}
                aria-label="Next background page"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="sf-footer">
        <div>
          <p className="sf-eyebrow">GOOD CONVERSATIONS START SOMEWHERE.</p>
          <h2>
            Let’s build something
            <br />
            <em>worth exploring.</em>
          </h2>
          <Link className="sf-primary" href="/contact/">
            Get in touch <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="sf-footer-links">
          <Link href="/field-notes/">
            Notes <ArrowUpRight size={14} />
          </Link>
          <a href="https://github.com/kriscodes" target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight size={14} />
          </a>
          <a
            href="https://www.linkedin.com/in/kristian-salmeron-46295664"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn <ArrowUpRight size={14} />
          </a>
          <button type="button" onClick={onTry3D}>
            Try the 3D studio <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="sf-footer-bottom">
          <span>CORNER STUDIO / KRISTIAN SALMERON</span>
          <a href="#studio-top">Back to the corner ↑</a>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
      {project && <PreviewDialog key={project} project={project} onClose={closeProject} />}
    </div>
  );
}
