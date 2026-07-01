# Task 03 — Phase 1: End-to-End Architecture Design

This document defines the complete integration architecture for connecting the OrthoNow landing page to HubSpot CRM, Karix WhatsApp Business API, and Google Ads. It covers tool selection with justification, the exact order of operations, and a sequence diagram.

---

## 1. Tool Selection & Justification

The brief requires three actions on form submission: HubSpot contact creation, WhatsApp message, and Google Ads conversion. Below is the comparison of integration approaches:

### Option Comparison

| Approach | HubSpot Contact | WhatsApp | Google Ads | Phone Dedup Control | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HubSpot Native Form Embed** | ✅ Automatic | ❌ No native WhatsApp | ⚠️ Only via GTM | ❌ HubSpot controls dedup (email-based) | Rejected — no dedup control, no WhatsApp |
| **Zapier** | ✅ Via HubSpot app | ✅ Via Karix app | ⚠️ Limited | ⚠️ Partial (no custom search step) | Rejected — can't do phone-based search before create |
| **Make.com** | ✅ Full API access | ✅ Via HTTP module | ✅ Via HTTP module | ✅ Custom search → conditional create | Viable — good for no-code teams |
| **Direct API (Serverless Lambda/Cloud Function)** | ✅ Full control | ✅ Full control | ✅ Full control | ✅ Complete programmatic control | **Selected** — maximum control, lowest latency, best for SLA |
| **HubSpot Workflows** | ✅ Native | ⚠️ Requires custom webhook | ⚠️ Requires custom webhook | ❌ Runs after contact is already created | Rejected — dedup happens too late |

### Selected Approach: Serverless Middleware (Node.js on AWS Lambda / Google Cloud Functions)

**Why this over Make.com or Zapier:**

| Factor | Serverless Lambda | Make.com / Zapier |
| :--- | :--- | :--- |
| **Phone deduplication** | Full programmatic control — search before create, custom merge logic | Make can do it, Zapier cannot. But both add latency. |
| **2-minute SLA** | Lambda cold start: ~200ms. Total execution: < 3s. Massive headroom. | Make/Zapier add 5–30s of queue + step latency per operation. Risky for SLA. |
| **Error handling** | Full try/catch, custom retry, Dead Letter Queue, structured logging | Limited to platform's retry settings. Can't implement custom fallback chains. |
| **Cost at scale** | ~$0.20 per million requests (Lambda) | Make: $9–29/month for 10K ops. Zapier: $29–99/month. |
| **Monitoring** | CloudWatch / Sentry — millisecond-level latency tracking | Platform dashboards only — no custom SLA alerts. |
| **Data security** | PHI stays within our infrastructure. No third-party data processor. | Lead data passes through Make/Zapier servers (data processor concern under DPDP Act). |

**Architecture**: The landing page form (`landing.html`) sends a POST request to an API Gateway endpoint, which triggers the Lambda function. The Lambda orchestrates all three actions sequentially with error handling at each step.

---

## 2. Order of Operations

The sequence is **sequential, not parallel**. Each step depends on the success of the previous:

```
┌──────────────┐
│  1. FRONTEND  │  Patient submits form (Name + Phone)
│  landing.html │  POST /api/leads → API Gateway
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  2. LAMBDA: Validate & Normalize Input            │
│  • Validate phone (regex ^[0-9]{10}$)             │
│  • Normalize name (trim, title case)              │
│  • Rate limit check (max 3 submissions / IP / hr) │
│  Duration: ~10ms                                  │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  3. HUBSPOT: Phone-Based Search & Upsert          │
│  • POST /crm/v3/objects/contacts/search           │
│    Filter: phone EQUALS {submitted_phone}         │
│  • If found → PATCH (update lead status + source) │
│  • If not found → POST (create new contact)       │
│  • Set: Source, Lead Status, Clinic Preference    │
│  Duration: ~300–800ms (HubSpot API latency)       │
│  Output: hubspot_contact_id                       │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  4. KARIX: Send WhatsApp Message                  │
│  • POST /api/v2/message/send                     │
│    Template: "consultation_confirmation"          │
│    Variables: {patient_name, clinic_name}         │
│  • Record message_id for delivery tracking        │
│  Duration: ~500–1500ms                            │
│  Output: karix_message_id                         │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  5. GOOGLE ADS: Fire Conversion (Server-Side)     │
│  • POST Google Ads API /conversions/adjust        │
│    Conversion: consultation_form_submitted        │
│    Value: ₹500                                    │
│    GCLID: from cookie or landing page URL param   │
│  Duration: ~200–500ms                             │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  6. RESPONSE: Return 200 to Frontend              │
│  • Frontend shows thank-you state                 │
│  • dataLayer.push fires (client-side, backup)     │
│  Total Lambda Duration: ~1–3 seconds              │
│  Well within 2-minute WhatsApp SLA               │
└──────────────────────────────────────────────────┘
```

