import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { DemoTabs } from "@/components/demo/DemoTabs";

/**
 * Interactive demos section — small, runnable slices of Adit's real work
 * (911Care patient journey, the 60% frontend-perf win, and the invoice →
 * WhatsApp automation). Each is client-side, no backend.
 *
 * Extension point: more demos slot straight into DemoTabs as new entries.
 */
export function Demo() {
  return (
    <Section
      id="demo"
      eyebrow="Live demos"
      title="Interactive slices of real work"
      intro="Not screenshots — small, runnable visualizations of things I actually built. Pick a tab and press play."
    >
      <Reveal>
        <DemoTabs />
      </Reveal>
    </Section>
  );
}
