---
slug: kv-lab
title: KV Lab
tagline: Experiments on saving and transferring the LLM KV cache on Apple Silicon.
order: 4
status: In progress
tags: [LLM inference, KV cache, llama.cpp, MLX, Benchmarks]
github: "TODO: https://github.com/<eyad>/kv-lab"
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

TODO: TTFT speed-up chart, file sizes, equality check results.
