const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function FolderIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-400 shrink-0" strokeWidth="1.8" {...base}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

export function FileIcon() {
  return (
    <svg className="w-5 h-5 text-zinc-400 shrink-0" strokeWidth="1.8" {...base}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

export function CodeIcon() {
  return (
    <svg className="w-4 h-4" strokeWidth="2" {...base}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg
      className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"
      strokeWidth="2"
      {...base}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

