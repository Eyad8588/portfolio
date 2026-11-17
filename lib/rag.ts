"use client";
// In-browser retrieval + generation. Nothing here talks to a server except
// downloading static files (the index, and model weights from the Hugging Face / MLC CDNs).
import { BASE } from "./base";

export type Chunk = {
  id: number;
  title: string;
  href: string;
  kind: "about" | "project" | "missing";
  heading: string;
  text: string;
  v?: number[];
};
type Index = { model: string | null; dim: number; chunks: Chunk[] };

export const LLM_MODELS = [
  { id: "Qwen2.5-0.5B-Instruct", label: "Qwen2.5 0.5B (fast, ~0.4 GB)" },
  { id: "Qwen2.5-1.5B-Instruct", label: "Qwen2.5 1.5B (better, ~1 GB)" },
] as const;

let indexP: Promise<Index> | null = null;
export function loadIndex() {
  indexP ??= fetch(`${BASE}/rag/index.json`).then((r) => {
    if (!r.ok) throw new Error(`index.json: HTTP ${r.status}`);
    return r.json();
  });
  return indexP;
}

// ---------- keyword search (BM25) — always available ----------
const STOP = new Set(
  "a an and are as at be by can could did do does for from has have he her his how i in is it its me my of on or our she so that the their them they this to was what when where which who why will with you your eyad eyads tell about".split(
    " ",
  ),
);
const tokenize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9.+#\s-]/g, " ")
    .split(/[\s-]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 ? t.replace(/(ing|es|s)$/, "") : t));

function bm25(index: Index, query: string): number[] {
  const q = tokenize(query);
  const docs = index.chunks.map((c) => tokenize(`${c.title} ${c.title} ${c.heading} ${c.text}`));
  const N = docs.length;
  const avg = docs.reduce((s, d) => s + d.length, 0) / N;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  return docs.map((d) => {
    let s = 0;
    for (const t of q) {
      const tf = d.filter((x) => x === t).length;
      if (!tf) continue;
      const idf = Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
      s += (idf * tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (d.length / avg)));
    }
    return s;
  });
}

// ---------- semantic search (transformers.js, WASM or WebGPU) ----------
type Extractor = (t: string, o: object) => Promise<{ data: Float32Array }>;
let embedP: Promise<Extractor> | null = null;
export function loadEmbedder(modelId: string, onProgress?: (pct: number) => void) {
  embedP ??= (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    const files = new Map<string, number>();
    const pipe = await pipeline("feature-extraction", modelId, {
      dtype: "q8",
      progress_callback: (p: { status: string; file?: string; progress?: number }) => {
        if (p.status === "progress" && p.file) {
          files.set(p.file, p.progress ?? 0);
          const vals = [...files.values()];
          onProgress?.(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
      },
    });
    return pipe as unknown as Extractor;
  })();
  embedP.catch(() => (embedP = null));
  return embedP;
}

export type Hit = Chunk & { score: number };

export async function search(query: string, opts: { semantic: boolean; k?: number }): Promise<Hit[]> {
  const index = await loadIndex();
  const k = opts.k ?? 4;
  const kw = bm25(index, query);
  const kwMax = Math.max(...kw, 1e-9);
  let sem: number[] | null = null;
  if (opts.semantic && index.model && embedP) {
    try {
      const extractor = await embedP;
      // same normalisation as scripts/build-index.mjs (the name is in every chunk, so it's noise)
      const q = query.replace(/\bEyad('s)?\b/gi, "").replace(/\s+/g, " ").trim() || query;
      const out = await extractor(q, { pooling: "mean", normalize: true });
      const qv = out.data;
      sem = index.chunks.map((c) => (c.v ? c.v.reduce((s, x, i) => s + x * qv[i], 0) : 0));
    } catch {
      sem = null;
    }
  }
  // if the question names a project, prefer that project's chunks
  const ql = query.toLowerCase();
  const named = new Set(
    index.chunks
      .filter((c) => c.kind === "project" && ql.includes(c.title.toLowerCase().split(" ")[0].toLowerCase()))
      .map((c) => c.title),
  );
  const scored = index.chunks.map((c, i) => {
    const kws = kw[i] / kwMax;
    const s = sem ? 0.7 * sem[i] + 0.3 * kws : kws;
    return { ...c, score: s + (named.has(c.title) ? 0.15 : 0) };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .filter((h) => h.score > (sem ? 0.2 : 0.05))
    .slice(0, k);
}

// ---------- generation (WebLLM, WebGPU only) ----------
export async function webgpuSupport(): Promise<{ ok: boolean; f16: boolean; reason?: string }> {
  const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<{ features: Set<string> } | null> } }).gpu;
  if (!gpu) return { ok: false, f16: false, reason: "This browser has no WebGPU." };
  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) return { ok: false, f16: false, reason: "No WebGPU adapter is available on this device." };
    return { ok: true, f16: adapter.features.has("shader-f16") };
  } catch (e) {
    return { ok: false, f16: false, reason: String(e) };
  }
}

