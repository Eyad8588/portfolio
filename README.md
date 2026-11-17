# Eyad — AI Developer (portfolio)

A fast, static Next.js portfolio with an **"Ask what Eyad can do" AI chat that runs entirely in the visitor's browser**: no server, no API keys, and nothing is sent anywhere.

## Features

- **In-browser AI chat:** retrieval over the portfolio content (embeddings precomputed at build time) plus Qwen2.5 0.5B/1.5B running on WebGPU through WebLLM. The model loads lazily with a progress bar and falls back to search answers on devices without WebGPU. Sections that haven't been filled in get "not on this site yet" answers instead of guesses.
- **Pages:** hero, about, tech stack, project cards with a detail page per project, contact.
- **Theme:** dark and light, following the OS and remembering the visitor's choice. Responsive, no web fonts, static export.
- **Media:** room for LiveMock 3D videos on every project card and page.
- **Content:** everything personal lives in [`content/`](content/). Edit Markdown/JSON and rebuild.

## Tech stack

Next.js 16 (static export) · React 19 · TypeScript · plain CSS (design tokens) · [WebLLM](https://github.com/mlc-ai/web-llm) (Qwen2.5-Instruct, WebGPU) · [transformers.js](https://github.com/huggingface/transformers.js) (all-MiniLM-L6-v2 embeddings, WASM) · gray-matter + marked · GitHub Actions → GitHub Pages

## Screenshots

<!-- TODO: add screenshots to docs/screenshots/ and link them here -->
- TODO: home page (dark)
- TODO: home page (light)
- TODO: project detail page
- TODO: chat answering a question (AI mode)
- TODO: mobile view

## Quick start

```bash
npm install
npm run fetch-llm-libs   # once: self-host WebLLM's small model-library .wasm files (optional, recommended)
npm run dev              # http://localhost:3000 (rebuilds the chat index first)
```

Production build (static files in `out/`):

```bash
npm run build
npm start                # serves out/ on http://localhost:3000
```

Requires Node 20+. The first build downloads the 23 MB embedding model (`Xenova/all-MiniLM-L6-v2`) into the local Hugging Face cache; later builds are offline. No network? `npm run build:keyword-only` builds a keyword-search-only chat index.

## How the chat works

```
build time (Node)                         visitor's browser
──────────────────                        ─────────────────────────────────────────────
content/knowledge.md  ─┐                  public/rag/index.json  (chunks + vectors)
content/projects/*.md ─┴─► chunk ─► embed ─►        │
   (scripts/build-index.mjs,                         ▼
    all-MiniLM-L6-v2, 384-d)              question ─► embed (transformers.js, WASM) ─┐
                                                      BM25 keyword score ────────────┴─► top chunks
                                                                                         │
                                          WebGPU? ──yes──► Qwen2.5 0.5B/1.5B (WebLLM) ─► grounded answer + sources
                                                  └─no───► best-matching passages + sources (search mode)
```

- **Retrieval:** hybrid — 70% cosine similarity on precomputed embeddings + 30% BM25. Works on every device. Lines containing `TODO` are never indexed, so placeholders can't leak into answers.
- **Generation:** [WebLLM](https://github.com/mlc-ai/web-llm) runs Qwen2.5-0.5B-Instruct (≈0.4 GB, default) or 1.5B (≈1 GB) on WebGPU. It is loaded **only when the visitor clicks "Enable AI answers"**, with a progress bar, and cached by the browser afterwards. It picks the `q4f16` build when the GPU supports `shader-f16`, otherwise `q4f32`.
- **Fallback:** without WebGPU (older Safari/Firefox, some phones) the chat stays in search mode and answers with the most relevant passages plus links.
- The system prompt forbids inventing facts; the model only sees retrieved portfolio text.
- Downloads: page JS is small; the chat's libraries are code-split and fetched only when the chat opens. Model weights come from Hugging Face; the WebLLM model-library `.wasm` is served from `public/webllm/` when you ran `npm run fetch-llm-libs` (otherwise from GitHub).

## Updating content

| What | Where |
|---|---|
| Name, headline, photo, CV, links | `content/profile.json` |
| About / bio / experience / education (also the chat's knowledge) | `content/knowledge.md` |
| Tech stack groups | `content/stack.json` |
| Projects (one file each; front matter = card, body = detail page + chat knowledge) | `content/projects/<slug>.md` |
| Images / videos | `public/media/` |

Placeholders start with `TODO`. In `npm run dev` they show as yellow dashed boxes so you can see what's missing; **in the production build they are hidden** (and never indexed by the chat).

**Regenerate the chat embeddings** after editing anything in `content/`:

```bash
npm run embed     # also runs automatically before `npm run dev` and `npm run build`
```

### Adding a project

Create `content/projects/my-project.md`:

```markdown
---
slug: my-project
title: My Project
tagline: One line that sells it.
order: 8
status: In progress
tags: [PyTorch, RAG]
github: https://github.com/<you>/my-project
image: /media/my-project.jpg        # card + page image (optional; a gradient cover is used otherwise)
video: /media/my-project.mp4        # e.g. a LiveMock 3D export; autoplays muted on the card (optional)
gallery: [/media/a.jpg, /media/b.jpg]  # extra screenshots on the detail page (optional)
---

## Overview
...
```

### LiveMock 3D videos

Export a short clip (H.264 MP4, ~1280×720, < 5 MB, no audio), put it in `public/media/`, and set `video:` in the project's front matter. The `image:` is used as the poster frame. The LiveMock card currently uses app screenshots as placeholders.

## Deploy

### Vercel
Import the repo in Vercel — framework preset **Next.js**, defaults are fine (`npm run build`, output `out/` is detected via `output: "export"`). The build downloads the embedding model the first time (needs network).

### GitHub Pages
1. Settings → Pages → Source: **GitHub Actions**.
2. Add `.github/workflows/pages.yml` (already in this repo). It builds with `NEXT_PUBLIC_BASE_PATH=/<repo-name>` so links work under `https://<user>.github.io/<repo-name>/`. For a `<user>.github.io` repo, delete that env line.
3. Push to `main`. (GitHub Pages on a **private** repo needs a paid GitHub plan; make the repo public or use Vercel.)

Any static host works: upload `out/`. WebGPU needs HTTPS (or localhost).

## Project layout

```
app/                 pages (home, /projects/[slug]) + global CSS
components/          Chat, ProjectCard, Media, ThemeToggle, AskButton
lib/content.ts       reads content/ at build time (server only)
lib/rag.ts           in-browser retrieval (BM25 + embeddings) and WebLLM generation
scripts/build-index.mjs        content → public/rag/index.json
scripts/fetch-webllm-libs.mjs  WebLLM model libraries → public/webllm/
content/             everything personal — edit this
public/media/        images and videos
```
