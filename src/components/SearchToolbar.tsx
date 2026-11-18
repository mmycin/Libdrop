import type { ViewMode } from "@/lib/types";
import { SearchIcon } from "./Icons";

export default function SearchToolbar({
  search,
  onSearch,
  viewMode,
  onViewMode,
}: {
  search: string;
  onSearch: (v: string) => void;
  viewMode: ViewMode;
  onViewMode: (m: ViewMode) => void;
}) {
  const tab = (mode: ViewMode, label: string) => (
    <button
      onClick={() => onViewMode(mode)}
      className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
        viewMode === mode
          ? "bg-zinc-800 text-zinc-100"
          : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Search folders, subfolders, or filenames..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-9 pr-14 py-2.5 text-sm rounded-xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-zinc-600"
        />
        <SearchIcon />
        {search && (
          <button
            onClick={() => onSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex rounded-xl bg-zinc-900 border border-zinc-800 p-1 shrink-0">
        {tab("explorer", "Folder Explorer")}
        {tab("grouped", "All Files Grouped")}
      </div>
    </section>
  );
}

