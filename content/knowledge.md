---
title: About Eyad
href: /#about
---

<!--
This file feeds the "Ask what Eyad can do" chat and the About section.
Everything under a TODO heading is a placeholder: replace it with real facts, then run `npm run embed`.
Never put anything here you would not want a recruiter to read.
-->

## Who is Eyad

Eyad is an AI developer who builds local-first AI systems: retrieval-augmented generation (RAG), AI agents, LLM inference optimisation (KV cache) and AI security tooling, plus the web and mobile front ends that make them usable.

All of the AI projects in this portfolio run on local models (Ollama, llama.cpp, MLX) on an Apple Silicon Mac — no paid cloud LLM API. Even this chat runs a small language model inside the visitor's browser.

## Bio

TODO: Eyad's short bio (2–4 sentences): background, focus areas, and the kind of work Eyad is looking for. The chat will only know what is written here.

## Experience

TODO: Eyad's work experience (company, role, dates, 1–2 lines each). Leave empty rather than guess.

## Education

TODO: Eyad's education (degree, school, year).

## What Eyad can do

- **RAG systems:** document parsing, chunking, embeddings, vector + BM25 hybrid search, citations, permission-aware retrieval (filter before retrieval so nothing leaks), knowledge graphs from extracted entities.
- **Machine learning with PyTorch:** text classifiers (TF-IDF baselines, MLPs on frozen embeddings, fine-tuned small transformers) trained on Apple MPS, evaluated with accuracy and F1.
- **LLM inference:** running local models with Ollama, llama.cpp and MLX; KV-cache save/restore and transfer experiments; measuring time-to-first-token, memory and output equality.
- **AI agents:** tool-using coding/task agents, sandboxed shell, evaluation on fixed task sets against baselines.
- **AI security:** scanning skills, MCP servers, agents and model files for prompt injection, tool poisoning, unsafe pickles and data exfiltration; SARIF output for GitHub code scanning.
- **MCP (Model Context Protocol):** building and auditing MCP servers and tools.
- **Automation:** Telegram bots, Gmail and Google Calendar assistants, macOS launchd jobs.
- **Front end and apps:** Next.js / React web apps, React Native (Expo) mobile apps for iOS and Android, Electron + Three.js desktop apps.

## Tech stack

Python, PyTorch, FastAPI, uv, Ollama, llama.cpp, MLX, LanceDB, NetworkX, SQLite, TypeScript, Next.js, React, React Native / Expo, Electron, Three.js, WebGPU / WebLLM, transformers.js, Firebase.

## How this chat works

This chat runs entirely in your browser. The portfolio text is split into chunks and embedded at build time with the all-MiniLM-L6-v2 sentence-embedding model. When you ask a question, your question is embedded in the browser, the closest chunks are retrieved, and a small local language model (Qwen2.5 0.5B/1.5B Instruct via WebLLM on WebGPU) writes the answer from them. Nothing is sent to a server. On devices without WebGPU, the chat answers with the best matching passages instead.

## Contact

TODO: how to contact Eyad (email / LinkedIn / GitHub). The Contact section on the site reads content/profile.json.
