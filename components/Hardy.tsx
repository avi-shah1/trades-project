"use client";

export type HardyMood = "happy" | "wow" | "thinking" | "sad" | "cool";

/**
 * Hardy - the Tradie Talk mascot. A hard-hat robot with a glowing visor face.
 * Eyes blink on a CSS loop; mood swaps the eye and mouth shapes.
 */
export default function Hardy({
  mood = "happy",
  size = 160,
  float = true,
  className = "",
}: {
  mood?: HardyMood;
  size?: number;
  float?: boolean;
  className?: string;
}) {
  const cyan = "#29e3ff";
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={float ? { animation: "float 4s ease-in-out infinite" } : undefined}
      role="img"
      aria-label="Hardy the hard-hat robot mascot"
    >
      <defs>
        <linearGradient id="hat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe066" />
          <stop offset="1" stopColor="#ffb300" />
        </linearGradient>
        <linearGradient id="visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#16213e" />
          <stop offset="1" stopColor="#0a1020" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* antenna */}
      <line x1="100" y1="22" x2="100" y2="8" stroke="#8aa0c8" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="7" r="5" fill="#ff3d8b" filter="url(#glow)">
        <animate attributeName="opacity" values="1;0.35;1" dur="1.6s" repeatCount="indefinite" />
      </circle>

      {/* side pods */}
      <rect x="22" y="100" width="16" height="36" rx="8" fill="#26345a" />
      <rect x="162" y="100" width="16" height="36" rx="8" fill="#26345a" />
      <circle cx="30" cy="118" r="4" fill={cyan} opacity="0.9" />
      <circle cx="170" cy="118" r="4" fill={cyan} opacity="0.9" />

      {/* visor / face */}
      <rect x="36" y="76" width="128" height="94" rx="38" fill="url(#visor)" stroke={cyan} strokeOpacity="0.55" strokeWidth="2.5" />

      {/* hard hat */}
      <path d="M32 84 C32 44 62 22 100 22 C138 22 168 44 168 84 Z" fill="url(#hat)" />
      <path d="M88 24 C94 22 106 22 112 24 L112 84 L88 84 Z" fill="#ffd23f" opacity="0.9" />
      <rect x="22" y="80" width="156" height="14" rx="7" fill="#ffb300" />
      <rect x="22" y="80" width="156" height="5" rx="2.5" fill="#fff0a8" opacity="0.7" />
      {/* bolt badge */}
      <path d="M104 40 L90 62 H100 L96 78 L112 54 H102 Z" fill="#0a1020" opacity="0.85" transform="translate(0,-2)" />

      {/* face features */}
      <g filter="url(#glow)" stroke={cyan} fill={cyan} strokeLinecap="round" strokeLinejoin="round">
        <Eyes mood={mood} />
        <Mouth mood={mood} />
      </g>
      {mood === "cool" && (
        <rect x="52" y="104" width="96" height="16" rx="8" fill="#050810" stroke={cyan} strokeWidth="2" />
      )}
    </svg>
  );
}

function Blink({ children }: { children: React.ReactNode }) {
  return (
    <g
      style={{
        transformBox: "fill-box",
        transformOrigin: "center",
        animation: "hardy-blink 5s infinite",
      }}
    >
      {children}
      <style>{`@keyframes hardy-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(0.08)}}`}</style>
    </g>
  );
}

function Eyes({ mood }: { mood: HardyMood }) {
  if (mood === "happy")
    return (
      <g fill="none" strokeWidth="6">
        <path d="M66 118 Q78 100 90 118" />
        <path d="M110 118 Q122 100 134 118" />
      </g>
    );
  if (mood === "wow")
    return (
      <Blink>
        <ellipse cx="78" cy="114" rx="11" ry="15" />
        <ellipse cx="122" cy="114" rx="11" ry="15" />
      </Blink>
    );
  if (mood === "sad")
    return (
      <g>
        <Blink>
          <ellipse cx="78" cy="116" rx="9" ry="11" />
          <ellipse cx="122" cy="116" rx="9" ry="11" />
        </Blink>
        <path d="M64 100 L90 106" fill="none" strokeWidth="4" />
        <path d="M136 100 L110 106" fill="none" strokeWidth="4" />
      </g>
    );
  if (mood === "thinking")
    return (
      <Blink>
        <ellipse cx="78" cy="114" rx="9" ry="9" />
        <ellipse cx="122" cy="110" rx="9" ry="12" />
      </Blink>
    );
  return null; // cool: visor drawn over the top
}

function Mouth({ mood }: { mood: HardyMood }) {
  if (mood === "happy" || mood === "cool")
    return <path d="M80 142 Q100 160 120 142" fill="none" strokeWidth="5" />;
  if (mood === "wow") return <ellipse cx="100" cy="150" rx="9" ry="11" fill="none" strokeWidth="4" />;
  if (mood === "sad") return <path d="M82 154 Q100 140 118 154" fill="none" strokeWidth="5" />;
  return <path d="M86 148 H114" fill="none" strokeWidth="5" />;
}
