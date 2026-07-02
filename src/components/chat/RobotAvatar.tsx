/**
 * Little robot mascot for the portfolio assistant.
 * Pass `speaking` to make its mouth lip-sync (driven by the TTS onstart/onend).
 */
export function RobotAvatar({
  speaking = false,
  className = "",
}: {
  speaking?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`${speaking ? "robot-speaking" : ""} ${className}`}
      role="img"
      aria-label="Assistant robot"
    >
      {/* antenna */}
      <line x1="32" y1="7" x2="32" y2="15" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      <circle className="robot-antenna-light" cx="32" cy="5" r="3" fill="var(--accent-2)" />

      {/* ears */}
      <rect x="8" y="27" width="5" height="12" rx="2.5" fill="var(--accent)" opacity="0.5" />
      <rect x="51" y="27" width="5" height="12" rx="2.5" fill="var(--accent)" opacity="0.5" />

      {/* head */}
      <rect
        x="14"
        y="15"
        width="36"
        height="34"
        rx="10"
        fill="var(--surface-2)"
        stroke="var(--accent)"
        strokeWidth="2"
      />

      {/* visor glow */}
      <rect x="18" y="20" width="28" height="16" rx="7" fill="var(--accent)" opacity="0.08" />

      {/* eyes */}
      <circle className="robot-eye" cx="25" cy="29" r="3.6" fill="var(--accent-2)" />
      <circle className="robot-eye" cx="39" cy="29" r="3.6" fill="var(--accent-2)" />

      {/* mouth */}
      <rect className="robot-mouth" x="24" y="39" width="16" height="5" rx="2.5" fill="var(--accent)" />
    </svg>
  );
}
