---
slug: kv-lab
title: KV Lab
tagline: "Save an LLM's KV cache and restore it in a new process — up to 207× faster time to first token on a MacBook."
order: 4
status: In progress
tags: [LLM inference, KV cache, llama.cpp, MLX, Benchmarks]
github: https://github.com/Eyad8588/kv-lab
image: ""
video: ""
---

## Overview

KV Lab tests whether saving the KV cache after a long prompt and loading it into another run — or another machine — speeds up inference, and what it costs.

## Experiments

- **llama.cpp:** `llama-server --slot-save-path` saves a slot after a long prompt; a new server process restores it.
- **MLX:** save and load the prompt cache with `mlx-lm`.
- Optional: transfer the cache over the network to another machine.
- **vLLM** is kept as a comparison for an NVIDIA GPU box, since on the Mac it is CPU-only / experimental.

## What is measured

Time to first token, memory, cache file size, and output equality between cached and uncached runs. Everything is scripted so the runs are repeatable, and results are published as a charted report.

## Results

- Restoring a saved KV cache instead of recomputing the prompt: **22× faster first token at 4k tokens, 90× at 16k and 207× at 32k** (llama.cpp, Qwen2.5-0.5B). MLX reaches 72× at 32k.
- Restoring is cheap: a 384 MiB cache loads in 48 ms; a 1.8 GiB MLX cache in 0.57 s.
- Correctness: the restored cache gave the same greedy output as the in-memory cache in **51/51** runs.
- Full tables: [kv-lab README](https://github.com/Eyad8588/kv-lab#results).
