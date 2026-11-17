import Link from "next/link";
import type { Project } from "@/lib/content";
import Media from "./Media";

export default function ProjectCard({ p }: { p: Project }) {
  return (
    <article className="card">
      <Link href={`/projects/${p.slug}/`} className="card-link" aria-label={`${p.title} — details`}>
        <Media p={p} />
        <div className="card-body">
          <div className="card-top">
            <h3>{p.title}</h3>
            <span className="status">{p.status}</span>
          </div>
          <p>{p.tagline}</p>
          <ul className="tags">
            {p.tags.slice(0, 4).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </Link>
    </article>
  );
}