type Engine = {
  chat: {
    completions: {
      create(o: object): Promise<AsyncIterable<{ choices: { delta: { content?: string } }[] }>>;
    };
  };
  interruptGenerate(): void;
};
let engineP: Promise<Engine> | null = null;
let engineModel = "";

export function loadLLM(base: string, f16: boolean, onProgress: (pct: number, text: string) => void) {
  const id = `${base}-${f16 ? "q4f16_1" : "q4f32_1"}-MLC`;
  if (engineP && engineModel === id) return engineP;
  engineModel = id;
  engineP = (async () => {
    onProgress(0, "Loading the model runtime…");
    const webllm = await import("@mlc-ai/web-llm");
    // Prefer the model library self-hosted in public/webllm/ (npm run fetch-llm-libs);
    // fall back to WebLLM's default GitHub URL if it isn't there.
    let appConfig = webllm.prebuiltAppConfig;
    const rec = appConfig.model_list.find((m) => m.model_id === id);
    if (rec) {
      const local = `${location.origin}${BASE}/webllm/${webllm.modelVersion}/${rec.model_lib.split("/").pop()}`;
      const head = await fetch(local, { method: "HEAD" }).catch(() => null);
      if (head?.ok)
        appConfig = { ...appConfig, model_list: appConfig.model_list.map((m) => (m.model_id === id ? { ...m, model_lib: local } : m)) };
    }
    const engine = await webllm.CreateMLCEngine(id, {
      appConfig,
      initProgressCallback: (r: { progress: number; text: string }) => onProgress(r.progress, r.text),
    });
    return engine as unknown as Engine;
  })();
  engineP.catch(() => {
    engineP = null;
    engineModel = "";
  });
  return engineP;
}

const SYSTEM = `You are the assistant on Eyad's portfolio website. Eyad is an AI developer.
Answer the visitor's question using ONLY the context below, which comes from Eyad's portfolio.
Rules:
- Be concise: 2-5 sentences or a short bullet list.
- Use only facts stated in the context. Never invent employers, companies, jobs, schools, dates, numbers, results or links.
- If the context does not answer the question, reply: "I don't have that information on this site — please ask Eyad directly."
- Refer to Eyad by name, not with pronouns.`;

export async function* generate(question: string, hits: Hit[], history: { role: "user" | "assistant"; content: string }[]) {
  const engine = await engineP!;
  const context = hits.map((h, i) => `[${i + 1}] ${h.title} — ${h.heading}\n${h.text}`).join("\n\n");
  const stream = await engine.chat.completions.create({
    stream: true,
    temperature: 0.2,
    max_tokens: 320,
    messages: [
      { role: "system", content: `${SYSTEM}\n\nContext:\n${context || "(nothing relevant found)"}\n\nRemember: answer only from the context above.` },
      ...history.slice(-4),
      { role: "user", content: question },
    ],
  });
  for await (const part of stream) {
    const t = part.choices[0]?.delta?.content;
    if (t) yield t;
  }
}

export function stopGeneration() {
  engineP?.then((e) => e.interruptGenerate()).catch(() => {});
}

/** Answer without an LLM: the best matching passages, lightly formatted. */
export function extractiveAnswer(hits: Hit[]): string {
  if (hits[0]?.kind === "missing") return hits[0].text;
  hits = hits.filter((h) => h.kind !== "missing");
  if (!hits.length)
    return "I couldn't find that in Eyad's portfolio. Try asking about a project (RAG Vault, Agent Shield, KV Lab, LiveMock 3D…) or Eyad's skills — or use the contact links.";
  const top = hits.slice(0, 2);
  return top
    .map((h) => {
      const text = h.text.length > 520 ? h.text.slice(0, 520).replace(/\s+\S*$/, "") + "…" : h.text;
      return `**${h.title} — ${h.heading}**\n${text}`;
    })
    .join("\n\n");
}
