import { asset } from "@/lib/base";
import type { Project } from "@/lib/content";

const HUES: Record<string, number> = { "rag-vault": 265, "daily-pilot": 200, "agent-shield": 350, "kv-lab": 160, "deepseek-agent": 225, "livemock-3d": 30, "diary-app": 300 };

/**
 * Project visual. Priority: video (e.g. an exported LiveMock 3D clip) > image > generated cover.
 * To add a video: put it in public/media/ and set `video: /media/x.mp4` in the project's front matter.
 */
export default function Media({ p, large = false }: { p: Project; large?: boolean }) {
  const cls = `media${large ? " large" : ""}`;
  if (p.video)
    return (
      <div className={cls}>
        <video src={asset(p.video)} poster={p.image ? asset(p.image) : undefined} autoPlay muted loop playsInline preload="metadata" />
      </div>
    );
  if (p.image)
    return (
      <div className={cls}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(p.image)} alt={`${p.title} screenshot`} loading="lazy" decoding="async" />
      </div>
    );
  const h = HUES[p.slug] ?? 250;
  return (
    <div className={`${cls} cover`} style={{ "--h": h } as React.CSSProperties} aria-hidden>
      <span>{p.title}</span>
    </div>
  );
}
