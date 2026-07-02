"use client";

/**
 * 911Care — Patient Journey visualizer (client-side, no backend).
 *
 * Walks the real flow Adit built:
 *   basic details → symptoms (consultancy created) → Emergency OR Appointment
 *   → live queue → RMO assigns a doctor → doctor notified → accepts → starts
 *   the Zoom meeting (patient is push-notified through every step) → after the
 *   consult the doctor fills notes / medicines / lab tests → Post-Order Summary.
 *
 * The phone on the right shows the patient-facing push notifications, then flips
 * to the Post-Order Summary screen at the end.
 *
 * Note: the summary content is illustrative sample data, not real patient data.
 */

import { useEffect, useMemo, useState } from "react";

type Actor = "patient" | "rmo" | "doctor" | "system";
type Mode = "emergency" | "appointment";

type Step = {
  actor: Actor;
  title: string;
  detail?: string;
  notif?: { title: string; body: string };
  meeting?: boolean;
  summary?: boolean;
};

const ACTORS: Record<Actor, { label: string; dot: string; text: string; ring: string }> = {
  patient: { label: "Patient", dot: "bg-accent", text: "text-accent-2", ring: "ring-accent/40" },
  rmo: { label: "RMO / Admin", dot: "bg-amber-400", text: "text-amber-300", ring: "ring-amber-400/40" },
  doctor: { label: "Doctor", dot: "bg-emerald-400", text: "text-emerald-300", ring: "ring-emerald-400/40" },
  system: { label: "System", dot: "bg-sky-400", text: "text-sky-300", ring: "ring-sky-400/40" },
};

function buildSteps(mode: Mode): Step[] {
  const intro: Step[] = [
    { actor: "patient", title: "Enters basic details", detail: "Name, age, contact" },
    {
      actor: "patient",
      title: "Adds symptoms",
      detail: "Consultancy created",
      notif: { title: "Consultancy created", body: "We've noted your symptoms." },
    },
  ];

  const trigger: Step[] =
    mode === "emergency"
      ? [
          {
            actor: "patient",
            title: "Raises an Emergency Call",
            detail: "Sent straight to the live queue",
            notif: { title: "Emergency request sent", body: "You're in the queue — hold tight." },
          },
        ]
      : [
          { actor: "patient", title: "Books an appointment", detail: "Picks a time slot" },
          {
            actor: "system",
            title: "15 minutes before the slot",
            detail: "Reminder fires",
            notif: { title: "Appointment in 15 min", body: "Tap to join the queue when you're ready." },
          },
          { actor: "patient", title: "Joins the queue", detail: "Enters the live queue at slot time" },
        ];

  const queue: Step[] = [
    { actor: "rmo", title: "RMO sees the incoming request", detail: "Reviews the live queue" },
    {
      actor: "rmo",
      title: "Assigns a doctor",
      detail: "Routes the patient to an available doctor",
      notif: { title: "Matching you with a doctor", body: "Assigning the right doctor now." },
    },
    { actor: "doctor", title: "Doctor is notified", detail: "Receives assignment + symptoms" },
    {
      actor: "doctor",
      title: "Accepts the patient",
      detail: "Takes the patient from the queue",
      notif: { title: "Doctor assigned", body: "Your doctor is ready — joining shortly." },
    },
    {
      actor: "doctor",
      title: "Starts the meeting",
      detail: "Zoom video consult begins",
      notif: { title: "Your consult is starting", body: "Join the video call now." },
      meeting: true,
    },
  ];

  const close: Step[] = [
    { actor: "doctor", title: "Consultation (video)", detail: "Doctor and patient talk over Zoom", meeting: true },
    { actor: "doctor", title: "Adds notes, medicines & lab tests", detail: "Fills the post-consult record" },
    {
      actor: "system",
      title: "Post-Order Summary updated",
      detail: "Patient can view everything",
      notif: { title: "Summary ready", body: "Notes, medicines & lab tests added." },
      summary: true,
    },
  ];

  return [...intro, ...trigger, ...queue, ...close];
}

const STEP_MS = 1500;

