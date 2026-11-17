"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BASE } from "@/lib/base";
import {
  LLM_MODELS,
  extractiveAnswer,
  generate,
  loadEmbedder,
  loadIndex,
  loadLLM,
  search,
  stopGeneration,
  webgpuSupport,
  type Hit,
} from "@/lib/rag";

type Msg = { role: "user" | "assistant"; content: string; sources?: Hit[]; mode?: "ai" | "search" };
type LLMState =
  | { s: "idle" }
  | { s: "unsupported"; reason: string }
  | { s: "loading"; pct: number; text: string }
  | { s: "ready" }
  | { s: "error"; reason: string };

const SUGGESTIONS = [
  "What can Eyad build with RAG?",
  "How does Agent Shield detect malicious MCP servers?",
  "What is KV Lab measuring?",
  "Which projects use PyTorch?",
  "What is LiveMock 3D?",
];

/** Tiny, safe markdown: escape everything, then bold, inline code, bullets, line breaks. */
function md(s: string) {
  const esc = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^\s*[-*] (.*)$/gm, "• $1")
    .replace(/\n/g, "<br/>");
}

export default function Chat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [semReady, setSemReady] = useState(false);
  const [semPct, setSemPct] = useState(0);
  const [llm, setLlm] = useState<LLMState>({ s: "idle" });
  const [model, setModel] = useState<string>(LLM_MODELS[0].id);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pending = useRef<string | null>(null);

  // open from anywhere: window.dispatchEvent(new CustomEvent("open-chat", { detail: "question?" }))
  useEffect(() => {
    const h = (e: Event) => {
      setOpen(true);
      const q = (e as CustomEvent<string | undefined>).detail;
      if (q) pending.current = q;
    };
    window.addEventListener("open-chat", h);
    return () => window.removeEventListener("open-chat", h);
  }, []);

  // when opened: fetch the index, start the small embedding model, check WebGPU
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    loadIndex()
      .then((idx) => {
        if (!idx.model) return;
        return loadEmbedder(idx.model, (p) => setSemPct(p)).then(() => setSemReady(true));
      })
      .catch(() => setSemReady(false));
    if (llm.s === "idle")
      webgpuSupport().then((g) => {
        if (!g.ok) setLlm({ s: "unsupported", reason: g.reason ?? "WebGPU unavailable" });
      });
    const close = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const enableAI = async () => {
    const g = await webgpuSupport();
    if (!g.ok) return setLlm({ s: "unsupported", reason: g.reason ?? "WebGPU unavailable" });
    setLlm({ s: "loading", pct: 0, text: "Starting…" });
    try {
      await loadLLM(model, g.f16, (pct, text) => setLlm({ s: "loading", pct, text }));
      setLlm({ s: "ready" });
    } catch (e) {
      setLlm({ s: "error", reason: e instanceof Error ? e.message : String(e) });
    }
  };

  const ask = useCallback(
    async (q: string) => {
      q = q.trim();
      if (!q || busy) return;
      setInput("");
      setBusy(true);
      const history = msgs.map(({ role, content }) => ({ role, content }));
      setMsgs((m) => [...m, { role: "user", content: q }]);
      try {
        const all = await search(q, { semantic: semReady });
        // Best match is a section Eyad hasn't filled in (bio, experience…): say so, don't let the model guess.
        const missing = all[0]?.kind === "missing";
        const hits = all.filter((h) => h.kind !== "missing");
        if (missing) {
          setMsgs((m) => [...m, { role: "assistant", content: extractiveAnswer(all), mode: "search" }]);
        } else if (llm.s === "ready") {
          setMsgs((m) => [...m, { role: "assistant", content: "", sources: hits, mode: "ai" }]);
          let acc = "";
          for await (const t of generate(q, hits, history)) {
            acc += t;
            const snap = acc;
            setMsgs((m) => [...m.slice(0, -1), { ...m[m.length - 1], content: snap }]);
          }
          if (!acc.trim())
            setMsgs((m) => [...m.slice(0, -1), { ...m[m.length - 1], content: extractiveAnswer(hits), mode: "search" }]);
        } else {
          setMsgs((m) => [...m, { role: "assistant", content: extractiveAnswer(hits), sources: hits, mode: "search" }]);
        }
      } catch (e) {
        setMsgs((m) => [...m, { role: "assistant", content: `Sorry, something went wrong: ${e instanceof Error ? e.message : e}` }]);
      } finally {
        setBusy(false);
      }
    },
    [busy, msgs, semReady, llm.s],
  );

  // run a question passed via the open-chat event once the panel is open
  useEffect(() => {
    if (open && pending.current && !busy) {
      const q = pending.current;
      pending.current = null;
      ask(q);
    }
  }, [open, ask, busy]);

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="chat-panel">
        <span className="dot" aria-hidden /> {open ? "Close chat" : "Ask what Eyad can do"}
      </button>

      {open && (
        <section id="chat-panel" className="chat-panel" role="dialog" aria-label="Ask what Eyad can do">
          <header className="chat-head">
            <div>
              <strong>Ask what Eyad can do</strong>
              <div className="chat-sub">
                Runs in your browser · nothing is sent to a server
              </div>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </header>

          <div className="chat-engine">
            {llm.s === "ready" && (
              <span className="badge ok">AI answers on · {LLM_MODELS.find((m) => m.id === model)?.label.split(" (")[0]}</span>
            )}
            {(llm.s === "idle" || llm.s === "error") && (
              <div className="engine-row">
                <select value={model} onChange={(e) => setModel(e.target.value)} aria-label="Model">
                  {LLM_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <button className="btn small" onClick={enableAI}>
                  Enable AI answers
                </button>
              </div>
            )}
            {llm.s === "error" && <p className="engine-note err">Couldn&apos;t load the model: {llm.reason}. Search answers still work.</p>}
            {llm.s === "loading" && (
              <div className="progress-wrap">
                <div className={`progress${llm.pct < 0.01 ? " indeterminate" : ""}`} role="progressbar" aria-valuenow={Math.round(llm.pct * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div style={{ width: `${Math.max(2, llm.pct * 100)}%` }} />
                </div>
                <p className="engine-note">
                  {llm.pct >= 0.01 ? `${Math.round(llm.pct * 100)}% · ` : ""}{llm.text.replace(/\[.*?\]\s*/g, "").slice(0, 90)}
                </p>
              </div>
            )}
            {llm.s === "unsupported" && (
              <p className="engine-note">
                Search mode: {llm.reason} Answers come from the best-matching parts of the portfolio instead of a language model.
              </p>
            )}
            {llm.s === "idle" && (
              <p className="engine-note">
                Answers use search until you enable the AI model (downloaded once, then cached).
                {!semReady && semPct > 0 && semPct < 100 ? ` Loading semantic search ${Math.round(semPct)}%…` : ""}
              </p>
            )}
          </div>

          <div className="chat-list" ref={listRef} aria-live="polite">
            {msgs.length === 0 && (
              <div className="chat-empty">
                <p>Ask about Eyad&apos;s projects, skills or stack. Try:</p>
                <div className="chips">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="chip" onClick={() => ask(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                {m.role === "assistant" && !m.content && busy ? (
                  <span className="typing" aria-label="Thinking">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: md(m.content) }} />
                )}
                {m.sources && m.sources.length > 0 && (
                  <div className="sources">
                    {m.mode === "search" ? "From" : "Sources"}:{" "}
                    {[...new Map(m.sources.map((s) => [s.title, s])).values()].map((s) => (
                      <a key={s.title} href={`${BASE}${s.href}`}>
                        {s.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              placeholder="Ask a question…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              aria-label="Your question"
            />
            {busy && llm.s === "ready" ? (
              <button type="button" className="btn small ghost" onClick={stopGeneration}>
                Stop
              </button>
            ) : (
              <button className="btn small" disabled={busy || !input.trim()}>
                Ask
              </button>
            )}
          </form>
        </section>
      )}
    </>
  );
}
