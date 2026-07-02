import { identity } from "@content/portfolio";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { TerminalHero } from "./TerminalHero";
import { GitHubIcon, LinkedInIcon, MailIcon, DownloadIcon } from "@/components/ui/icons";

export function Hero() {
  const { openToWork, links } = identity;

  return (
    <section
      id="top"
      className="mx-auto flex min-h-[92vh] max-w-4xl flex-col justify-center px-5 pt-28 pb-16"
    >
      {openToWork && (
        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-accent-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          open_to_work
        </div>
      )}

      <TerminalHero />

      {/* Discoverable actions for visitors who won't type */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <OpenChatButton className="rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast transition-transform hover:scale-[1.03]">
          [ ask my portfolio ]
        </OpenChatButton>
        {links.resume && (
          <a
            href={links.resume}
            download="Adit_Navle_Resume.pdf"
            className="inline-flex items-center gap-2 rounded border border-border bg-surface-2 px-4 py-2 text-sm transition-colors hover:border-accent/50 hover:text-accent-2"
          >
            <DownloadIcon className="h-4 w-4" />
            resume.pdf
          </a>
        )}
        <span className="mx-1 hidden h-5 w-px bg-border sm:inline-block" />
        {links.github && (
          <a href={links.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="text-muted transition-colors hover:text-foreground">
            <GitHubIcon className="h-5 w-5" />
          </a>
        )}
        {links.linkedin && (
          <a href={links.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-muted transition-colors hover:text-foreground">
            <LinkedInIcon className="h-5 w-5" />
          </a>
        )}
        {links.email && (
          <a href={`mailto:${links.email}`} aria-label="Email" className="text-muted transition-colors hover:text-foreground">
            <MailIcon className="h-5 w-5" />
          </a>
        )}
        <span className="ml-auto hidden text-xs text-muted sm:inline">
          tip: type <span className="text-accent-2">help</span> in the terminal ↑
        </span>
      </div>
    </section>
  );
}
