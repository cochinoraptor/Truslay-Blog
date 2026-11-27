---
title: 'A verdict is not a probability: why we deleted the score'
description: 'Probabilistic guardrails hand you a number and hope you picked the right threshold. A policy graph returns ALLOW, REVIEW or BLOCK, and can prove it.'
slug: deterministic-verdicts-not-probability
date: 2026-11-18T09:00:00.000Z
image: /img/og/deterministic-verdicts-not-probability.png
authors: [truslay]
tags: [architecture, security]
keywords:
  - deterministic AI guardrails
  - fail-closed AI agents
  - policy graph evaluation
  - AI agent tool call security
  - ALLOW REVIEW BLOCK verdict
---

The first internal build of Truslay returned a score. Something between 0 and 1, higher meaning riskier, and an integration doc that said "block above 0.7, review between 0.4 and 0.7". We ran it against four agent workflows for a month. Then we deleted it, and nobody on the team misses it.

Here is the honest reason. Every time the score came back at 0.62, two people on the call quietly disagreed about what should happen next, and neither of them was wrong. The number was not wrong either. It was just not a decision.

<!-- truncate -->

## A threshold is a policy you cannot read

When a classifier returns 0.62, what you have is a compressed guess about a distribution of past examples. The threshold you put on top of it is a second guess, made once, usually during a demo, and almost never written down anywhere a security reviewer could find it.

This is not a knock on classifiers. We use them. They are excellent at answering "does this text look like a refund request". They are bad at answering "may this agent move €4,190 out of this account right now", because the second question is about permission, not about similarity to previous text.

Permission has structure. A refund has an amount, a currency, a customer, a requester, a time window, and a person who is accountable if it goes wrong. Once you write those down, the decision stops being a matter of taste.

## What comes back instead

The SDK returns one of three verdicts per action: `ALLOW`, `REVIEW`, `BLOCK`. Nothing else, no score to interpret.

```ts
import {TruslayUniversalClient} from '@truslay/sdk';

const truslay = new TruslayUniversalClient(
  {mode: 'collaboration', firewallMode: 'live', apiKey: process.env.TRUSLAY_API_KEY},
  'agent',
);

const decision = await truslay.evaluateAction({
  intent: 'issue_refund',
  payload: {amount: 4190, currency: 'EUR', customer_id: 'CUS-8841'},
});

if (decision.verdict !== 'ALLOW') {
  throw new Error(`Blocked by Truslay: ${decision.reason}`);
}
```

The envelope carries more than the word: a machine-readable `reason`, a `latencyMs` measured on your machine, an `auditId` for the sealed record, and a `signature` produced by the Seal layer. A refund over the ceiling comes back as `BLOCK` with `reason: "policy_denied"`, and the amount is in the reason code path, not buried in a float.

## Three properties, and why each one is testable

**Determinism.** Same intent, same payload, same policy graph, same verdict. Not "usually the same". This matters more than it sounds: it means you can write a regression test for a security decision, in CI, with no model in the loop.

**Fail-closed.** If the decision cannot be produced, nothing runs. A live Firewall that times out returns `BLOCK` with `firewall_unavailable`. A malformed response is treated as denied. There is no fail-open branch to accidentally configure.

**Evidence.** A verdict is signed and appended to a ledger, and the ledger root is anchored so it can be checked later. A log line says what a process printed. This says what was decided, for which payload, and at what time, in a form that does not quietly change.

## Classifiers still earn their place

I want to be careful here, because "deterministic" gets sold as "no ML needed anywhere", and that is not our position.

A classifier is a fine *input* to a policy graph. "Does this ticket contain a threat of self-harm" is a genuinely fuzzy question, and a model answers it better than any rule I could write. The important move is what happens to that answer: it becomes a signal the graph reads, and the graph decides. The model proposes, the Gate disposes. If the model is down or returns something outside its contract, the graph routes to `REVIEW`, which still means the tool call does not run.

What we removed was not the model. It was the model's authority to be the final word.

## What this costs you

Two things, and neither is small.

You have to write policy. Not prompts, policy: ceilings, roles, escalation targets, customer segments. Someone who understands the business has to sit with someone who understands the agent, and that meeting is the product. We cannot generate that from your logs, and vendors who claim they can are selling you a threshold with extra steps.

And you lose the comfortable ambiguity of a score. When the verdict is `BLOCK` because an agent tried to change a grade it had assigned, there is no "well, 0.68, close call". There is a decision, a reason code, and a person to escalate to. Some teams find that uncomfortable for about a week. Then they find it the only way they can sleep.

## Questions we get every week

### Is this just a rules engine?

No, but the difference is narrower than vendors imply. A rules engine evaluates conditions you wrote in advance; the policy graph also carries the execution plan: which layer evaluates what, what happens when a layer is unavailable, and how the decision gets sealed. The determinism comes from the graph, not from the absence of logic.

### What about prompt injection and drift?

Injection is exactly the case where a score fails. The injected instruction usually looks *more* like a legitimate request than the real one, so a similarity model likes it. A graph does not care how plausible the text is; it checks whether this agent may perform this action with this payload. Drift in model behaviour is real, which is why the enforcement point sits between the model and the tool, not inside the model.

### Does it add latency?

Layers 1 to 6 run in-process and offline; the docs quote sub-millisecond decisions, and the `latencyMs` field lets you check that on your own hardware rather than trust ours. Layers 7 and 8 involve the Firewall and cost a network round trip, which is why live mode is a deliberate choice and not the default.

If you want to see the difference on your own agent, the [quick start](https://docs.truslay.com/docs/introduction/quick-start) runs in sandbox with no credentials, and the [verdict contract](https://docs.truslay.com/docs/api-reference/verdicts) covers every reason code. Start there before you talk to anyone, including us.
