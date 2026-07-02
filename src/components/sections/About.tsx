import { about } from "@content/portfolio";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

export function About() {
  return (
    <Section id="about" eyebrow="About" title="Engineer for the hard parts">
      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
        <Reveal className="space-y-4 text-lg leading-relaxed text-muted">
          {about.story.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </Reveal>

        <Reveal delay={120}>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent-2">
            Focus areas
          </p>
          <ul className="flex flex-wrap gap-2">
            {about.focusAreas.map((area) => (
              <li
                key={area}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground/90 transition-colors hover:border-accent/40 hover:text-accent-2"
              >
                {area}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