export function PatientJourneyDemo() {
  const [mode, setMode] = useState<Mode>("emergency");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const steps = useMemo(() => buildSteps(mode), [mode]);
  const atEnd = step >= steps.length - 1;

  // Auto-advance while playing.
  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, step, atEnd]);

  function restart(nextMode: Mode = mode) {
    setMode(nextMode);
    setStep(0);
    setPlaying(true);
  }

  const notifications = steps
    .slice(0, step + 1)
    .filter((s) => s.notif)
    .map((s) => s.notif!);
  const current = steps[step];
  const showSummary = steps.slice(0, step + 1).some((s) => s.summary);
  const inMeeting = current?.meeting && !showSummary;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/50 px-5 py-3">
        <div className="inline-flex rounded-full border border-border bg-background p-0.5 text-sm">
          {(["emergency", "appointment"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => restart(m)}
              className={`rounded-full px-3 py-1 capitalize transition-colors ${
                mode === m ? "bg-accent text-accent-contrast" : "text-muted hover:text-foreground"
              }`}
            >
              {m === "emergency" ? "Emergency call" : "Book appointment"}
            </button>
          ))}
        </div>

        {/* Actor legend */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted">
          {(["patient", "rmo", "doctor"] as Actor[]).map((a) => (
            <span key={a} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${ACTORS[a].dot}`} />
              {ACTORS[a].label}
            </span>
          ))}
        </div>
      </div>

      {/* Stage */}
      <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[1fr_auto]">
        {/* Timeline */}
        <ol className="relative border-l border-border pl-6">
          {steps.map((s, i) => {
            const active = i === step;
            const done = i < step;
            const a = ACTORS[s.actor];
            return (
              <li
                key={i}
                className={`relative mb-4 last:mb-0 transition-opacity ${
                  i > step ? "opacity-40" : "opacity-100"
                }`}
              >
                <span
                  className={`absolute -left-[29px] mt-1 grid h-4 w-4 place-items-center rounded-full ring-2 transition-all ${
                    active ? `${a.dot} ${a.ring} scale-110` : done ? a.dot : "bg-surface-2 ring-border"
                  }`}
                >
                  {done && (
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-background" fill="none" stroke="currentColor" strokeWidth="4">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <div className={`flex items-center gap-2 ${active ? "font-semibold" : ""}`}>
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${a.text}`}>
                    {a.label}
                  </span>
                  {s.meeting && (
                    <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[9px] text-emerald-300">
                      video
                    </span>
                  )}
                </div>
                <p className={active ? "text-foreground" : "text-foreground/80"}>{s.title}</p>
                {s.detail && <p className="text-sm text-muted">{s.detail}</p>}
              </li>
            );
          })}
        </ol>

        {/* Phone */}
        <div className="mx-auto w-[240px] shrink-0">
          <div className="relative rounded-[2rem] border border-border bg-background p-3 shadow-xl">
            {/* notch */}
            <div className="absolute left-1/2 top-2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-border" />
            <div className="mt-4 h-[360px] overflow-hidden rounded-[1.4rem] border border-border bg-surface-2/40">
              {/* status bar */}
              <div className="flex items-center justify-between border-b border-border px-3 py-1.5 font-mono text-[10px] text-muted">
                <span>911Care</span>
                <span>{showSummary ? "Summary" : inMeeting ? "● live" : "Lock screen"}</span>
              </div>

              {showSummary ? (
                <PostOrderSummary />
              ) : inMeeting ? (
                <MeetingScreen />
              ) : (
                <div className="flex flex-col gap-2 p-2.5">
                  {notifications.length === 0 && (
                    <p className="mt-8 px-2 text-center text-xs text-muted/60">
                      Patient notifications will appear here…
                    </p>
                  )}
                  {notifications.map((n, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border border-border bg-background/80 p-2.5 ${
                        i === notifications.length - 1 ? "reveal is-visible" : ""
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="grid h-4 w-4 place-items-center rounded bg-accent/20 text-[8px] text-accent-2">
                          ⚕
                        </span>
                        <span className="text-[11px] font-semibold">{n.title}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-muted">{n.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-4 sm:px-8">
        <button
          onClick={() => (atEnd ? restart() : setPlaying((p) => !p))}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-contrast shadow-lg shadow-accent/25 transition-transform hover:scale-[1.03]"
        >
          {atEnd ? "Replay" : playing ? "Pause" : step === 0 ? "Play journey" : "Resume"}
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.min(s + 1, steps.length - 1));
          }}
          disabled={atEnd}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-accent/50 hover:text-accent-2 disabled:opacity-40"
        >
          Step ›
        </button>
        <span className="ml-auto font-mono text-xs text-muted">
          {step + 1} / {steps.length}
        </span>
      </div>
    </div>
  );
}

function MeetingScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <div className="relative grid h-20 w-20 place-items-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/40">
        <span className="absolute inline-flex h-20 w-20 animate-ping rounded-full bg-emerald-400/20" />
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="6" width="12" height="12" rx="2" />
          <path d="M15 10l6-3v10l-6-3" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-emerald-300">Video consult live</p>
      <p className="text-[11px] text-muted">Zoom Video SDK · doctor connected</p>
    </div>
  );
}

function PostOrderSummary() {
  const blocks = [
    { label: "Consultation notes", items: ["Viral fever — advised rest & hydration"] },
    { label: "Medicines", items: ["Paracetamol 500mg — 1 tab, twice daily × 3 days"] },
    { label: "Lab tests", items: ["CBC", "CRP"] },
  ];
  return (
    <div className="reveal is-visible flex flex-col gap-2.5 p-3">
      <p className="text-[11px] font-semibold text-accent-2">Post-Order Summary</p>
      {blocks.map((b) => (
        <div key={b.label} className="rounded-lg border border-border bg-background/70 p-2">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted">{b.label}</p>
          <ul className="mt-1 space-y-0.5">
            {b.items.map((it) => (
              <li key={it} className="text-[11px] leading-snug text-foreground/90">
                • {it}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="mt-1 text-center text-[9px] text-muted/50">Illustrative sample — not real patient data</p>
    </div>
  );
}
