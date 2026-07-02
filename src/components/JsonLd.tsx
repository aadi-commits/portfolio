import { identity, siteMeta } from "@content/portfolio";

/** Person structured data for rich search results. Server-rendered, zero JS. */
export function JsonLd() {
  const sameAs = [identity.links.github, identity.links.linkedin, identity.links.website].filter(
    Boolean,
  );

  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: identity.name,
    description: identity.headline,
    url: siteMeta.url,
    email: identity.links.email ? `mailto:${identity.links.email}` : undefined,
    jobTitle: identity.tagline,
    sameAs: sameAs.length ? sameAs : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
