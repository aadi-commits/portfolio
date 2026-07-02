"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiContext, identity } from "@content/portfolio";
import { RobotAvatar } from "./RobotAvatar";
import { RobotCharacter } from "./RobotCharacter";
import { SendIcon, CloseIcon, SpeakerIcon, MuteIcon } from "@/components/ui/icons";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content: `Hi! I'm ${identity.name}'s assistant 🤖 — ask me about their experience, projects, or availability, and I'll answer (out loud, if you like).`,
};

/** Strip markdown/emoji so the spoken version sounds clean. */
function forSpeech(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_`#>]/g, "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);

  // Dragging the terminal window (grab the title bar)
  const panelRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{
    px: number;
    py: number;
    ox: number;
    oy: number;
    baseLeft: number;
    baseTop: number;
    w: number;
    h: number;
  } | null>(null);

  // Voice
  const [ttsSupported, setTtsSupported] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<(text: string) => void>(() => {});

  /* ----- Open via global event; optional detail.question is auto-sent ----- */
  useEffect(() => {
    const openChat = (e: Event) => {
      setOpen(true);
      const q = (e as CustomEvent<{ question?: string }>).detail?.question;
      if (q) setTimeout(() => sendRef.current(q), 350);
    };
    window.addEventListener("portfolio:open-chat", openChat);
    return () => window.removeEventListener("portfolio:open-chat", openChat);
  }, []);

  /* ----- Voice setup ----- */
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setTtsSupported(true);

    // Restore mute preference.
    setMuted(localStorage.getItem("chat-muted") === "1");

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      voiceRef.current =
        voices.find((v) => /en(-|_)?(US|GB)?/i.test(v.lang) && /google|natural|zira|david/i.test(v.name)) ||
        voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
        voices[0];
    };
    pickVoice();
    window.speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", pickVoice);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    if (ttsSupported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [ttsSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!ttsSupported || muted) return;
      const clean = forSpeech(text);
      if (!clean) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = 1.02;
      u.pitch = 1.05;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [ttsSupported, muted],
  );

  /* ----- Auto-scroll ----- */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  /* ----- Stop audio when closing / unmounting ----- */
  useEffect(() => {
    if (!open) stopSpeaking();
  }, [open, stopSpeaking]);

  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      if (next) stopSpeaking();
      if (ttsSupported) localStorage.setItem("chat-muted", next ? "1" : "0");
      return next;
    });
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    stopSpeaking();

    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setDemo(Boolean(json.demo));
      setMessages((m) => [...m, { role: "assistant", content: json.reply }]);
      speak(json.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Keep the ref pointing at the latest send() so the open-chat listener can
  // auto-send a question without re-subscribing on every render.
  sendRef.current = send;

  /* ----- Drag the window by its title bar ----- */
  function onDragStart(e: React.PointerEvent) {
    // Don't start a drag when pressing the buttons in the bar.
    if ((e.target as HTMLElement).closest("button")) return;
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragStart.current = {
      px: e.clientX,
      py: e.clientY,
      ox: drag.x,
      oy: drag.y,
      baseLeft: rect.left - drag.x,
      baseTop: rect.top - drag.y,
      w: rect.width,
      h: rect.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }

  function onDragMove(e: React.PointerEvent) {
    const s = dragStart.current;
    if (!s) return;
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const clamp = (v: number, a: number, b: number) =>
      Math.min(Math.max(v, Math.min(a, b)), Math.max(a, b));
    const nx = clamp(
      s.ox + (e.clientX - s.px),
      margin - s.baseLeft,
      vw - margin - s.w - s.baseLeft,
    );
    const ny = clamp(
      s.oy + (e.clientY - s.py),
      margin - s.baseTop,
      vh - margin - s.h - s.baseTop,
    );
    setDrag({ x: nx, y: ny });
  }

  function onDragEnd(e: React.PointerEvent) {
    dragStart.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className={`fixed bottom-5 right-5 z-50 grid h-16 w-16 place-items-center rounded-full border border-accent/40 bg-surface shadow-xl shadow-accent/25 transition-transform hover:scale-105 ${
          open ? "scale-90" : "robot-float"
        }`}
      >
        {open ? (
          <CloseIcon className="h-6 w-6 text-foreground" />
        ) : (
          <>
            <RobotAvatar speaking={speaking} className="h-11 w-11" />
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-accent" />
            </span>
          </>
        )}
      </button>

      {/* Split terminal: robot pane + chat pane */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Portfolio assistant"
          className="window chat-pop fixed bottom-24 right-5 z-50 flex flex-col shadow-2xl shadow-black/50"
          style={{
            width: "min(600px, calc(100vw - 2rem))",
            height: "min(520px, calc(100vh - 7rem))",
            transform: `translate(${drag.x}px, ${drag.y}px)`,
          }}
        >
          {/* window bar (drag handle) */}
          <div
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            className={`window-bar touch-none select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          >
            <span className="dots">
              <span className="dot" style={{ background: "#ff5f56" }} />
              <span className="dot" style={{ background: "#ffbd2e" }} />
              <span className="dot" style={{ background: "#27c93f" }} />
            </span>
            <span className="ml-1 truncate">
              assistant — zsh · {identity.name.toLowerCase().replace(/\s+/g, "-")}
            </span>
            <div className="ml-auto flex items-center gap-1">
              {ttsSupported && (
                <button
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute voice" : "Mute voice"}
                  title={muted ? "Voice off" : "Voice on"}
                  className={`grid h-6 w-6 place-items-center rounded transition-colors ${
                    muted ? "text-muted hover:text-foreground" : "text-accent-2 hover:bg-accent/10"
                  }`}
                >
                  {muted ? <MuteIcon className="h-4 w-4" /> : <SpeakerIcon className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-6 w-6 place-items-center rounded text-muted transition-colors hover:text-foreground"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* two panes */}
          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            {/* robot pane */}
            <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface-2/40 p-3 sm:w-[172px] sm:flex-col sm:justify-center sm:gap-2 sm:border-b-0 sm:border-r">
              <RobotCharacter
                speaking={speaking}
                className={`h-16 w-16 shrink-0 sm:h-28 sm:w-28 ${speaking ? "" : "robot-float"}`}
              />
              <div className="min-w-0 sm:text-center">
                <p className="text-xs text-fn">assistant.ai</p>
                <p className="truncate text-[11px] text-muted">
                  {loading ? (
                    <span className="text-num">● thinking…</span>
                  ) : speaking ? (
                    <span className="text-accent-2">● speaking…</span>
                  ) : (
                    <span className="text-accent-2">● online</span>
                  )}
                </p>
                {demo && <p className="mt-0.5 text-[10px] text-num">demo mode · no key</p>}
              </div>
            </div>

            {/* chat pane */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 text-[13px] leading-relaxed">
                <p className="mb-2 text-muted/60"># {identity.name}&apos;s portfolio assistant — ask about my work</p>
                {messages.map((m, i) => (
                  <TermLine
                    key={i}
                    msg={m}
                    canReplay={ttsSupported && !muted && m.role === "assistant" && m !== GREETING}
                    onReplay={() => speak(m.content)}
                  />
                ))}
                {loading && (
                  <div className="text-fn">
                    assistant<span className="text-muted">&gt; </span>
                    <span className="cursor-blink inline-block h-3.5 w-2 translate-y-0.5 bg-accent-2" />
                  </div>
                )}
                {error && <div className="mt-1 text-err">! {error}</div>}
              </div>

              {/* quick prompts */}
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
                  {aiContext.suggestedPrompts.slice(0, 4).map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      disabled={loading}
                      className="rounded border border-border bg-surface-2 px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-accent-2 disabled:opacity-50"
                    >
                      <span className="text-muted/50"># </span>
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* input prompt */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2 border-t border-border p-2.5"
              >
                <span className="shrink-0 text-[13px]">
                  <span className="text-accent">you</span>
                  <span className="text-muted">:~$</span>
                </span>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="ask about Adit…"
                  maxLength={1500}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted/60 focus:outline-none"
                  aria-label="Ask a question"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label="Send"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded bg-accent text-accent-contrast transition-transform hover:scale-105 disabled:opacity-50"
                >
                  <SendIcon className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** One terminal line: `you:~$ ...` for the visitor, `assistant> ...` for the bot. */
function TermLine({
  msg,
  canReplay,
  onReplay,
}: {
  msg: Msg;
  canReplay: boolean;
  onReplay: () => void;
}) {
  const isUser = msg.role === "user";
  return (
    <div className="mb-2">
      <span className={isUser ? "text-accent" : "text-fn"}>{isUser ? "you" : "assistant"}</span>
      <span className="text-muted">{isUser ? ":~$ " : "> "}</span>
      <span className="whitespace-pre-wrap text-foreground/90">{msg.content}</span>
      {canReplay && (
        <button
          onClick={onReplay}
          aria-label="Replay voice"
          title="Replay voice"
          className="ml-2 inline-flex items-center gap-1 align-middle text-[10px] text-muted transition-colors hover:text-accent-2"
        >
          <SpeakerIcon className="h-3 w-3" /> replay
        </button>
      )}
    </div>
  );
}
