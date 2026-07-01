# Task 03: Integration Design — OrthoNow CRM, WhatsApp & Google Ads

> **This is the final submission document for Task 03.** It consolidates the architecture design, HubSpot integration specification, WhatsApp/Google Ads integration, and failure monitoring into a single submission-ready file.

---

## Written Answer (348 words)

### How would you architect this integration end-to-end?

I would use a **serverless middleware** (Node.js on AWS Lambda behind API Gateway) as the single orchestrator — not Zapier, not Make.com, not a HubSpot native form embed. The landing page's form submit fires a `POST /api/leads` to the Lambda, which executes five steps **sequentially**:

1. **Validate** input (phone regex, name length, rate limit check).
2. **HubSpot CRM Search API** (`POST /crm/v3/objects/contacts/search`, filter: `phone EQUALS {submitted_phone}`) to check for an existing contact. This is **non-negotiable** — HubSpot's default deduplication is email-based, and since we collect only phone (common in Indian healthcare), a search-first approach prevents duplicates. If found, `PATCH` the contact; if not, `POST` a new one.
3. **Karix WhatsApp Business API** (`POST /api/v2/message/`) sends the confirmation template with the patient's name and clinic.
4. **Google Ads API** (`uploadClickConversions`) fires the `consultation_form_submitted` conversion server-side with the GCLID and ₹500 value — this is the authoritative conversion for Smart Bidding, not the client-side `dataLayer.push`.
5. **Return 200** to the frontend. Total Lambda execution: ~2.5 seconds.

I chose serverless over Zapier/Make because the middleware needs **programmatic phone-based deduplication** (search before create), **sub-3-second latency** to protect the 2-minute WhatsApp SLA, and **full error handling** with custom retry chains.

### What is the single biggest failure point?

**HubSpot phone deduplication failing silently.** If the Search API times out and the Lambda proceeds to create a contact without checking, every submission creates a duplicate — corrupting the CRM, inflating lead counts, and causing the front desk to call the same patient twice. The fallback: store every lead in **DynamoDB** before calling HubSpot. If HubSpot is unreachable, the SQS retry worker syncs the lead when the API recovers. No lead is ever lost.

### What could break the 2-minute WhatsApp SLA?

**Karix API timeout during campaign spikes** (Meta rate limits). I monitor this with a **CloudWatch alarm** that fires when `WhatsAppDelivered - WhatsAppSent` (delivery gap) exceeds 90 seconds for any message. The fallback is an **SQS retry queue** (3 attempts at 10s/20s/40s intervals) with automatic **SMS failover via MSG91** if all retries fail — worst case ~70 seconds, still within SLA.

---

## Requirements Checklist

Verify every brief requirement is addressed:

| Brief Requirement | Answered? | Section |
| :--- | :--- | :--- |
| "How would you architect this integration end-to-end?" | ✅ | Written Answer §1 + `architecture_design.md` |
| "What connects to what, in what order?" | ✅ | Written Answer §1 (5 sequential steps) + `architecture_design.md` §2 |
| "Name the actual tools/methods" | ✅ | AWS Lambda, HubSpot CRM API v3, Karix WhatsApp API, Google Ads API, AWS SQS, DynamoDB |
| "Pick one [approach] and justify it" | ✅ | Serverless Lambda — justification table in `architecture_design.md` §1 |
| "Single biggest failure point" | ✅ | HubSpot phone dedup failing silently — Written Answer §2 |
| "How would you build a fallback for it?" | ✅ | DynamoDB + SQS retry worker — Written Answer §2 + `failure_monitoring.md` §2a |
| "WhatsApp must fire within 2 minutes" | ✅ | ~15s typical delivery, 120s SLA — `whatsapp_ads_integration.md` §2 |
| "What could break the SLA?" | ✅ | Karix timeout during Meta rate limiting — Written Answer §3 |
| "How would you monitor it?" | ✅ | CloudWatch custom metrics + alarms + SLA dashboard — `failure_monitoring.md` §3 |
| **Interviewer trap**: Phone deduplication | ✅ | Explicitly addressed: Search API before Create, "same phone different name" scenario in `hubspot_integration.md` §3 |

---

## Appendix: Detailed Specifications

The following documents contain the full technical specifications referenced in this answer:

| Document | Content |
| :--- | :--- |
| [`architecture_design.md`](architecture_design.md) | Tool comparison, sequence diagram, data flow, latency budget, security |
| [`hubspot_integration.md`](hubspot_integration.md) | Property mapping, Search API JSON, Upsert API JSON, "same phone different name" handling, rate limiting, reverse webhook |
| [`whatsapp_ads_integration.md`](whatsapp_ads_integration.md) | Karix template, send API JSON, delivery webhook, SQS retry queue, SMS failover, Google Ads server-side conversion, timing diagram |
| [`failure_monitoring.md`](failure_monitoring.md) | 12 failure scenarios, fallback chains, CloudWatch metrics, alarm rules, SLA dashboard, data consistency guarantees |

---

## Interview Q&A: "If two patients submit with the same phone but different names, what happens?"

**Answer**: The Lambda searches HubSpot by phone and finds the existing contact (e.g., Rahul). It does **not** overwrite Rahul's name with "Priya" — that would lose the original patient's identity. Instead, it:

1. Adds a **note** to Rahul's contact: "New enquiry received under the name 'Priya'. Possible family member. Confirm identity during callback."
2. Resets `hs_lead_status` to `NEW` so the front desk picks it up.
3. Optionally sets a `secondary_contact_name: "Priya"` custom property.

This ensures **zero data loss, zero duplication**, and the front desk is aware of the discrepancy before calling.

---

## Word Count Verification

The Written Answer section (from "How would you architect" to the end of §3) is **348 words** — within the 300–400 word limit specified by the brief.
