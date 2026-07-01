# Task 03 — Phase 4: Failure Points, Fallbacks & Monitoring

This document provides a per-step failure mode analysis of the entire integration pipeline, the fallback chain for each failure, and the monitoring stack that tracks SLA compliance and alerts the team.

---

## 1. Failure Mode Analysis

Every step in the integration pipeline is assessed for failure probability, blast radius, and recovery strategy.

### Pipeline Overview

```
Step 1: Validate Input (Lambda)
Step 2: HubSpot Search + Upsert
Step 3: Karix WhatsApp Send
Step 4: Google Ads Conversion
Step 5: Response to Frontend
```

### 1a. Per-Step Risk Assessment

| Step | Failure Scenario | Probability | Blast Radius | Detection Method |
| :--- | :--- | :--- | :--- | :--- |
| **1. Validate** | Malformed input bypasses regex | Very Low | Junk data enters HubSpot | Lambda throws validation error before any API call |
| **1. Validate** | Rate limit exceeded (spam/bot) | Medium | Legitimate submissions blocked | API Gateway returns 429 Too Many Requests |
| **2. HubSpot** | HubSpot API down (5xx) | Low (~99.9% uptime SLA) | No contact created. Lead lost. | Lambda catches non-200 response |
| **2. HubSpot** | Rate limited (429) | Low (2 requests per lead) | Submission delayed | Lambda catches 429, retries with backoff |
| **2. HubSpot** | Access token expired | Low (tokens rotate every 30 min) | All submissions fail | Lambda catches 401, refreshes token from Secrets Manager |
| **2. HubSpot** | Network timeout (HubSpot slow) | Medium | Lambda hangs, may exceed 15s timeout | AbortController at 8s, then fallback |
| **3. Karix** | Karix API down | Medium | No WhatsApp sent. SLA breach. | Lambda catches non-200, enqueues to SQS |
| **3. Karix** | WhatsApp rate limit (Meta enforced) | Medium (during campaign spikes) | Messages queued at Karix but not sent | Karix webhook returns `status: failed` |
| **3. Karix** | Invalid phone number (DND, disconnected) | Medium (3–5% of Indian leads) | Message undeliverable | Karix webhook returns `status: failed` with error code |
| **4. Google Ads** | Google Ads API down | Very Low | Conversion not recorded. Smart Bidding blind. | Lambda catches non-200, logs error, continues (non-blocking) |
| **4. Google Ads** | GCLID missing or expired | Medium (clicks older than 90 days) | Conversion can't be attributed to a click | Lambda checks GCLID presence, skips if missing |
| **5. Response** | Lambda timeout (15s exceeded) | Low (total exec ~2.5s) | User sees error state. Lead captured but UI broken. | Frontend catches fetch timeout, shows retry |
| **5. Response** | User closes tab during Lambda execution | Medium | Lambda continues server-side. HubSpot + WhatsApp still fire. | Not a real failure — server-side processing continues independently |

### 1b. Failure Severity Classification

| Severity | Definition | Examples | Response Time |
| :--- | :--- | :--- | :--- |
| **P0 — Critical** | Lead data is lost permanently | HubSpot API down + no fallback storage | Immediate Slack + PagerDuty alert |
| **P1 — High** | SLA breach (WhatsApp > 2 min) | Karix down, retry queue exhausted | Slack alert within 30s |
| **P2 — Medium** | Lead captured but incomplete | Google Ads conversion failed, WhatsApp sent via SMS fallback | Slack alert within 5 min |
| **P3 — Low** | Non-critical degradation | GCLID missing, conversion still fires client-side | Daily digest log |

---

## 2. Fallback Chain Design

### 2a. Step 2 (HubSpot) Fallback

If HubSpot is unreachable after 2 retries:

