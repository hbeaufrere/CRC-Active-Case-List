'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Tooltip = { top: number; left: number; text: string };

/**
 * Cell content that is visually truncated and reveals its full text on hover.
 *
 * The native `title` attribute is deliberately avoided here: the browser
 * snapshots a title tooltip when it opens and does not refresh it when React
 * later updates the attribute, so a row whose data changed (edit, re-sort,
 * re-fetch) could keep showing the previous text. This tooltip is rendered
 * from the current `text` prop, so it always matches what is on screen now.
 */
export default function TruncatedCell({
  text,
  placeholder = '—',
  className = '',
}: {
  text: string | null | undefined;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const value = (text || '').trim();
  // If the underlying text changed while the tooltip was open, the captured
  // tooltip is stale — drop it rather than render the previous text.
  const visible = tooltip && tooltip.text === value ? tooltip : null;

  const hide = useCallback(() => setTooltip(null), []);

  // Never leave a tooltip floating over content that moved or disappeared.
  useEffect(() => {
    if (!visible) return;
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [visible, hide]);

  function show() {
    const el = ref.current;
    if (!el || !value) return;
    // Only worth a tooltip when the text is actually clipped.
    if (el.scrollWidth <= el.clientWidth + 1) return;

    const rect = el.getBoundingClientRect();
    const maxWidth = 320;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - maxWidth - 8));
    setTooltip({ top: rect.bottom + 6, left, text: value });
  }

  return (
    <>
      <div
        ref={ref}
        className={`truncate ${className}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {value || placeholder}
      </div>
      {visible
        ? createPortal(
            <div
              role="tooltip"
              className="fixed z-50 max-w-[320px] whitespace-pre-wrap break-words rounded-md bg-slate-800 px-3 py-2 text-xs leading-relaxed text-white shadow-lg pointer-events-none"
              style={{ top: visible.top, left: visible.left }}
            >
              {visible.text}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
