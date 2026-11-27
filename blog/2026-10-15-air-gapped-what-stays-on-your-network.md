---
title: 'What actually leaves your network when you run Truslay'
description: 'A concrete account of what crosses the boundary in sandbox versus live mode, why layers 1 to 6 keep working with the cable unplugged, and what an air-gapped install still does not give you.'
slug: air-gapped-what-stays-on-your-network
date: 2026-10-15T09:15:00.000Z
authors: [truslay]
tags: [deployment, security, architecture]
keywords:
  - air-gapped AI security
  - on-premise AI agent firewall
  - sovereign AI infrastructure
  - data residency AI agents
  - offline policy evaluation
---

import BlogPostingSchema from '@site/src/components/BlogPostingSchema';

<BlogPostingSchema
  headline="What actually leaves your network when you run Truslay"
  description="A concrete account of what crosses the boundary in sandbox versus live mode, why layers 1 to 6 keep working with the cable unplugged, and what an air-gapped install still does not give you."
  datePublished="2026-10-15T09:15:00.000Z"
  slug="air-gapped-what-stays-on-your-network"
  keywords={['air-gapped AI security', 'on-premise AI firewall', 'sovereign AI']}
/>

The procurement question is never "is it secure". It is "what leaves our network, and can you show me". Fair question, and one that most AI security vendors answer with an architecture diagram and a paragraph about encryption in transit.

So here is the less flattering, more useful version: a per-mode accounting of what goes where, including the case where the answer is "nothing".

<!-- truncate -->

## Sandbox: nothing crosses

Sandbox is the default. `firewallMode` is simply not set, and the SDK evaluates locally: intent in, verdict out, no socket opened.

That is not a demo mode that pretends to work. It is the same evaluation path as production minus the corroboration steps, which is why it is the correct place to run CI. Your pipeline gets deterministic verdicts on every commit with no credentials, no vendor account, and no egress rule to maintain.

```bash
# Air-gapped CI: no network interface needed for layers 1 to 6.
npm install @truslay/sdk
npm test
```

```ts
const decision = await truslay.evaluateAction({
  intent: 'delete_customer_record',
  payload: {customer_id: 'CUS-1042'},
});
// {verdict: 'BLOCK', reason: 'policy_denied', latencyMs: 0.6, …}
```

## Live: one endpoint, and you choose where it lives

In live mode the SDK sends the structured intent and payload to the Firewall, and the Firewall returns a decision. That is the whole traffic pattern for layers 7 and 8. No prompt history, no model weights, no documents from your corpus. The SDK never had them in the first place: Signal captured the intent, not the conversation.

And the Firewall is a deployable, not a multi-tenant endpoint you must trust. The on-premise guide walks through running it inside your own perimeter, which turns the vendor relationship into a versioned artefact you install and upgrade on your schedule. If your requirement is "the deciding component sits behind our border", that is the configuration to ask for, and the one to test during a trial rather than after signing.

| Mode | What crosses the boundary | Where the decision is produced |
| --- | --- | --- |
| Sandbox | Nothing | In-process, layers 1–6 |
| Live, hosted Firewall | Intent + payload | Firewall, layers 4–8 |
| Live, on-premise Firewall | Intent + payload, inside your network | Your perimeter, layers 4–8 |
| Anchor | Ledger root hash | Where you point the anchor |

## The test I would run before believing any of this

Unplug the network. Run the sandbox suite. If verdicts come back with sub-millisecond latencies and signed envelopes, the local claim is true for your workload, not just for ours. Then restore the network, unset the Firewall URL in live mode, and watch what happens: it should be `BLOCK` with `firewall_unavailable`, not a timeout followed by a permissive fallback.

That second test is the one that separates a fail-closed product from a fail-closed slide. We have been in rooms where the answer was "we degrade gracefully", which in practice means the tool call runs.

## What air-gapping does not buy you

Four things, because the honest list is short and people plan around the wrong one.

**It does not remove the policy work.** Someone still has to decide that grade changes belong to humans and refunds above €2,000 need a second pair of eyes. An air-gapped install with a vague policy graph is an expensive way to allow everything.

**It does not make review asynchronous-friendly.** Prism resolves `REVIEW` verdicts with people. If those people are in another network zone, the queue crosses a boundary you just closed; plan the human path with the same care as the data path.

**It does not fix key management.** The Seal layer signs with a key. Air-gapped means you hold that key, which also means you rotate it, back it up, and can explain where it was at 3am last quarter.

**It does not replace your existing controls.** Truslay sits between the agent and the tool. Your IAM, your database grants and your network policy still do their jobs; this closes the gap where an autonomous agent with valid credentials does something perfectly authorised and completely wrong.

If you want to run the actual checklist rather than read about it, the [on-premise deployment guide](https://docs.truslay.com/docs/security/on-premise-deployment) has the ordered steps, the ports, and what to verify after each one. Bring it to your security team before you bring a vendor deck.
