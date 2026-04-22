import { useEffect } from 'react';

/**
 * Set di icone hairline neo-brutalist 24×24, strokeWidth=2.
 * Usage: <Icon name="home" size={18} />
 */
const PATHS = {
  home:      <path d="M3 11L12 3l9 8M5 10v11h4v-6h6v6h4V10" />,
  users:     <><circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="3"/><path d="M15 21c0-2 1.5-4 4-4"/></>,
  team:      <><circle cx="8" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M2 20c0-3 2.5-5 6-5s6 2 6 5M13 19c.5-2.5 2.5-4 5-4s4 1.5 4.5 4"/></>,
  cal:       <><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 9h18M8 3v4M16 3v4"/></>,
  doc:       <><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/></>,
  user:      <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>,
  plus:      <path d="M12 5v14M5 12h14" />,
  check:     <path d="M4 12l5 5L20 6"/>,
  x:         <path d="M6 6l12 12M6 18L18 6"/>,
  arrowR:    <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
  chevR:     <path d="M9 6l6 6-6 6"/>,
  chevL:     <path d="M15 6l-6 6 6 6"/>,
  chevDown:  <path d="M6 9l6 6 6-6"/>,
  download:  <><path d="M12 4v12"/><path d="M6 12l6 6 6-6"/><path d="M4 20h16"/></>,
  upload:    <><path d="M12 20V8"/><path d="M6 12l6-6 6 6"/><path d="M4 4h16"/></>,
  bell:      <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8z"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  search:    <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
  clock:     <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  paperclip: <path d="M21 10l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/>,
  report:    <><path d="M4 20V4h13l3 3v13z"/><path d="M8 13v4M12 10v7M16 7v10"/></>,
  warning:   <><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></>,
  sparkle:   <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>,
  logout:    <><path d="M10 17l5-5-5-5"/><path d="M15 12H4"/><path d="M20 4v16"/></>,
  history:   <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v5l3 2"/></>,
};

export default function Icon({ name, size = 18, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      {PATHS[name] || null}
    </svg>
  );
}
