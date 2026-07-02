/**
 * Full robot mascot that peeks up from behind the chat box.
 * - `speaking` drives the mouth lip-sync, the waving hand, and sound waves.
 * The lower body is intentionally drawn low so it hides behind the chat panel;
 * only the head, antenna and waving hand rise above the panel's top edge.
 */
export function RobotCharacter({
  speaking = false,
  className = "",
}: {
  speaking?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 150 150"
      className={`${speaking ? "robot-speaking robot-waving" : "robot-waving"} ${className}`}
      role="img"
      aria-label="Assistant robot"
      style={{ overflow: "visible" }}
    >
      {/* antenna */}
      <line x1="75" y1="14" x2="75" y2="30" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle className="robot-antenna-light" cx="75" cy="11" r="4.5" fill="var(--accent-2)" />

      {/* ---- body / shoulders (mostly hidden behind the chat panel) ---- */}
      <rect x="44" y="104" width="62" height="46" rx="18" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="2.5" />
      <rect x="60" y="112" width="30" height="10" rx="5" fill="var(--accent)" opacity="0.25" />
      {/* left arm (down) */}
      <rect x="32" y="110" width="12" height="34" rx="6" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="2.5" />
      {/* neck */}
      <rect x="66" y="94" width="18" height="12" rx="4" fill="var(--accent)" opacity="0.4" />

      {/* ---- head ---- */}
      <rect x="41" y="34" width="68" height="62" rx="20" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="2.5" />
      {/* visor glow */}
      <rect x="48" y="44" width="54" height="28" rx="14" fill="var(--accent)" opacity="0.1" />
      {/* ears */}
      <rect x="34" y="56" width="7" height="18" rx="3.5" fill="var(--accent)" opacity="0.5" />
      <rect x="109" y="56" width="7" height="18" rx="3.5" fill="var(--accent)" opacity="0.5" />
      {/* eyes */}
      <circle className="robot-eye" cx="61" cy="58" r="5.5" fill="var(--accent-2)" />
      <circle className="robot-eye" cx="89" cy="58" r="5.5" fill="var(--accent-2)" />
      {/* cheeks */}
      <circle cx="53" cy="72" r="3" fill="var(--accent)" opacity="0.4" />
      <circle cx="97" cy="72" r="3" fill="var(--accent)" opacity="0.4" />
      {/* mouth (lip-syncs) */}
      <rect className="robot-mouth" x="64" y="76" width="22" height="7" rx="3.5" fill="var(--accent)" />

      {/* ---- waving right hand (rises above the box) ---- */}
      <g className="robot-hand">
        <rect x="110" y="42" width="10" height="34" rx="5" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="2.5" />
        <circle cx="115" cy="38" r="9" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="2.5" />
      </g>

      {/* ---- sound waves while speaking ---- */}
      <g stroke="var(--accent-2)" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path className="robot-wave-arc" d="M118 74 q7 6 0 12" />
        <path className="robot-wave-arc" d="M124 70 q12 10 0 20" />
      </g>
    </svg>
  );
}
