import React from 'react';

/**
 * Reusable Full Page Loader & Spinner Component
 *
 * Props:
 * - loading: boolean (default true) - controls visibility
 * - text: string - primary message (e.g. "Loading hospital records...", "Submitting...")
 * - subtext: string - optional secondary message (e.g. "Please wait a moment...")
 * - fullPage: boolean (default true) - true for full screen fixed overlay, false for in-container
 * - transparent: boolean (default false) - true for backdrop without card background
 * - size: number (default 52) - diameter of the SVG spinner in pixels
 * - className: string - extra container classes
 * - style: object - style overrides
 */
export default function PageLoader({
  loading = true,
  text = 'Loading, please wait...',
  subtext = '',
  fullPage = true,
  transparent = false,
  size = 52,
  className = '',
  style = {},
}) {
  if (!loading) return null;

  const content = (
    <div
      className={`page-loader-card ${transparent ? 'is-transparent' : ''}`}
      style={style}
    >
      {!transparent && <div className="page-loader-bar" />}
      <div
        className="page-loader-spinner-wrap"
        style={{ width: size, height: size }}
      >
        <svg
          className="page-loader-spinner-svg"
          viewBox="0 0 50 50"
          width={size}
          height={size}
          aria-hidden="true"
        >
          <circle
            className="page-loader-spinner-track"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
          />
          <circle
            className="page-loader-spinner-arc"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <div className="page-loader-pulse-dot" />
      </div>

      <div className="page-loader-content">
        {text && <div className="page-loader-title">{text}</div>}
        {subtext && <div className="page-loader-subtext">{subtext}</div>}
      </div>
    </div>
  );

  if (!fullPage) {
    return (
      <div
        className={`page-loader-inline ${className}`.trim()}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`page-loader-overlay ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={text || 'Loading'}
    >
      {content}
    </div>
  );
}

export { PageLoader, PageLoader as Loader, PageLoader as Spinner };
