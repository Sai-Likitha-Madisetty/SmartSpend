const paths = {
  spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
  grid: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
  receipt: <><path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h11A1.5 1.5 0 0 1 19 3.5V22l-3.5-2-3.5 2-3.5-2L5 22V3.5Z" /><path d="M9 7h6M9 11h6M9 15h3" /></>,
  upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18m-5 5h.01" /><path d="M6 5V4a2 2 0 0 1 2-2h10" /></>,
  tag: <><path d="M20.5 13.5 13 21l-10-10V3h8l9.5 9.5a.7.7 0 0 1 0 1Z" /><circle cx="7.5" cy="7.5" r="1" /></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
  pie: <><path d="M12 3v9h9A9 9 0 1 1 12 3Z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15V3.5Z" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
  filter: <><path d="M4 7h16M7 12h10m-7 5h4" /><circle cx="8" cy="7" r="1.5" /><circle cx="15" cy="12" r="1.5" /></>,
  edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" /></>,
  trash: <><path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  utensils: <><path d="M7 3v7m4-7v7M7 7h4m-2 3v11m8-18v18m0-18a4 4 0 0 1 4 4v4h-4" /></>,
  car: <><path d="m5 11 1.5-5h11l1.5 5M3 11h18v7H3z" /><path d="M6 18v2m12-2v2M6 14h.01M18 14h.01" /></>,
  bag: <><path d="M4 8h16l-1 13H5L4 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  play: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="m10 8 6 4-6 4V8Z" /></>,
  bolt: <path d="m13 2-3 9h7L9 22l2-9H4l9-11Z" />,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  file: <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M13 2v7h7M8 13h8m-8 4h8" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  alert: <><path d="M10.3 3.9 2.5 17.4A1.8 1.8 0 0 0 4 20h16a1.8 1.8 0 0 0 1.5-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></>,
  cloud: <path d="M20 16.5a4.5 4.5 0 0 0-1.2-8.8A6 6 0 0 0 7 8.5a4 4 0 0 0 .5 8H20Z" />,
};

export function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || paths.spark}
    </svg>
  );
}
