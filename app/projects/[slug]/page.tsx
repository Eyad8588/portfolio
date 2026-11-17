import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AskButton from "@/components/AskButton";
import Media from "@/components/Media";
import { asset } from "@/lib/base";
import { getProject, getProjects, isTodo, showValue } from "@/lib/content";

export const dynamicParams = false;
export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProject((await params).slug);
  return p ? { title: p.title, description: p.tagline } : {};
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const all = getProjects();
  const p = getProject((await params).slug);
  if (!p) notFound();
  const i = all.findIndex((x) => x.slug === p.slug);
  const next = all[(i + 1) % all.length];

  return (
    <article className="wrap project">
      <Link href="/#projects" className="back">
        ← All projects
      </Link>
      <header className="project-head">
        <span className="status">{p.status}</span>
        <h1>{p.title}</h1>
        <p className="lead">{p.tagline}</p>
        <ul className="tags">
          {p.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <div className="hero-cta">
          {showValue(p.github) &&
            (isTodo(p.github) ? (
              <span className="todo">{p.github}</span>
            ) : (
              <a className="btn" href={p.github} target="_blank" rel="noreferrer">
                View on GitHub ↗
              </a>
            ))}
          <AskButton className="btn ghost" question={`Tell me about ${p.title}`}>
            Ask the AI about {p.title} ✦
          </AskButton>
        </div>
      </header>
      <Media p={p} large />
      {p.gallery.length > 1 && (
        <div className="gallery">
          {p.gallery.slice(1).map((g) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={g} src={asset(g)} alt={`${p.title} screenshot`} loading="lazy" />
          ))}
        </div>
      )}
      <div className="prose" dangerouslySetInnerHTML={{ __html: p.html }} />
      <Link href={`/projects/${next.slug}/`} className="next-card">
        <span className="muted">Next project</span>
        <strong>{next.title} →</strong>
      </Link>
    </article>
  );
}
