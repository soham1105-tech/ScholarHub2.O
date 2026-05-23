import React from 'react';

export const SVGIcon = ({ name, className = "w-6 h-6", strokeWidth = 1.5 }) => {
  const icons = {
    house: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />
    ),
    checkbox: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </>
    ),
    bell: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 01-3.46 0" />
      </>
    ),
    hamburger: (
      <>
        <path d="M3 12h18" strokeLinecap="round" />
        <path d="M3 6h18" strokeLinecap="round" />
        <path d="M3 18h18" strokeLinecap="round" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2 M12 20v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M2 12h2 M20 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42" strokeLinecap="round" />
      </>
    ),
    terminal: (
      <>
        <path d="M4 17l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 19h8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 7l-10 7L2 7" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </>
    ),
    'alert-triangle': (
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
    ),
    headphones: (
      <>
        <path d="M3 18v-6a9 9 0 0118 0v6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    pause: (
      <>
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      </>
    ),
    stop: (
      <rect x="3" y="3" width="18" height="18" rx="2" />
    ),
    plus: (
      <path d="M12 5v14 M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <path d="M16 2v4 M8 2v4 M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    sync: (
      <>
        <path d="M23 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20.49 15a9 9 0 01-14.85 3.36L1 14" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    comment: (
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
    ),
    file: (
      <>
        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 2v7h7" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    'upload-circle': (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8 M8 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    check: (
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    ),
    timer: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7v5l3 3" />
        <path d="M10 2h4" />
      </>
    ),
    person: (
      <>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    'volume-high': (
        <>
            <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19.07 4.93a10 10 0 010 14.14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.54 8.46a5 5 0 010 7.07" strokeLinecap="round" strokeLinejoin="round" />
        </>
    )
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {icons[name] || null}
    </svg>
  );
};
