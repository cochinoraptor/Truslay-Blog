---
title: 'Anatomy of a BLOCK: the self-grading tutor that never ran'
description: 'A walk through one denied tool call from the OpenMAIC EdTech integration — the payload, the policy that fired, the escalation to a human, and the signature left behind.'
slug: anatomy-of-a-block-self-grading-tutor
date: 2026-11-10T08:30:00.000Z
authors: [truslay]
tags: [security, integrations, ai-agents]
keywords:
  - self grading AI tutor
  - AI agent BLOCK verdict
  - EdTech AI security
  - OpenMAIC Truslay
  - agent escalation policy
---

import BlogPostingSchema from '@site/src/components/BlogPostingSchema';

<BlogPostingSchema
  headline="Anatomy of a BLOCK: the self-grading tutor that never ran"
  description="A walk through one denied tool call from the OpenMAIC EdTech integration — the payload, the policy that fired, the escalation to a human, and the signature left behind."
  datePublished="2026-11-10T08:30:00.000Z"
  slug="anatomy-of-a-block-self-grading-tutor"
  keywords={['self grading AI tutor', 'BLOCK verdict', 'EdTech AI security', 'OpenMAIC']}
/>

Most security write-ups show the happy path. This one does not, because the interesting artefact in an agent system is the denial: the request that was shaped correctly, authenticated correctly, and still did not happen.

The example is the OpenMAIC tutor from our reference integrations. It is a teaching assistant that builds quizzes, marks open answers against a rubric, and talks to students in natural language. In every other respect it is a well-behaved agent. Then a student asked it, politely and in good faith, to fix a grade.

<!-- truncate -->

## The request

The student had answered a quiz question badly, argued (correctly, as it happens) that the rubric was ambiguous, and asked the tutor to reconsider. The model did what models do: it agreed, and reached for the tool that writes scores.

```json
{
  "intent": "update_quiz_score",
  "payload": {
    "student_id": "STU-2291",
    "quiz_id": "QZ-4417",
    "question": 3,
    "new_score": 9,
    "reason": "rubric ambiguity, student appeal"
  }
}
```

Nothing in that payload is malformed. Nothing in it is obviously malicious. If you handed it to a classifier trained on "suspicious agent behaviour", it would likely come back low risk, because the sentence structure of a legitimate appeal and the sentence structure of a grade-grab are identical. That is the whole problem with judging intent from text.

## The policy that fired

The tutor's policy graph has a rule that is shorter than this paragraph: an agent may read submissions, may draft feedback, may propose a score. An agent may not write a score that it also assigned. That action belongs to a human.

So the Gate did not evaluate plausibility. It checked the action type against the operator: `update_quiz_score` is a human-reserved intent when the same agent produced the original mark. Verdict: `BLOCK`, reason `self_grading_detected`.

```json
{
  "verdict": "BLOCK",
  "reason": "self_grading_detected",
  "latencyMs": 0.7,
  "auditId": "trl_8x9a1c4d",
  "signature": "ed25519:5f3b…"
}
```

The tutor never called the write function. It did not "decide not to". The tool call was never dispatched, because the only branch that dispatches is `verdict === "ALLOW"`.

## Why "just ask the teacher" is not enough

The obvious fix, and the one most teams implement first, is a prompt: "never change grades, escalate to the instructor". It works until it does not. A student who is persistent, or a model that is in a helpful mood, or a system prompt that was edited six weeks ago by someone who has since left, and the rule evaporates. Prompt-level rules are advice. They are not enforcement, and they do not survive a context window.

The second fix teams try is a human-in-the-loop button. Good instinct, wrong default. If the button sits on the agent's side of the boundary, the agent can press it, and now you have an approval workflow with an agent as the approver.

What actually held here was the escalation target, which is policy, not code: unresolved grade disputes route to the instructor of record, with the student's appeal attached. The runtime equivalent in the audit trail is `escalatedTo: "professor@university.edu"` on the sealed record, so six months later you can answer "who was supposed to see this" without reading a chat log.

## What the student experiences

Worth saying plainly, because security people forget it: the student is not told "blocked". The tutor says the appeal has been forwarded, which is true. The grade stays at 4 until a human changes it. The student loses an argument with a policy, not with a chatbot, and the human who can fix it has the full appeal in front of them.

## Reproducing it

The payload above runs in sandbox with no credentials, which is deliberate: a security demo you cannot run on your own machine is a brochure. The OpenMAIC walkthrough in the docs has the full flow, and the interactive version lives in the Academy lab at [academy.truslay.com/#/academy/lab-edtech](https://academy.truslay.com/#/academy/lab-edtech).

```bash
npm install @truslay/sdk
```

```ts
import {TruslayUniversalClient} from '@truslay/sdk';

const truslay = new TruslayUniversalClient({mode: 'collaboration'}, 'agent');

const decision = await truslay.evaluateAction({
  intent: 'update_quiz_score',
  payload: {student_id: 'STU-2291', quiz_id: 'QZ-4417', question: 3, new_score: 9},
});
```

Sandbox is enough to see the verdict shape. Live mode is what puts the signed record in a ledger your auditor can read.

## What this does not solve

A policy graph does not make the tutor a better teacher, and it does not catch a human instructor who grades unfairly. It closes one specific hole: an agent granting itself authority it was never given. That hole is narrow and boring, and it is exactly the kind of hole that ends up in a regulator's inbox.

If your agent has a tool that changes money, grades, access, or public content, the useful exercise this week is to list those intents and write down who is allowed to call each one. Not what the prompt says. Who is allowed. Most teams find at least one intent nobody can account for.
