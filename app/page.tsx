import Link from "next/link";
import AskButton from "@/components/AskButton";
import ProjectCard from "@/components/ProjectCard";
import { asset } from "@/lib/base";
import { getAboutHtml, getProfile, getProjects, getStack, isTodo, showValue } from "@/lib/content";

export default function Home() {
  const profile = getProfile();
  const projects = getProjects();
  const stack = getStack();
  const links = [
    { label: "GitHub", href: profile.links.github },
    { label: "LinkedIn", href: profile.links.linkedin },
    { label: "Email", href: isTodo(profile.links.email) ? profile.links.email : `mailto:${profile.links.email}` },
    { label: "X", href: profile.links.x },
  ].filter((l) => l.href && showValue(l.href));

  return (
    <>
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-text">
            <p className="eyebrow">{profile.role}</p>
            <h1>
              Hi, I&apos;m {profile.name}.<br />
              <span className="grad">I build AI that runs where you are.</span>
            </h1>
            <p className="lead">{profile.headline}</p>
            {showValue(profile.availability) && <p className={isTodo(profile.availability) ? "todo" : "muted"}>{profile.availability}</p>}
            <div className="hero-cta">
              <Link className="btn" href="/#projects">
                See projects
              </Link>
              <AskButton className="btn ghost">Ask what I can do ✦</AskButton>
              {profile.cv && (
                <a className="btn ghost" href={asset(profile.cv)}>
                  Download CV
                </a>
              )}
            </div>
          </div>
          <div className="hero-art" aria-hidden>
            <div className="orb" />
            <div className="term">
              <div className="term-bar">
                <i />
                <i />
                <i />
              </div>
              <pre>
                <span className="m"># permission-aware RAG, local model</span>{"\n"}
                <span className="c">$</span> rag-vault ask --role reader{"\n"}
                <span className="m"># scan an MCP server before installing it</span>{"\n"}
                <span className="c">$</span> agent-shield scan ./mcp-server{"\n"}
                <span className="m"># does a restored KV cache cut TTFT?</span>{"\n"}
                <span className="c">$</span> kv-lab bench --restore-slot
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section">
        <div className="wrap about">
          <div className="avatar">
            {profile.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset(profile.photo)} alt={profile.name} />
            ) : (
              <span>{profile.name.slice(0, 1)}</span>
            )}
          </div>
          <div>
            <h2>About</h2>
            <div className="prose" dangerouslySetInnerHTML={{ __html: getAboutHtml() }} />
            {showValue(profile.location) && <p className={isTodo(profile.location) ? "todo" : "muted"}>📍 {profile.location}</p>}
          </div>
        </div>
      </section>

      <section id="stack" className="section alt">
        <div className="wrap">
          <h2>Tech stack</h2>
          <div className="stack">
            {stack.map((g) => (
              <div key={g.group} className="stack-group">
                <h3>{g.group}</h3>
                <ul className="tags">
                  {g.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="projects" className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Projects</h2>
            <p className="muted">Local-first AI: every model runs on-device. Click a project for details.</p>
          </div>
          <div className="grid">
            {projects.map((p) => (
              <ProjectCard key={p.slug} p={p} />
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="section alt">
        <div className="wrap contact">
          <h2>Let&apos;s build something</h2>
          <p className="muted">Questions about a project or want to work together? Reach out — or ask the chat first.</p>
          <div className="hero-cta center">
            {links.map((l) =>
              isTodo(l.href) ? (
                <span key={l.label} className="todo">
                  {l.label}: {l.href}
                </span>
              ) : (
                <a key={l.label} className="btn ghost" href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {l.label}
                </a>
              ),
            )}
            <AskButton className="btn">Ask the AI ✦</AskButton>
          </div>
        </div>
      </section>
    </>
  );
}