```
HubSpot API fails
       │
       ▼
┌─────────────────────────┐
│  Fallback: DynamoDB      │
│  Store lead locally      │
│                          │
│  PK: lead_id             │
│  Fields: name, phone,    │
│  clinic, source,         │
│  timestamp, status:      │
│  "pending_hubspot"       │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  SQS: HubSpot Retry      │
│  Queue                   │
│                          │
│  Visibility: 5 min       │
│  Max receives: 12        │
│  (retries for 1 hour)    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Lambda Worker:          │
│  HubSpot Sync            │
│                          │
│  Every 5 min, dequeues   │
│  pending leads and       │
│  retries HubSpot API     │
│                          │
│  Success → Update Dynamo │
│  status to "synced"     │
│  Fail → Requeue          │
└─────────────────────────┘
```

**Key guarantee**: The lead is **never lost**. It's stored in DynamoDB immediately as a fallback, then synced to HubSpot when the API recovers. The user still receives their WhatsApp message — the HubSpot sync happens asynchronously.

### 2b. Step 3 (Karix WhatsApp) Fallback

Already specified in Phase 3. Summary:

```
Karix WhatsApp fails
       │
       ├──▶ SQS Retry Queue (3 attempts: 10s, 20s, 40s)
       │
       └──▶ All retries fail? → SMS via MSG91 (near-instant)
                              → Slack alert to front desk for manual call
```

### 2c. Step 4 (Google Ads) Fallback

Google Ads conversion failure is **non-blocking**. The Lambda logs the error and continues. The lead is already in HubSpot and the patient already has their WhatsApp.

**Recovery**: A nightly batch job (`Lambda: ads-backfill`) reads all leads from DynamoDB where `ads_conversion_status = "failed"` and retries the Google Ads API:

```
Nightly at 02:00 IST:
  SELECT * FROM leads WHERE ads_conversion_status = 'failed' AND created_at > NOW() - 7 days
  → Retry Google Ads API for each
  → Success → Update status to 'synced'
  → Fail (GCLID expired after 90 days) → Mark as 'unrecoverable'
```

### 2d. Complete Fallback Decision Tree

```
                    ┌──────────────┐
                    │ Form Submit  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Validate?    │──NO──▶ 400 Bad Request
                    └──────┬───────┘
                           │ YES
                    ┌──────▼───────┐
                    │ HubSpot OK?  │──NO──▶ DynamoDB + SQS Queue
                    └──────┬───────┘            (async sync)
                           │ YES
                    ┌──────▼───────┐
                    │ WhatsApp OK? │──NO──▶ SQS Retry × 3
                    └──────┬───────┘            │
                           │ YES                └──▶ SMS Failover
                    ┌──────▼───────┐                  + Slack Alert
                    │ Google Ads   │──NO──▶ Log error
                    │ OK?          │        Nightly backfill
                    └──────┬───────┘
                           │ YES/NO (non-blocking)
                    ┌──────▼───────┐
                    │ Return 200   │
                    │ to frontend  │
                    └──────────────┘
```

---

## 3. Monitoring Stack

### 3a. Architecture

```
┌──────────────┐     Metrics      ┌──────────────────┐     Alerts      ┌──────────────┐
│   Lambda     │─────────────────▶│  CloudWatch       │───────────────▶│    Slack     │
│  (all steps) │                  │  Dashboards       │                │   #alerts    │
└──────────────┘                  └──────────────────┘                └──────────────┘
       │                                                                  │
       │ Error logs                                                      │
       ▼                                                                  ▼
┌──────────────┐                                                  ┌──────────────┐
│   Sentry     │───────────── Error grouping ──────────────────────│  PagerDuty   │
│  (structured │                  stack traces                       │   (P0 only)  │
│   logging)   │                                                      └──────────────┘
└──────────────┘
       │
       │ SLA metrics
       ▼
┌──────────────────┐
│  Custom Dashboard │
│  (Grafana or      │
│   Datadog)        │
│                   │
│  • Leads/day      │
│  • Avg SLA time   │
│  • SLA breaches   │
│  • Fallback rate  │
│  • Error rate     │
└──────────────────┘
```

### 3b. CloudWatch Metrics (Custom)

The Lambda emits custom CloudWatch metrics at each step:

