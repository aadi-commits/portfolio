"use client";

/** Opens the floating ChatWidget from anywhere (Nav CTA, Hero CTA, etc.). */
export function openChat() {
  window.dispatchEvent(new Event("portfolio:open-chat"));
}

export function OpenChatButton({
  children,
  className = "",
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <button type="button" onClick={openChat} className={className} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
