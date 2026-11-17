// Server-only helpers that read content/ at build time.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const CONTENT = path.join(process.cwd(), "content");
export const IS_DEV = process.env.NODE_ENV === "development";

/** A value is a placeholder when it is empty or starts with TODO. */
export const isTodo = (v?: string | null) => !v || /^\s*TODO/.test(v);
/** Placeholders are visible while developing (so Eyad sees what to fill) and hidden in production. */
export const showValue = (v?: string | null) => !isTodo(v) || IS_DEV;

export type Profile = {
  name: string;
  fullName: string;
  role: string;
  headline: string;
  location: string;
  availability: string;
  photo: string;
  cv: string;
  links: { github: string; linkedin: string; email: string; x: string };
};

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  order: number;
  status: string;
  tags: string[];
  github: string;
  image: string;
  gallery: string[];
  video: string;
  html: string;
};

export function getProfile(): Profile {
  return JSON.parse(fs.readFileSync(path.join(CONTENT, "profile.json"), "utf8"));
}

export function getStack(): { group: string; items: string[] }[] {
  return JSON.parse(fs.readFileSync(path.join(CONTENT, "stack.json"), "utf8"));
}

/** Markdown -> HTML. Lines starting with "TODO" become a dev-only callout and disappear in production. */
function render(md: string): string {
  const body = md
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .map((l) => (/^\s*TODO\b/.test(l) ? (IS_DEV ? `<p class="todo">${l.trim()}</p>` : "") : l))
    .join("\n");
  // drop headings whose section became empty in production
  const html = marked.parse(body, { async: false }) as string;
  return html.replace(/<h2[^>]*>[^<]*<\/h2>\s*(?=<h2|$)/g, "");
}

export function getProjects(): Project[] {
  const dir = path.join(CONTENT, "projects");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
      return {
        slug: data.slug,
        title: data.title,
        tagline: data.tagline,
        order: data.order ?? 99,
        status: data.status ?? "",
        tags: data.tags ?? [],
        github: data.github ?? "",
        image: data.image ?? "",
        gallery: data.gallery ?? [],
        video: data.video ?? "",
        html: render(content),
      } as Project;
    })
    .sort((a, b) => a.order - b.order);
}

export function getProject(slug: string) {
  return getProjects().find((p) => p.slug === slug);
}

/** About section: the named sections of knowledge.md, rendered. */
export function getAboutHtml(): string {
  const { content } = matter(fs.readFileSync(path.join(CONTENT, "knowledge.md"), "utf8"));
  const keep = ["Who is Eyad", "Bio", "Experience", "Education"];
  const parts = content.split(/^## /m).slice(1);
  const md = parts
    .filter((s) => keep.includes(s.split("\n")[0].trim()))
    .map((s) => {
      const [h, ...rest] = s.split("\n");
      return h.trim() === "Who is Eyad" ? rest.join("\n") : `## ${h}\n${rest.join("\n")}`;
    })
    .join("\n");
  return render(md);
}
