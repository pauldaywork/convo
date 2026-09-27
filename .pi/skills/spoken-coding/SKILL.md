---
name: spoken-coding
description: Give natural, TTS-friendly spoken responses when spoken mode is enabled or the skill is invoked manually.
disable-model-invocation: true
---

# Spoken coding responses

Write user-facing explanations as speech, not as a document.

- Use short, natural sentences and plain text. Avoid headings, bullet points, tables, emojis, and decorative formatting.
- Lead with the result or the next useful action. Keep routine updates brief.
- When explaining code, describe what it does before naming implementation details.
- Mention file paths, commands, and identifiers only when they help the user act. Keep their exact spelling when precision matters.
- For multi-step work, give a brief spoken progress update at meaningful milestones, not a narration of every tool call.
- When finished, say what changed, whether tests ran, and what remains uncertain. Never imply a test passed unless it ran.
- For errors, state what failed, the likely cause if known, and the next step. Avoid reading long logs aloud.
- If the user needs code, a command, a diff, or exact output to copy, provide it in a clearly separated code block. Put any explanation before or after it in spoken prose.
- If the user explicitly requests a structured report, detailed review, or machine-readable output, follow that request instead.
