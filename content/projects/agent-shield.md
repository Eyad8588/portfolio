---
slug: agent-shield
title: Agent Shield
tagline: A security scanner for AI skills, MCP servers, agents and model files — 100% precision and recall on its test corpus.
order: 3
status: In progress
tags: [AI security, MCP, Prompt injection, SARIF, Python]
github: https://github.com/Eyad8588/agent-shield
image: ""
video: ""
---

## Overview

Agent Shield is a CLI that checks AI components before you install or run them and produces a score plus findings as HTML and SARIF (so results show up in GitHub code scanning).

## What it checks

- **Skills (SKILL.md + scripts):** hidden instructions, invisible Unicode, prompt injection, `curl | sh`, exfiltration URLs, reading secrets or SSH keys, excessive file access.
- **MCP servers:** tool-description poisoning, tool-name shadowing, over-broad permissions, unpinned packages, risky shell or network use.
- **Agents:** configuration review (auto-approve, unrestricted shell) and a **runtime test** that runs the agent in a sandbox against a prompt-injection test set and records what it tried to do.
- **Model files:** unsafe pickle in `.pt` / `.bin` files (flags code execution and prefers safetensors), plus hash and source checks.

## How it decides

Fast static rules run first; a local-LLM judge handles the fuzzy cases.

## Evaluation

The scanner is tested on a set of deliberately malicious sample skills and MCP servers plus clean ones, and precision / recall are reported.

## Results

- On 29 malicious and 13 clean samples: static rules alone reach **0.94 precision / 1.00 recall**; with the local `qwen3.5:4b` judge, **1.00 / 1.00** (the judge clears the 2 false positives).
- Judge hardening: with hardening off, the judge downgraded 3 of 30 real malicious findings; with it on, **0 of 30**.
- Runtime harness: a `qwen3.5:4b` agent was compromised by 1 of 8 injection cases.
- Full tables: [agent-shield README](https://github.com/Eyad8588/agent-shield#evaluation).
