import { experience } from "@content/portfolio";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

export function Experience() {
  return (
    <Section
      id="experience"
      eyebrow="Experience"
      title="Where I've shipped"
      intro="A timeline of roles, scope, and measurable outcomes."
    >
      <ol className="relative border-l border-border pl-8">
        {experience.map((item, i) => (
          <Reveal as="li" key={`${item.company}-${i}`} delay={i * 80} className="mb-12 last:mb-0">
            {/* Node dot */}
            <span className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-accent bg-background" />

            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-xl font-semibold">
                {item.role}{" "}
                <span className="text-accent-2">· {item.company}</span>
              </h3>
              <span className="font-mono text-sm text-muted">{item.period}</span>
            </div>

            {item.location && (
              <p className="mt-1 text-sm text-muted">{item.location}</p>
            )}
            <p className="mt-3 text-muted">{item.summary}</p>

            <ul className="mt-4 space-y-2">
              {item.highlights.map((h, hi) => (
                <li key={hi} className="flex gap-3 text-foreground/90">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <ul className="mt-4 flex flex-wrap gap-2">
              {item.stack.map((s) => (
                <li
                  key={s}
                  className="rounded-md border border-border bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted"
                >
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