| Metric Name | Type | Dimensions | Purpose |
| :--- | :--- | :--- | :--- |
| `LeadSubmitted` | Count | `source`, `clinic` | Total leads received |
| `HubSpotLatency` | Time (ms) | — | HubSpot API response time |
| `HubSpotError` | Count | `error_type` | HubSpot API failures |
| `WhatsAppSent` | Count | — | Karix messages accepted |
| `WhatsAppDelivered` | Count | — | Delivery confirmations received |
| `WhatsAppSLA` | Time (s) | — | Form submit → delivery duration |
| `WhatsAppSLABreach` | Count | — | Deliveries > 120 seconds |
| `SMSFailover` | Count | — | SMS fallbacks triggered |
| `AdsConversionFired` | Count | — | Google Ads conversions recorded |
| `AdsConversionFailed` | Count | — | Google Ads failures |
| `DynamoFallbackUsed` | Count | — | DynamoDB fallback activations |

### 3c. CloudWatch Alarms

| Alarm | Trigger | Action | Severity |
| :--- | :--- | :--- | :--- |
| `HubSpotDown` | `HubSpotError` > 5 in 5 min | Slack + PagerDuty | P0 |
| `WhatsAppSLABreach` | `WhatsAppSLABreach` > 0 | Slack | P1 |
| `SMSFailoverSpike` | `SMSFailover` > 10 in 1 hr | Slack | P1 |
| `AdsConversionFailure` | `AdsConversionFailed` > 20% of total in 1 hr | Slack | P2 |
| `LambdaErrorRate` | Error count > 5% of invocations in 15 min | Slack + PagerDuty | P0 |
| `DynamoFallbackActive` | `DynamoFallbackUsed` > 0 | Slack | P1 |

### 3d. SLA Dashboard (Daily View)

A single dashboard visible to the Namoza growth team:

| Metric | Target | Alert Threshold |
| :--- | :--- | :--- |
| Total leads today | — | — |
| Avg time to WhatsApp delivery | < 30s | > 60s |
| Max time to WhatsApp delivery | < 120s | > 120s (breach) |
| WhatsApp delivery rate | > 95% | < 90% |
| SMS fallback rate | < 5% | > 10% |
| HubSpot sync rate | > 99% | < 95% |
| Google Ads conversion rate | > 98% | < 90% |
| Leads lost (P0) | 0 | > 0 |

### 3e. Sentry Error Tracking

Lambda is instrumented with Sentry for structured error capture:

```javascript
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: 'production' });

// In the Lambda handler:
try {
    await processLead(event);
} catch (error) {
    Sentry.captureException(error, {
        tags: { step: 'hubspot_search' },
        extra: { lead_id: lead.id, phone: lead.phone }
    });
    throw error;
}
```

Sentry groups similar errors, provides stack traces, and tracks error frequency over time. This is complementary to CloudWatch (which shows metrics) — Sentry shows the **code-level root cause**.

---

## 4. Data Consistency Guarantees

| Guarantee | Mechanism |
| :--- | :--- |
| **No lead is ever lost** | DynamoDB fallback stores every submission before HubSpot is called. SQS queue retries until sync succeeds. |
| **No duplicate contacts in HubSpot** | Phone-based search before create. Even if Lambda retries, the search finds the existing contact. |
| **No duplicate WhatsApp messages** | Karix `message_id` is stored in DynamoDB. Before sending, Lambda checks if a message was already sent for this `lead_id`. If yes, skips. |
| **No duplicate Google Ads conversions** | `orderId` field (`ORTHO-{lead_id}-{date}`) is unique. Google Ads deduplicates by `orderId` — even if Lambda retries, the conversion is counted once. |
| **Eventual consistency** | Even if HubSpot is down for 1 hour, the SQS worker syncs all leads within 5 minutes of recovery. The lead exists in DynamoDB the entire time. |

---

## 5. Post-Incident Review Template

When a P0 or P1 incident occurs, the following review is completed within 24 hours:

| Section | Content |
| :--- | :--- |
| **Timeline** | Exact timestamps: detection → alert → mitigation → resolution |
| **Root Cause** | What failed and why (API outage, code bug, config error) |
| **Impact** | Number of leads affected, SLA breaches, revenue impact |
| **Resolution** | What was done to fix it |
| **Prevention** | What change prevents this from recurring (monitoring rule, code fix, fallback improvement) |
| **Action Items** | Owner + deadline for each prevention item |
