---
slug: daily-pilot
title: Daily Pilot
tagline: A local-AI daily assistant — Telegram news digest, wake-up actions and a Gmail helper.
order: 2
status: In progress
tags: [Agents, Automation, Telegram, Gmail API, Local LLM]
github: https://github.com/Eyad8588/daily-pilot
image: ""
video: ""
---

## Overview

Daily Pilot is a personal assistant that runs on the Mac with a local model. It summarises the news, prepares the day and keeps an eye on email — without ever sending mail on its own.

## Telegram news digest

Fetches RSS and AI news every day, has the local LLM summarise and rank it, and a Telegram bot sends the digest at a set time (scheduled with launchd).

## Wake actions

When the Mac wakes up it runs a configured list of actions — open apps or URLs, start Ollama, send a "good morning" message with today's plan. Actions live in a YAML file with an allow-list, so nothing outside the list can run.

## Gmail assistant

- Classifies new mail as urgent / action / FYI / spam-ish with the local model.
- Sends alerts to Telegram for urgent mail.
- Turns action emails into tasks with due dates.
- Builds a morning plan from tasks and Google Calendar.
- Drafts replies only — it **never sends mail automatically**.

## Results

TODO: screenshots of a digest and a morning plan, classification accuracy on a sample inbox.
