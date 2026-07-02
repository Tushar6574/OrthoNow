# Task 03 — Phase 3: WhatsApp (Karix) & Google Ads Integration

This document specifies the Karix WhatsApp Business API integration (message template, API calls, delivery callbacks) and the Google Ads conversion firing mechanism (server-side vs client-side decision, offline conversion import flow).

---

## 1. Karix WhatsApp Business API

### 1a. WhatsApp Template Approval

Before sending messages, the template must be approved by Meta/WhatsApp. Karix manages this submission.

**Template Name**: `consultation_confirmation`

**Template Body** (with variables in `{{1}}` format):

```
Hi {{1}}, 

Your consultation request has been received by OrthoNow. 

📋 Clinic: {{2}}
📞 What's next: Our specialist will call you within 15 minutes on this number.

If you need urgent assistance, call us at 1800-678-466.

— Team OrthoNow
```

**Template Category**: Marketing (since it's triggered by a paid ad lead)

**Submission**: Karix dashboard → WhatsApp Templates → Create → Submit for Meta approval (typically 24–48 hours).

### 1b. Send WhatsApp Message — API Call

When the Lambda middleware reaches Step 4 (after HubSpot contact is created/updated), it calls the Karix API:

**Request:**
```http
POST https://api.karix.io/api/v2/message/
Authorization: Basic {base64(account_sid:auth_token)}
Content-Type: application/json
```

```json
{
  "channel": "whatsapp",
  "direction": "outbound",
  "to": "+919876543210",
  "from": "+918012345678",
  "template": {
    "namespace": "orthonow_consultation",
    "name": "consultation_confirmation",
    "language": {
      "policy": "deterministic",
      "code": "en"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "Rahul"
          },
          {
            "type": "text",
            "text": "OrthoNow Indiranagar, Bengaluru"
          }
        ]
      }
    ]
  },
  "webhook_url": "https://api.orthonow.in/webhooks/karix/delivery",
  "webhook_version": "2"
}
```

**Response (HTTP 200 — Message Accepted):**
```json
{
  "status": "queued",
  "message_id": "KA_LX_9876543210_20260701",
  "channel": "whatsapp",
  "direction": "outbound",
  "to": "+919876543210",
  "created_time": "2026-07-01T10:30:02.000Z"
}
```

### 1c. Delivery Status Callback (Webhook)

Karix sends a webhook to our server when the message status changes. This is **critical for SLA monitoring**.

**Karix → Lambda Webhook:**

```http
POST https://api.orthonow.in/webhooks/karix/delivery
Content-Type: application/json
```

```json
{
  "event": "message_status",
  "message_id": "KA_LX_9876543210_20260701",
  "status": "delivered",
  "to": "+919876543210",
  "timestamp": "2026-07-01T10:30:08.000Z",
  "error": null
}
```

### Status Flow

| Status | Meaning | SLA Clock |
| :--- | :--- | :--- |
| `queued` | Karix accepted the message | Message accepted (not yet delivered) |
| `sent` | Message sent to WhatsApp servers | In transit |
| `delivered` | Message delivered to patient's phone | **SLA MET** — clock stops here |
| `read` | Patient opened the WhatsApp chat | Bonus signal (not required for SLA) |
| `failed` | Message could not be delivered | **SLA BREACHED** — triggers fallback |

### Handling in Lambda

When the delivery webhook arrives, Lambda:

1. **Records the delivery timestamp** in DynamoDB: `message_id → delivered_at`
2. **Calculates SLA duration**: `delivered_at - form_submission_at`
3. **If SLA > 120 seconds**: Logs a WARNING event to CloudWatch + sends Slack alert
4. **Updates HubSpot note**: "WhatsApp delivered at {timestamp}. SLA: {X}s."

---

## 2. 2-Minute SLA Architecture

### 2a. Why a Queue + Worker (Not Synchronous)?

The Lambda middleware sends the WhatsApp message **synchronously** during the initial form submission (Step 4 in the architecture). In 95% of cases, Karix accepts and queues the message within 1–2 seconds, and WhatsApp delivers it within 5–15 seconds.

But for the **5% failure case** (Karix timeout, WhatsApp rate limit, network blip), we need a **retry queue** that operates independently of the original Lambda invocation (which has a 15-second timeout limit).

### 2b. Queue Architecture

```
┌──────────────┐
│  Form Submit │
│  (Lambda #1) │
└──────┬───────┘
       │
       ├──▶ Karix API (synchronous attempt)
       │    └──▶ Success? → Done (95% of cases)
       │    └──▶ Failure? → Enqueue to SQS ↓
       │
       ▼
┌──────────────┐         ┌──────────────────┐
│  AWS SQS     │────────▶│  Lambda #2        │
│  Retry Queue │         │  (Worker)          │
│              │         │                    │
│  Visibility: │         │  1. Dequeue message│
│  30 seconds  │         │  2. Retry Karix API │
│              │         │  3. Success? → Done │
│  Max        │         │  4. Fail? → Requeue │
│  Receive: 3 │         │     or SMS Failover │
└──────────────┘         └────────────────────┘
```

### 2c. SQS Message Structure

When the synchronous Karix call fails, Lambda enqueues:

```json
{
  "lead_id": "1501",
  "phone": "+919876543210",
  "patient_name": "Rahul",
  "clinic_name": "OrthoNow Indiranagar, Bengaluru",
  "submission_timestamp": "2026-07-01T10:30:00Z",
  "retry_count": 0,
  "sla_deadline": "2026-07-01T10:32:00Z"
}
```

### 2d. Retry Schedule

| Retry | Delay (from previous attempt) | Total elapsed from form submit |
| :--- | :--- | :--- |
| Initial (synchronous) | 0s | 0s |
| Retry 1 (from queue) | 10s | ~10s |
| Retry 2 (from queue) | 20s | ~30s |
| Retry 3 (from queue) | 40s | ~70s |
| **SMS Failover** | Immediate after Retry 3 fails | ~70s |

**Total worst case before SMS failover: ~70 seconds** — still within the 120-second SLA.

### 2e. SMS Failover

If all 3 WhatsApp retries fail, the worker sends an SMS via a backup provider (MSG91 or Twilio):

```http
POST https://api.msg91.com/api/v5/flow/
Authkey: {MSG91_AUTH_KEY}
Content-Type: application/json
```

```json
{
  "flow_id": "orthonow_sms_fallback",
  "recipients": [
    {
      "mobiles": "919876543210",
      "name": "Rahul",
      "clinic": "OrthoNow Indiranagar"
    }
  ]
}
```

**SMS Template**: "Hi Rahul, your OrthoNow consultation request for Indiranagar is confirmed. Our specialist will call you within 15 minutes. Call 1800-678-466 for help."

SMS delivery is near-instant (< 5 seconds) and has a 99%+ delivery rate in India.

---

## 3. Google Ads Conversion Firing

### 3a. Server-Side vs Client-Side Decision

| Approach | How It Works | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Client-Side** (GTM dataLayer) | `window.dataLayer.push({event: 'consultation_form_submitted'})` fires in browser → GTM sends to GA4/Ads | Already implemented in landing page | ❌ Fails if user closes tab before GTM loads. ❌ Blocked by ad blockers (30%+ on mobile in India). ❌ Can't attach conversion value. |
| **Server-Side** (Lambda → Google Ads API) | Lambda fires conversion via Google Ads API after successful HubSpot + WhatsApp | ✅ 100% reliable (user can't block it). ✅ Attaches GCLID + conversion value. ✅ Fires only on confirmed lead. | Requires Google Ads API setup + developer token. |
| **Hybrid** (both) ✅ | Client-side fires as backup signal; server-side is source of truth | Maximum coverage + accuracy | Slightly more complex |

**Selected: Hybrid approach.** The client-side `dataLayer.push` (already in `landing.html`) serves as a backup/immediate signal. The server-side Lambda fire is the **authoritative conversion** used for Smart Bidding.

### 3b. Server-Side Conversion via Google Ads API

The Lambda middleware fires the conversion after HubSpot and WhatsApp succeed (Step 5 in the architecture):

**GCLID Capture**: The landing page URL includes `?gclid={google_click_id}` (auto-appended by Google Ads auto-tagging). The frontend sends this in the POST body to the Lambda:

```json
{
  "name": "Rahul",
  "phone": "9876543210",
  "gclid": "Cj0KCQjwo....",
  "clinic_preference": "indiranagar_bengaluru"
}
```

**Lambda → Google Ads API:**

```http
POST https://googleads.googleapis.com/v17/customers/{CUSTOMER_ID}:uploadClickConversions
Authorization: Bearer {GOOGLE_ADS_ACCESS_TOKEN}
Developer-Token: {DEVELOPER_TOKEN}
Content-Type: application/json
```

```json
{
  "conversions": [
    {
      "gclid": "Cj0KCQjwo....",
      "conversionAction": "customers/{CUSTOMER_ID}/conversionActions/12345",
      "conversionValue": 500,
      "currencyCode": "INR",
      "conversionDateTime": "2026-07-01 10:30:05+00:00",
      "orderId": "ORTHO-1501-20260701"
    }
  ],
  "partialFailure": true
}
```

**Response (HTTP 200):**
```json
{
  "results": [
    {
      "gclid": "Cj0KCQjwo....",
      "conversionAction": "customers/{CUSTOMER_ID}/conversionActions/12345",
      "status": "SUCCESS"
    }
  ]
}
```

### 3c. Why ₹500 Conversion Value?

| Factor | Calculation |
| :--- | :--- |
| Average consultation fee | ₹3,500 |
| Lead-to-appointment conversion rate | ~15% |
| Expected revenue per lead | ₹3,500 × 15% = ₹525 |
| Rounded | ₹500 |

This enables **tROAS (Target ROAS) bidding** in Google Ads, which optimizes toward leads that are more likely to convert to paying patients — not just form fills.

### 3d. What If GCLID Is Missing?

If the user navigated to the landing page without a Google Ads click (e.g., direct visit, organic search), there's no GCLID. In this case:

1. Lambda skips the Google Ads conversion (no click to attribute to).
2. Lambda still fires the client-side `dataLayer.push` (which GA4 captures as a conversion regardless of source).
3. HubSpot records `lead_source: 'Direct'` or `lead_source: 'Organic Search'`.

This prevents inflated conversion counts — we only pay Google Ads for leads that actually came from Google Ads.

---

## 4. Timing Diagram (All Three Actions)

```
Time (seconds)   0s        1s        2s        3s        4s        5s     10s     15s
                 │         │         │         │         │         │       │       │
Form Submit ─────┤         │         │         │         │         │       │       │
                 │         │         │         │         │         │       │       │
Validate ────────┼─────────┤         │         │         │         │       │       │
(10ms)           │         │         │         │         │         │       │       │
                 │         │         │         │         │         │       │       │
HubSpot Search ──┼─────────────────────────────┤         │         │       │       │
(800ms)          │         │         │         │         │         │       │       │
                 │         │         │         │         │         │       │       │
HubSpot Upsert ──┼───────────────────────────────────────┤         │       │       │
(400ms)          │         │         │         │         │         │       │       │
                 │         │         │         │         │         │       │       │
Karix WhatsApp ──┼─────────────────────────────────────────────────┤       │       │
(500ms accept)   │         │         │         │         │         │       │       │
                 │         │         │         │         │         │       │       │
Google Ads ──────┼───────────────────────────────────────────────────────────┤       │
(300ms)          │         │         │         │         │         │       │       │
                 │         │         │         │         │         │       │       │
Response 200 ────┼───────────────────────────────────────────────────────────────────┤
(to frontend)    │         │         │         │         │         │       │       │
                 │         │         │         │         │         │       │       │
WhatsApp                                                    │       │       │
delivered ────────────────────────────────────────────────────────────────────────┤
(patient phone) │         │         │         │         │         │       │       │
                                                                          ▲
                                                                    SLA met: ~15s
                                                                    (Target: <120s)
```

**Lambda total execution**: ~2.5 seconds.
**WhatsApp delivery**: ~15 seconds (Karix API → WhatsApp servers → patient phone).
**Total wall clock**: ~15 seconds from form submit to WhatsApp on phone.
**SLA headroom**: ~105 seconds.
