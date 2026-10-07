export default function Avatar({
  emoji,
  name,
  speaking,
}: {
  emoji: string;
  name: string;
  speaking: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-32 w-32 items-center justify-center">
        {speaking && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-amber-300/60" />
            <span className="absolute -inset-2 animate-pulse rounded-full border-2 border-amber-400" />
          </>
        )}
        <div
          className={`relative flex h-28 w-28 items-center justify-center rounded-full bg-amber-100 text-6xl shadow-md transition-transform duration-300 ${
            speaking ? "scale-105" : "scale-100"
          }`}
        >
          {emoji}
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-900">{name}</p>
        <p className="text-sm text-slate-500">
          {speaking ? "Speaking…" : "Listening…"}
        </p>
      </div>
    </div>
  );
}
