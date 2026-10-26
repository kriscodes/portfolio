'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { mountProjectPreview, type ProjectPreview, type ProjectPreviewId } from './projects';

export default function PreviewDialog({
  project,
  onClose,
}: {
  project: ProjectPreviewId;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);
  const title = project === 'careiq' ? 'CareIQ' : 'Neon Drift';

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    element?.showModal();
    document.body.classList.add('studio-preview-open');
    return () => {
      document.body.classList.remove('studio-preview-open');
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    let preview: ProjectPreview | undefined;
    setStatus('loading');
    mountProjectPreview(project, element)
      .then((mounted) => {
        if (cancelled) {
          mounted.dispose();
          return;
        }
        preview = mounted;
        mounted.setActive?.(!document.hidden);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('failed');
      });
    const visibility = () => preview?.setActive?.(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', visibility);
      preview?.setActive?.(false);
      queueMicrotask(() => preview?.dispose());
    };
  }, [project, attempt]);

  return (
    <dialog
      className="sf-preview-dialog"
      ref={dialog}
      aria-labelledby="sf-preview-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <header className="sf-preview-toolbar">
        <button type="button" onClick={onClose} autoFocus>
          <ArrowLeft size={16} /> Back to the studio
        </button>
        <h2 id="sf-preview-title">
          {title}{' '}
          <span>
            {project === 'careiq' ? 'Interactive demo · Sample data' : 'Creative experiment'}
          </span>
        </h2>
        {project === 'careiq' && (
          <a href="/work/care-iq/">
            Case study <ExternalLink size={14} />
          </a>
        )}
      </header>
      {status === 'loading' && (
        <p className="sf-preview-state" role="status">
          Opening {title}…
        </p>
      )}
      {status === 'failed' && (
        <div className="sf-preview-state" role="status">
          <p>The preview couldn’t load. Give it another try.</p>
          <button type="button" onClick={() => setAttempt(attempt + 1)}>
            Reload preview
          </button>
        </div>
      )}
      <div className="sf-preview-host" ref={host} hidden={status === 'failed'} />
    </dialog>
  );
}
