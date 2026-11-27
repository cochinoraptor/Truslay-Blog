---
title: 'The 8 layers, explained without the marketing'
description: 'One layer per failure mode: what Signal, Lattice, Shield, Gate, Seal, Ledger, Anchor and Prism each do, where the SDK ends and the Firewall begins, and where this is overkill.'
slug: eight-layers-without-the-marketing
date: 2026-10-28T10:00:00.000Z
authors: [truslay]
tags: [architecture]
keywords:
  - Truslay 8 layers
  - AI agent security architecture
  - SDK vs firewall
  - intent interception
  - immutable audit ledger
---

import BlogPostingSchema from '@site/src/components/BlogPostingSchema';

<BlogPostingSchema
  headline="The 8 layers, explained without the marketing"
  description="One layer per failure mode: what Signal, Lattice, Shield, Gate, Seal, Ledger, Anchor and Prism each do, where the SDK ends and the Firewall begins."
  datePublished="2026-10-28T10:00:00.000Z"
  slug="eight-layers-without-the-marketing"
  keywords={['Truslay 8 layers', 'agent security architecture', 'SDK vs firewall']}
/>

Eight is a suspicious number. When a security product ships a numbered stack, the count is usually whatever fit on the slide. Ours is eight because there are eight distinct ways an agent action can be wrong, and folding two of them together means one of them goes unhandled. I will try to show the seams rather than hide them.

<!-- truncate -->

## Layers 1 to 6: the SDK, inside your process

These run in the Sovereign Edge, which is an npm package. No network, no account, no round trip. If you unplug the machine, layers 1 to 6 still decide.

**1. Signal — intercept the intent.** The layer that actually matters and the one people skip in diagrams. Before any policy runs, the SDK captures what the agent is about to do as structured intent plus payload, not as prose. If you cannot name the intent, you cannot have a policy about it.

**2. Lattice — load the policy graph.** Policies are a graph of conditions with an explicit evaluation order, versioned and pinned. Pinned matters: an evaluation that used policy version 14 six months ago should still be explainable today.

**3. Shield — normalise and validate the payload.** Type checks, ranges, required fields, and the boring attacks: oversized amounts, missing customer ids, currency codes that do not exist. A payload that fails validation cannot produce `ALLOW`.

**4. Gate — decide, fail-closed.** The three-verdict decision described in [the verdict contract](https://docs.truslay.com/docs/api-reference/verdicts). `ALLOW` is the only value that lets the call through; `REVIEW` and `BLOCK` both stop it.

**5. Seal — sign the decision.** Ed25519 over the decision and its inputs, so the record can be checked without trusting the service that wrote it.

**6. Ledger — append, never edit.** Decisions go into an append-only structure. You can add to it; you cannot quietly rewrite last Tuesday.

## Layers 7 and 8: the Firewall, in your perimeter

The boundary between the SDK and the Firewall is the boundary between *deciding* and *corroborating*. This is the part where the marketing usually gets vague, so here is the plain version.

**7. Anchor — anchor the ledger root.** The hash root of the ledger gets written somewhere you do not control exclusively, so a later edit of local history is detectable. This is the layer that makes "immutable" mean something other than "we promise".

**8. Prism — resolve what a machine should not decide.** Ambiguous cases surface here for a human: the audit trail, the reviewer queue, dual approval, and the resolution, which is itself recorded as a new signed decision. Prism is not a dashboard bolted on top; it is where `REVIEW` becomes a person's name.

Layers 7 and 8 need the Firewall, which means a network call — and that is the reason live mode is not the default. In live mode, an unreachable Firewall yields `BLOCK` with `firewall_unavailable`. Awkward for uptime dashboards. Correct for permissions.

## The table I would put on the slide

| Layer | Job | Failure it closes |
| --- | --- | --- |
| Signal | Capture structured intent | Agent acts on prose nobody can inspect |
| Lattice | Load pinned policy graph | Rules that drift between deployments |
| Shield | Validate payload | Malformed or out-of-range inputs |
| Gate | Decide, fail-closed | Fail-open fallbacks, advisory "warnings" |
| Seal | Sign the decision | Decisions altered after the fact |
| Ledger | Append-only record | Logs deleted or rewritten |
| Anchor | Anchor the root | Local history edited wholesale |
| Prism | Human resolution | Ambiguous cases decided by a machine |

## Where the split actually hurts

Honest trade-off: the SDK works without the Firewall, so a team can adopt layers 1 to 6 in an afternoon and feel done. They have enforcement, but they do not have anchoring or a human resolution path, and both of those are what auditors ask about. The gap is real and we do not hide it — it is visible in the `signature` field, which is present when Seal ran locally, and in whether the ledger root has been anchored at all.

The reverse is also true. If you only run the Firewall without the SDK, you are inspecting traffic after the agent already formed the intent, and you lose the local, sub-millisecond property. The split is not decoration; each half fails differently.

## Where this is overkill

If your agent drafts emails that a human sends, you do not need eight layers. You need a review queue and a coffee. The stack earns its keep the moment the agent touches something that is expensive or irreversible: money, grades, access provisioning, public publishing, production data deletion. Those are the intents where "it usually behaves" is not an answer you can give a board.

The full stack, with the exact layer responsibilities and the failure behaviour of each, is in [the architecture docs](https://docs.truslay.com/docs/architecture/the-8-layers). Start there if you want the version with the diagrams; this post is the version for people who have to defend the design in a meeting.
