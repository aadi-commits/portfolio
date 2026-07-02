import { projects, type Project } from "@content/portfolio";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowUpRight } from "@/components/ui/icons";

/** Mini architecture "diagram": a horizontal flow of connected nodes. */
function ArchDiagram({ nodes }: { nodes: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {nodes.map((node, i) => (
        <span key={node + i} className="flex items-center gap-1">
          <span className="rounded-md border border-accent/25 bg-accent/5 px-2.5 py-1 font-mono text-xs text-accent-2">
            {node}
          </span>
          {i < nodes.length - 1 && (
            <span aria-hidden className="text-muted/60">
              →
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <Reveal
      as="article"
      id={project.slug}
      delay={index * 60}
      className="group relative scroll-mt-28 overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent/40 sm:p-8"
    >
      {/* subtle accent wash on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(30rem_20rem_at_100%_0,rgba(124,92,255,0.08),transparent_60%)]" />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {project.isConceptDemo && (
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-accent-2/30 bg-accent-2/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-2">
                Concept demo
              </span>
            )}
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {project.title}
            </h3>
            <p className="mt-1 text-muted">{project.blurb}</p>
          </div>
          {project.hasLiveDemo && (
            <a
              href="#demo"
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-2 transition-colors hover:bg-accent/20"
            >
              Live demo below ↓
            </a>
          )}
        </div>

        <ul className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((t) => (
            <li
              key={t}
              className="rounded-md border border-border bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted"
            >
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Problem">{project.problem}</Field>
          <Field label="Hardest part solved">{project.hardestPart}</Field>
        </div>

        <div className="mt-5">
          <Field label="Architecture">
            <ArchDiagram nodes={project.architecture} />
          </Field>
        </div>

        <div className="mt-5 rounded-xl border border-accent/20 bg-accent/[0.06] p-4">
          <Field label="Outcome">
            <span className="text-foreground">{project.outcome}</span>
          </Field>
        </div>

        {project.links && project.links.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-4">
            {project.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent-2 hover:underline"
              >
                {link.label}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}

export function Projects() {
  return (
    <Section
      id="projects"
      eyebrow="Projects"
      title="Case studies, not screenshots"
      intro="Each project framed the way I think about them: the problem, the architecture, the hardest thing I had to get right, and what it produced."
    >
      <div className="grid gap-6">
        {projects.map((project, i) => (
          <ProjectCard key={project.slug} project={project} index={i} />
        ))}
      </div>
    </Section>
  );
}
