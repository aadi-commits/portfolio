"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { identity, about, experience, projects } from "@content/portfolio";

/* A printed line in the terminal log. */
type Entry = { id: number; node: ReactNode; delay: number };

const COMMANDS = [
  "help",
  "about",
  "skills",
  "experience",
  "projects",
  "demos",
  "open",
  "ask",
  "resume",
  "contact",
  "github",
  "linkedin",
  "whoami",
  "clear",
];

const SKILLS: [string, string][] = [
  ["backend", "Node.js · Express · Java Spring Boot · REST · Prisma · JWT/OAuth · RBAC"],
  ["frontend", "Angular · React · Ionic · React Native · Capacitor · TypeScript"],
  ["data / ai", "MongoDB · PostgreSQL · Redis · pgvector · RAG · LLM APIs"],
  ["devops", "Git · GitHub Actions · Docker · Gradle · Google Play Console · CI/CD"],
];

function Prompt() {
  return (
    <>
      <span className="text-accent">adit@portfolio</span>
      <span className="text-muted">:~$ </span>
    </>
  );
}

export function TerminalHero() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);

  const idRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const print = (nodes: ReactNode | ReactNode[]) => {
    const arr = Array.isArray(nodes) ? nodes : [nodes];
    setEntries((prev) =>
      [...prev, ...arr.map((n, i) => ({ id: idRef.current++, node: n, delay: i }))].slice(-260),
    );
  };

  const echo = (cmd: string) =>
    print(
      <div>
        <Prompt />
        <span className="text-foreground">{cmd}</span>
      </div>,
    );

  // Boot banner.
  useEffect(() => {
    print([
      <div key="n" className="text-lg font-bold text-accent-2">
        {identity.name}
      </div>,
      <div key="t" className="text-fn">
        {identity.tagline}
      </div>,
      <div key="h" className="text-muted">
        {identity.headline}
      </div>,
      <div key="sp" className="h-1" />,
      <div key="hint" className="text-muted">
        type <span className="text-accent-2">help</span> to explore — e.g.{" "}
        <span className="text-str">about</span>, <span className="text-str">projects</span>,{" "}
        <span className="text-str">ask &quot;what&apos;s your RAG experience?&quot;</span>
      </div>,
      <div key="sp2" className="h-2" />,
    ]);
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to newest line.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [entries]);

  function line(node: ReactNode, key?: string) {
    return <div key={key}>{node}</div>;
  }

  function run(raw: string) {
    const cmd = raw.trim();
    echo(cmd);
    if (!cmd) return;

    const [name, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ");
    const c = name.toLowerCase();

    switch (c) {
      case "help":
        print([
          line(<span className="text-muted">available commands:</span>),
          ...(
            [
              ["help", "show this list"],
              ["about", "who I am"],
              ["skills", "my tech stack"],
              ["experience", "work history"],
              ["projects", "case studies — open <name> to jump"],
              ["demos", "interactive demos ↓"],
              ["ask <q>", "ask my AI assistant"],
              ["resume", "download my résumé"],
              ["contact", "email & socials"],
              ["github / linkedin", "open profile"],
              ["clear", "clear the screen"],
            ] as [string, string][]
          ).map(([k, v], i) =>
            line(
              <span>
                <span className="text-accent-2">{k.padEnd(18)}</span>
                <span className="text-muted">{v}</span>
              </span>,
              `help-${i}`,
            ),
          ),
        ]);
        break;

      case "whoami":
        print(line(<span className="text-foreground">{identity.name} — {identity.tagline}</span>));
        break;

      case "about":
      case "cat": // `cat about.md`
        print(about.story.map((s, i) => line(<span className="text-foreground/90">{s}</span>, `ab-${i}`)));
        break;

      case "skills":
        print(
          SKILLS.map(([k, v], i) =>
            line(
              <span>
                <span className="text-kw">{k.padEnd(12)}</span>
                <span className="text-foreground/90">{v}</span>
              </span>,
              `sk-${i}`,
            ),
          ),
        );
        break;

      case "experience":
        print(
          experience.flatMap((e, i) => [
            line(
              <span>
                <span className="text-accent-2">{e.role}</span>
                <span className="text-muted"> · {e.company}</span>
                <span className="text-num"> {e.period}</span>
              </span>,
              `ex-${i}`,
            ),
            line(<span className="text-muted">  {e.summary}</span>, `exs-${i}`),
          ]),
        );
        break;

      case "projects":
      case "ls":
        print([
          ...projects.map((p, i) =>
            line(
              <span>
                <span className="text-str">{p.slug.padEnd(22)}</span>
                <span className="text-foreground/90">{p.title}</span>
              </span>,
              `pj-${i}`,
            ),
          ),
          line(<span className="text-muted">→ open &lt;name&gt; to jump · demos for the live ones</span>, "pj-h"),
        ]);
        break;

      case "open": {
        const key = arg.toLowerCase().replace(/\s+/g, "-");
        const hit = projects.find(
          (p) => p.slug.includes(key) || p.title.toLowerCase().includes(arg.toLowerCase()),
        );
        if (!arg) {
          print(line(<span className="text-err">usage: open &lt;project name&gt;</span>));
        } else if (hit) {
          print(line(<span className="text-str">opening {hit.title} …</span>));
          document.getElementById(hit.slug)?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          print(line(<span className="text-err">no project matches “{arg}”. try: projects</span>));
        }
        break;
      }

      case "demos":
        print(line(<span className="text-str">opening demos …</span>));
        document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
        break;

      case "ask": {
        if (arg) {
          print(line(<span className="text-str">asking the assistant: “{arg}” …</span>));
          window.dispatchEvent(new CustomEvent("portfolio:open-chat", { detail: { question: arg } }));
        } else {
          print(line(<span className="text-str">opening the assistant …</span>));
          window.dispatchEvent(new Event("portfolio:open-chat"));
        }
        break;
      }

      case "resume":
      case "cv":
        if (identity.links.resume) {
          print(line(<span className="text-str">downloading resume.pdf …</span>));
          const a = document.createElement("a");
          a.href = identity.links.resume;
          a.download = "Adit_Navle_Resume.pdf";
          a.click();
        } else {
          print(line(<span className="text-err">no résumé configured</span>));
        }
        break;

      case "contact":
        print([
          identity.links.email &&
            line(
              <span>
                <span className="text-muted">email    </span>
                <a href={`mailto:${identity.links.email}`} className="text-fn hover:underline">
                  {identity.links.email}
                </a>
              </span>,
              "c-e",
            ),
          identity.links.github &&
            line(
              <span>
                <span className="text-muted">github   </span>
                <a href={identity.links.github} target="_blank" rel="noreferrer" className="text-fn hover:underline">
                  {identity.links.github}
                </a>
              </span>,
              "c-g",
            ),
          identity.links.linkedin &&
            line(
              <span>
                <span className="text-muted">linkedin </span>
                <a href={identity.links.linkedin} target="_blank" rel="noreferrer" className="text-fn hover:underline">
                  {identity.links.linkedin}
                </a>
              </span>,
              "c-l",
            ),
          line(<span className="text-muted">location {identity.location}</span>, "c-loc"),
        ].filter(Boolean) as ReactNode[]);
        break;

      case "github":
        print(line(<span className="text-str">opening GitHub …</span>));
        if (identity.links.github) window.open(identity.links.github, "_blank");
        break;
      case "linkedin":
        print(line(<span className="text-str">opening LinkedIn …</span>));
        if (identity.links.linkedin) window.open(identity.links.linkedin, "_blank");
        break;

      case "clear":
        setEntries([]);
        return;

      // ---- easter eggs ----
      case "sudo":
        if (arg.toLowerCase().includes("hire")) {
          print([
            line(<span className="text-str">[sudo] access granted ✔</span>, "s1"),
            line(<span className="text-foreground/90">Adit is open to work. Run `contact` — let&apos;s talk. 😎</span>, "s2"),
          ]);
        } else {
          print(line(<span className="text-err">[sudo] permission denied: nice try 😏</span>));
        }
        break;
      case "rm":
        print(line(<span className="text-num">🔥 whoa — `rm -rf /` … just kidding. Nothing was harmed.</span>));
        break;
      case "ls-la":
      case "matrix":
        print(line(<span className="text-str">wake up, Neo… 🟢 (there is no spoon)</span>));
        break;

      default:
        print(line(<span className="text-err">zsh: command not found: {c} — type `help`</span>));
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const val = input;
      setHistory((h) => (val.trim() ? [...h, val] : h));
      setHistIdx(-1);
      setInput("");
      run(val);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const idx = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(history[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < 0) return;
      const idx = histIdx + 1;
      if (idx >= history.length) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(idx);
        setInput(history[idx]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const [first, ...rest] = input.split(/\s+/);
      if (rest.length) return; // only complete the command word
      const matches = COMMANDS.filter((c) => c.startsWith(first.toLowerCase()));
      if (matches.length === 1) {
        setInput(matches[0] + " ");
      } else if (matches.length > 1) {
        echo(input);
        print(line(<span className="text-muted">{matches.join("   ")}</span>));
      }
    }
  }

  return (
    <div className="window shadow-2xl shadow-black/40">
      <div className="window-bar">
        <span className="dots">
          <span className="dot" style={{ background: "#ff5f56" }} />
          <span className="dot" style={{ background: "#ffbd2e" }} />
          <span className="dot" style={{ background: "#27c93f" }} />
        </span>
        <span className="mx-auto pr-14 text-xs">adit@portfolio — zsh</span>
      </div>

      <div
        onClick={() => inputRef.current?.focus()}
        className="cursor-text p-4 sm:p-5"
      >
        <div
          ref={logRef}
          className="h-[44vh] min-h-[300px] max-h-[520px] space-y-1 overflow-y-auto text-[13px] leading-relaxed sm:text-sm"
        >
          {entries.map((e) => (
            <div key={e.id} className="type-line" style={{ animationDelay: `${Math.min(e.delay, 12) * 30}ms` }}>
              {e.node}
            </div>
          ))}

          {/* live input line */}
          <div className="flex items-center">
            <Prompt />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-label="Terminal input"
              className="ml-1 flex-1 bg-transparent text-foreground caret-[var(--accent-2)] outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
