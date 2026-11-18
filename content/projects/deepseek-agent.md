---
slug: deepseek-agent
title: DeepSeek Agent
tagline: A coding / task agent on the DeepSeek harness, running a local DeepSeek model.
order: 5
status: Research
tags: [Agents, DeepSeek, Local LLM, Evaluation]
github: https://github.com/Eyad8588/deepseek-agent
image: ""
video: ""
---

## Overview

An agent built on the DeepSeek agent harness, running a local DeepSeek model (a distilled model that fits in 16 GB of memory).

## Plan

- Tools: files, a sandboxed shell, and RAG Vault search.
- Tested on a fixed task set; success rate and speed are compared against a plain baseline agent.
- Agent Shield is run against it as a security test.

## Results

- With `qwen3.5:9b` on 10 tasks: the DeepSeek Harness agent and a plain tool-calling loop both pass **10/10**; Harness takes about 1.9× the baseline's median time (79.7 s vs 42.5 s per task).
- Harness runs fully offline against Ollama, and its full-access shell is removed with a two-line patch.
- Full tables: [deepseek-agent README](https://github.com/Eyad8588/deepseek-agent#results).
