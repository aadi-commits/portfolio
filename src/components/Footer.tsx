import { identity } from "@content/portfolio";
import { GitHubIcon, LinkedInIcon, MailIcon } from "@/components/ui/icons";

export function Footer() {
  const { links, name } = identity;
  return (
    <footer className="mb-7 border-t border-border">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row">
        <p className="text-sm text-muted">
          <span className="text-accent">$</span> echo &quot;© {name}&quot;
          <span className="ml-2 text-muted/60">// built with Next.js · TS · Tailwind</span>
        </p>
        <div className="flex items-center gap-4 text-muted">
          {links.github && (
            <a href={links.github} aria-label="GitHub" target="_blank" rel="noreferrer" className="hover:text-foreground">
              <GitHubIcon className="h-5 w-5" />
            </a>
          )}
          {links.linkedin && (
            <a href={links.linkedin} aria-label="LinkedIn" target="_blank" rel="noreferrer" className="hover:text-foreground">
              <LinkedInIcon className="h-5 w-5" />
            </a>
          )}
          {links.email && (
            <a href={`mailto:${links.email}`} aria-label="Email" className="hover:text-foreground">
              <MailIcon className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
