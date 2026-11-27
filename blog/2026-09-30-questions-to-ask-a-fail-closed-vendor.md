---
title: 'Twelve questions to ask before you buy fail-closed AI security'
description: 'The evaluation questions we would ask a competitor, with the answer that should worry you and the one that should not. Useful whether you pick us or not.'
slug: questions-to-ask-a-fail-closed-vendor
date: 2026-09-30T08:00:00.000Z
authors: [truslay]
tags: [security, architecture]
keywords:
  - evaluate AI security vendor
  - fail-closed AI guardrails checklist
  - AI agent security procurement
  - guardrail vendor questions
---

import BlogPostingSchema from '@site/src/components/BlogPostingSchema';

<BlogPostingSchema
  headline="Twelve questions to ask before you buy fail-closed AI security"
  description="The evaluation questions we would ask a competitor, with the answer that should worry you and the one that should not."
  datePublished="2026-09-30T08:00:00.000Z"
  slug="questions-to-ask-a-fail-closed-vendor"
  keywords={['AI security vendor evaluation', 'fail-closed guardrails', 'procurement checklist']}
/>

We sell this category, so treat the list with the appropriate suspicion. It is still the list we use internally when we look at adjacent products, and every question below has an answer that would make us walk away.

<!-- truncate -->

## Enforcement

### 1. Where does the decision physically happen?

The good answer names a process, a boundary, and what happens without a network. "In our cloud, with 40ms p99" is a fine answer for a different product. If the enforcement is a hop away from the agent, the tool call is a hop away from happening without it.

### 2. What happens when the decision service is unavailable?

Listen for "fails open", "degrades gracefully", "cache with a TTL". A cached `ALLOW` is an `ALLOW` you did not earn. The answer you want is a verdict, not a retry policy: unreachable means `BLOCK`.

### 3. Can a verdict be overridden by the agent?

It should be impossible by construction, not by convention. Ask to see the code path where the tool is invoked and confirm the only branch into it is the `ALLOW` branch. "The model is instructed not to" is not an override control.

### 4. Is `REVIEW` actually blocked?

Many products treat review as a soft allow with a notification. Ask what the agent does while a human thinks. If the answer is "continues with reduced scope", you bought a logging system with extra steps.

### 5. What is the deterministic unit?

Push for the object that is versioned and testable: a policy graph, a rule set, a signed bundle. If the answer is "our model", you cannot write a regression test for a security decision, and neither can your auditor.

## Evidence

### 6. What exactly is in the audit record?

The record should let someone reconstruct the decision a year later: intent, payload, policy version, verdict, reason, timestamp, who resolved a review. Ask for a sample record, not a screenshot of a dashboard.

### 7. Is the record signed, and with whose key?

Signed by the component that made the decision, with a key the customer can verify and, ideally, hold. A hash of a log file proves the file did not change after you hashed it; it does not prove what was in it.

### 8. Can records be edited or deleted by an administrator?

The correct answer includes a mechanism outside the admin's control: anchoring, external timestamping, a write-once store. If "immutable" is a database permission, it is a policy, and policies get changed during incidents.

### 9. Has the cryptography been reviewed by someone who does not work for you?

This is where you ask about a third-party audit, and where you should be suspicious of the word "planned". Ask for the scope, the firm, and the report date. An audit in progress is a legitimate answer as long as it is stated as one; a passing claim with no report is not.

## Operations

### 10. What does a policy change require?

Versioning, review, and a way to answer "which policy was live when this decision was made". If changing a threshold is a config edit in a dashboard, the same edit is a change to your security posture, and it needs the same paper trail.

### 11. Can it run inside our perimeter, and what still phones home?

Ask for the egress list, in writing, per deployment mode. Then test it: unplug, run the suite, see which features degrade. The gap between the document and the behaviour is the real answer.

### 12. What is the false-positive cost, measured?

Every fail-closed system blocks something legitimate. The vendor should know the rate, the top three causes, and the path a human takes to unblock a real operation at 2am. If nobody has measured it, you will be the measurement.

## How to use this list

Do not send it as a questionnaire; every vendor will answer "yes" to all twelve. Run questions 2, 3, 8 and 11 as tests during a trial, on your own workload, with your own policies. The rest are for the conversation afterwards, when you already know which answers were true.

If you want to run the tests against Truslay first, the [quick start](https://docs.truslay.com/docs/introduction/quick-start) works offline, and the [on-premise guide](https://docs.truslay.com/docs/security/on-premise-deployment) covers the deployment questions. Bring the failures back to us; they are more useful than the praise.
