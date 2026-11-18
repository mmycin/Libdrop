import type { Banner } from "@/lib/types";

export default function StatusBanner({
  banner,
  onDismiss,
}: {
  banner: Banner;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`px-4 py-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
        banner.type === "success"
          ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
          : "bg-red-950/40 border-red-800/60 text-red-300"
      }`}
    >
      <span>{banner.text}</span>
      <button onClick={onDismiss} className="text-zinc-400 hover:text-zinc-200">
        Dismiss
      </button>
    </div>
  );
}

