---
slug: rag-vault
title: RAG Vault
tagline: Permission-aware RAG with citations, a knowledge graph and a PyTorch classifier.
order: 1
status: In progress
tags: [RAG, PyTorch, LanceDB, Knowledge graph, FastAPI, Next.js]
github: https://github.com/Eyad8588/rag-vault
image: ""
video: ""
---

## Overview

RAG Vault is a knowledge base where users have roles, every answer cites its sources, and the knowledge can be explored as an interactive graph. It runs fully on local models (Qwen 3.5 via Ollama, qwen3-embedding for vectors).

## Roles and permissions

- **reader:** asks questions and only sees documents they are allowed to see.
- **editor:** adds (injects) documents.
- **admin:** removes documents and manages users and roles.
- Every add, remove and query is written to an **audit log**.

Permissions are applied *before* retrieval, so restricted chunks can never leak into an answer.

## Pipeline

Upload → parse (PDF / Markdown / text with docling) → chunk → **PyTorch classifier** labels topic and sensitivity → the label sets the default access tag → embed with qwen3-embedding → store in **LanceDB** → extract entities and relations with the local LLM → build a **graph** in SQLite / NetworkX.

Queries use hybrid search (vector + BM25) and the answer is written by the local model with citations.

## The machine-learning part

Three classifiers are compared on the same labelled dataset, reporting accuracy and F1:

1. Baseline: logistic regression on TF-IDF.
2. An MLP on frozen embeddings (PyTorch, trained on Apple MPS).
3. A small transformer fine-tuned end to end (PyTorch on MPS).

## Interface

Next.js app with login by role, upload, chat with citations, an admin panel, the audit log and an interactive graph view — click a node to see its documents.

## Results

TODO: classifier accuracy/F1 table, retrieval quality, screenshots or a LiveMock 3D video.
