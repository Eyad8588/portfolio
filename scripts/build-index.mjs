// Builds public/rag/index.json for the in-browser chat:
// content/knowledge.md + content/projects/*.md -> chunks -> embeddings (all-MiniLM-L6-v2).
// Run: npm run embed            (with embeddings)
//      npm run embed -- --no-embeddings   (keyword-only index, no model download)
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const EMBED_MODEL = "Xenova/all-MiniLM-L6-v2";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CONTENT = path.join(ROOT, "content");
const OUT = path.join(ROOT, "public", "rag", "index.json");
const MAX_CHARS = 900;

const MISSING_HINT = {
  Bio: "personal background, biography, where Eyad is from, age",
  Experience: "work experience, jobs, employers, companies worked at, roles, years of experience, work history",
  Education: "education, degree, university, school, studies, graduation",
  Contact: "email address, phone, how to contact or hire Eyad",
};

function contactChunk() {
  const p = JSON.parse(fs.readFileSync(path.join(CONTENT, "profile.json"), "utf8"));
  const real = (v) => v && !/^\s*TODO/.test(v);
  const links = Object.entries(p.links || {}).filter(([, v]) => real(v));
  if (!links.length) return null;
  const extra = [real(p.location) && `Location: ${p.location}.`, real(p.availability) && `Availability: ${p.availability}.`].filter(Boolean);
  return { heading: "Contact", text: [`You can reach Eyad via ${links.map(([k, v]) => `${k}: ${v}`).join(", ")}.`, ...extra].join(" ") };
}

// The name appears in almost every chunk and question, so it only adds noise to the vectors.
// The browser strips it from questions the same way (lib/rag.ts).
export const stripName = (s) => s.replace(/\bEyad('s)?\b/gi, "").replace(/\s+/g, " ").trim();
const embedText = (c) => stripName(c.embedText ?? `${c.title} — ${c.heading}. ${c.text}`);

const isTodo = (s) => /^\s*(TODO\b|<!--)/.test(s) || /TODO:/.test(s);

function clean(md) {
  return md
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .filter((l) => !isTodo(l))
    .join("\n")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLong(text) {
  if (text.length <= MAX_CHARS) return [text];
  const parts = [];
  let cur = "";
  for (const para of text.split(/\n(?=- |\d+\. |\n)/)) {
    if ((cur + "\n" + para).length > MAX_CHARS && cur) {
      parts.push(cur.trim());
      cur = "";
    }
    cur += "\n" + para;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function chunkFile(file, kind) {
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const title = data.title;
  const href = kind === "project" ? `/projects/${data.slug}/` : data.href || "/";
  const chunks = [];
  if (kind === "project") {
    const gh = data.github && !String(data.github).includes("TODO") ? `\nCode: ${data.github}` : "";
    chunks.push({
      heading: "Summary",
      text: `${title}: ${data.tagline}\nStatus: ${data.status}. Technologies: ${(data.tags || []).join(", ")}.${gh}`,
    });
  }
  for (const section of content.split(/^## /m).slice(1)) {
    const [heading, ...rest] = section.split("\n");
    const body = clean(rest.join("\n"));
    if (!body && kind === "about" && heading.trim() === "Contact") {
      const c = contactChunk();
      if (c) {
        chunks.push(c);
        continue;
      }
    }
    if (!body) {
      // A section that is still a TODO becomes an explicit "not provided" chunk, so the chat
      // says so instead of letting the small model guess (e.g. inventing employers).
      if (kind === "about")
        chunks.push({
          heading: heading.trim(),
          kind: "missing",
          embedText: `${heading.trim()}: ${MISSING_HINT[heading.trim()] ?? ""}`,
          text: `Eyad hasn't added this to the portfolio yet (${MISSING_HINT[heading.trim()] ?? heading.trim().toLowerCase()}), so I can't answer that.${heading.trim() === "Contact" ? "" : " Please ask Eyad directly."}`,
        });
      continue;
    }
    for (const part of splitLong(body)) chunks.push({ heading: heading.trim(), text: part });
  }
  return chunks.map((c) => ({
    title,
    href,
    kind: c.kind ?? kind,
    heading: c.heading,
    text: c.text,
    embedText: c.embedText,
  }));
}

async function main() {
  const noEmbed = process.argv.includes("--no-embeddings");
  const files = [[path.join(CONTENT, "knowledge.md"), "about"]];
  for (const f of fs.readdirSync(path.join(CONTENT, "projects")).sort())
    if (f.endsWith(".md")) files.push([path.join(CONTENT, "projects", f), "project"]);

  const chunks = files.flatMap(([f, k]) => chunkFile(f, k)).map((c, i) => ({ id: i, ...c }));

  let model = null;
  let dim = 0;
  if (!noEmbed) {
    try {
      const { pipeline } = await import("@huggingface/transformers");
      const extractor = await pipeline("feature-extraction", EMBED_MODEL, { dtype: "q8" });
      for (const c of chunks) {
        const out = await extractor(embedText(c), { pooling: "mean", normalize: true });
        c.v = Array.from(out.data, (x) => Math.round(x * 1e4) / 1e4);
      }
      dim = chunks[0].v.length;
      model = EMBED_MODEL;
    } catch (err) {
      console.warn(`[embed] Could not compute embeddings (${err.message}). Writing a keyword-only index.`);
      for (const c of chunks) delete c.v;
    }
  }

  for (const c of chunks) delete c.embedText;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ model, dim, builtAt: new Date().toISOString(), chunks }));
  console.log(`[embed] ${chunks.length} chunks from ${files.length} files -> public/rag/index.json (${model ? `embeddings: ${model}` : "keyword-only"})`);
}

main();