### Why Sequential (Not Parallel)?

HubSpot → WhatsApp → Google Ads could technically run in parallel. But sequential is chosen because:

1. **HubSpot must succeed first**: The WhatsApp message references the HubSpot contact ID for tracking. If HubSpot fails, we don't want to send a WhatsApp message to a lead that doesn't exist in the CRM.
2. **WhatsApp should succeed before Ads conversion**: We only want to count a conversion (and pay Google Ads to optimize for it) if the patient actually received their confirmation message. A conversion without a WhatsApp confirmation is a broken lead.
3. **Google Ads is last (lowest priority)**: If Ads API is down, the lead is still captured in HubSpot and the patient still got their WhatsApp. The conversion can be backfilled later via offline conversion import.

### Total Latency Budget

| Step | Estimated Duration | SLA Impact |
| :--- | :--- | :--- |
| Validate input | 10ms | — |
| HubSpot search + upsert | 300–800ms | — |
| Karix WhatsApp send | 500–1500ms | **Clock starts here for 2-min SLA** |
| Google Ads conversion | 200–500ms | — |
| Lambda overhead | 200ms | — |
| **Total (form submit → WhatsApp delivered)** | **1.2–3.0s** | **Well under 120s SLA** |

The 2-minute SLA applies to WhatsApp *delivery* (message reaching the patient's phone), not just API acceptance. Karix delivery typically takes 5–15 seconds after API acceptance. Total wall-clock time from form submit to WhatsApp on phone: **~6–18 seconds**. Headroom: **~100 seconds**.

---

## 3. Data Flow Diagram

```
                    ┌─────────────────┐
                    │  Google Ads     │
                    │  (Conversion)   │
                    └────────▲────────┘
                             │ ⑤
┌──────────┐    POST     ┌──┴──────────────┐     ③      ┌──────────┐
│          │────────────▶│   API Gateway    │──────────▶│ HubSpot  │
│ Landing  │  /api/leads │                  │  Search +  │  CRM     │
│ Page     │             │  AWS Lambda      │  Upsert    │          │
│ (HTML/JS)│◀────────────│  (Node.js)       │◀──────────┘          │
│          │   200 OK    │                  │                      │
└──────────┘             │  Orchestrator:   │     ④      ┌──────────┐
                         │  Validate        │──────────▶│  Karix   │
                         │  → HubSpot       │  WhatsApp  │ (WhatsApp│
                         │  → WhatsApp      │  Send      │   API)   │
                         │  → Google Ads    │◀──────────┘          │
                         └──────────────────┘
                                  │
                                  │ Logs + Metrics
                                  ▼
                         ┌──────────────────┐
                         │  CloudWatch /    │
                         │  Sentry          │
                         │  (SLA Monitor)   │
                         └──────────────────┘
```

---

## 4. Technology Stack Summary

| Layer | Technology | Why |
| :--- | :--- | :--- |
| **Frontend** | Vanilla JS `fetch()` | Already built in `landing.html` — sends POST to API Gateway |
| **API Gateway** | AWS API Gateway (REST) or Google Cloud Run | Receives POST, triggers Lambda, handles rate limiting |
| **Middleware** | Node.js 20.x on AWS Lambda | Orchestrates all 3 API calls with error handling |
| **CRM** | HubSpot CRM API v3 | Search, Create, Update contacts |
| **WhatsApp** | Karix WhatsApp Business API | Pre-approved template, delivery callbacks |
| **Ads** | Google Ads API (Server-Side Conversions) | Fires conversion with GCLID for Smart Bidding |
| **Monitoring** | AWS CloudWatch + Sentry | Latency tracking, error alerting, SLA dashboards |
| **Queue (fallback)** | AWS SQS (Simple Queue Service) | Dead Letter Queue for failed WhatsApp sends |

---

## 5. Security Considerations

| Concern | Mitigation |
| :--- | :--- |
| **PII in transit** | API Gateway enforces HTTPS/TLS 1.2+. No plaintext. |
| **API keys** | HubSpot, Karix, Google Ads keys stored in AWS Secrets Manager — never in code or environment variables in plaintext. |
| **Input validation** | Lambda validates phone regex and name length before any API call. Rejects malformed input early. |
| **Rate limiting** | API Gateway throttles at 10 req/min per IP. Prevents spam/abuse. |
| **CORS** | API Gateway configured to accept requests only from `orthonow.in` and the GitHub Pages domain. |
| **Data retention** | Lambda logs are set to 30-day retention. No PII logged — only contact IDs and message IDs. |
