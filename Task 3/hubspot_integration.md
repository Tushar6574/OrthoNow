# Task 03 — Phase 2: HubSpot Integration Specification

This document specifies the exact HubSpot CRM integration: property mapping, the phone-based deduplication flow with real API request/response JSON, and edge case handling for the "same phone, different name" scenario.

---

## 1. Contact Property Mapping

Every field collected on the landing page must be mapped to a HubSpot contact property. Some properties are HubSpot defaults; others must be created as custom properties.

### 1a. Property Mapping Table

| Landing Page Field | HubSpot Property Name | Property Type | HubSpot Field Group | Default or Custom? | Example Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Patient Name | `firstname` | String (single-line) | Contact Information | Default | Rahul |
| (not collected) | `lastname` | String | Contact Information | Default | Sharma |
| Phone Number | `phone` | String (phone) | Contact Information | Default | 9876543210 |
| Clinic Preference | `clinic_preference` | Enumeration (dropdown) | OrthoNow Custom | **Custom** | indiranagar_bengaluru |
| (server-injected) | `lead_source` | String | OrthoNow Custom | **Custom** | Google Ads - Consultation Landing Page |
| (server-injected) | `hs_lead_status` | Enumeration | Lead Status (default) | Default | NEW |
| (server-injected) | `hs_analytics_source` | String | Analytics | Default | PAID_SEARCH |
| (server-injected) | `campaign_name` | String | OrthoNow Custom | **Custom** | Book a Consultation 2026 |
| (server-injected) | `submission_timestamp` | DateTime | OrthoNow Custom | **Custom** | 2026-07-01T10:30:00Z |

### 1b. Custom Properties to Create in HubSpot

Before the integration goes live, create these custom properties in HubSpot:

**Path**: HubSpot → Contacts → Properties → Create Property

| Property | Label | Group | Type | Options |
| :--- | :--- | :--- | :--- | :--- |
| `clinic_preference` | Clinic Preference | OrthoNow Custom | Dropdown | `indiranagar_bengaluru`, `jayanagar_bengaluru`, `whitefield_bengaluru`, `hitech_city_hyderabad`, `jubilee_hills_hyderabad`, `adyar_chennai`, `anna_nagar_chennai` |
| `lead_source` | Lead Source | OrthoNow Custom | Single-line text | — |
| `campaign_name` | Campaign Name | OrthoNow Custom | Single-line text | — |
| `submission_timestamp` | Submission Timestamp | OrthoNow Custom | Date picker | — |

### 1c. Lead Status Pipeline

| Status Value | Meaning | When Set |
| :--- | :--- | :--- |
| `NEW` | New Enquiry | On form submission (this integration) |
| `IN_PROGRESS` | Clinic called patient | When front desk makes the callback |
| `OPEN` | Appointment booked | When consultation is scheduled |
| `UNQUALIFIED` | Not a valid lead | When patient declines or is unreachable after 3 attempts |
| `CLOSED_WON` | Consultation completed | When patient visits the clinic |

---

## 2. Phone-Based Deduplication (The Trap)

### 2a. The Problem

HubSpot's **default deduplication is email-based**. If two contacts are created without an email (or with different emails), HubSpot creates **duplicate records** even if the phone number is identical.

For OrthoNow, the landing page collects **only Name + Phone — no email**. Without custom deduplication, every form submission creates a new contact, even if the same patient submits 5 times.

### 2b. The Solution: Search Before Create

The Lambda middleware performs a HubSpot CRM Search API call **before** any create/update operation. This makes the phone number the deduplication key.

#### Step 1: Search for Existing Contact by Phone

**Request:**
```http
POST https://api.hubapi.com/crm/v3/objects/contacts/search
Authorization: Bearer {HUBSPOT_ACCESS_TOKEN}
Content-Type: application/json
```

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "phone",
          "operator": "EQ",
          "value": "9876543210"
        }
      ]
    }
  ],
  "properties": [
    "firstname",
    "lastname",
    "phone",
    "clinic_preference",
    "hs_lead_status",
    "lead_source"
  ],
  "limit": 1
}
```

#### Step 2a: If Contact EXISTS (Response 200 with results)

**Response:**
```json
{
  "total": 1,
  "results": [
    {
      "id": "1501",
      "properties": {
        "firstname": "Rahul",
        "lastname": "Sharma",
        "phone": "9876543210",
        "clinic_preference": "indiranagar_bengaluru",
        "hs_lead_status": "OPEN",
        "lead_source": "Google Ads - Consultation Landing Page"
      },
      "createdAt": "2026-06-15T08:30:00.000Z",
      "updatedAt": "2026-06-20T14:00:00.000Z"
    }
  ]
}
```

**Action**: Update the existing contact — reset Lead Status to `NEW`, update `submission_timestamp`, add a note about the new enquiry.

**Request:**
```http
PATCH https://api.hubapi.com/crm/v3/objects/contacts/1501
Authorization: Bearer {HUBSPOT_ACCESS_TOKEN}
Content-Type: application/json
```

```json
{
  "properties": {
    "hs_lead_status": "NEW",
    "clinic_preference": "indiranagar_bengaluru",
    "lead_source": "Google Ads - Consultation Landing Page",
    "campaign_name": "Book a Consultation 2026",
    "submission_timestamp": "2026-07-01T10:30:00Z"
  }
}
```

#### Step 2b: If Contact Does NOT Exist (Response 200, total: 0)

**Response:**
```json
{
  "total": 0,
  "results": []
}
```

**Action**: Create a new contact.

**Request:**
```http
POST https://api.hubapi.com/crm/v3/objects/contacts
Authorization: Bearer {HUBSPOT_ACCESS_TOKEN}
Content-Type: application/json
```

```json
{
  "properties": {
    "firstname": "Rahul",
    "lastname": "Sharma",
    "phone": "9876543210",
    "clinic_preference": "indiranagar_bengaluru",
    "hs_lead_status": "NEW",
    "hs_analytics_source": "PAID_SEARCH",
    "lead_source": "Google Ads - Consultation Landing Page",
    "campaign_name": "Book a Consultation 2026",
    "submission_timestamp": "2026-07-01T10:30:00Z"
  }
}
```

**Response:**
```json
{
  "id": "1587",
  "properties": {
    "firstname": "Rahul",
    "phone": "9876543210",
    "hs_lead_status": "NEW",
    "createdate": "2026-07-01T10:30:01.000Z"
  }
}
```

---

## 3. Edge Case: Same Phone, Different Name

### The Scenario

A patient (Rahul, 9876543210) books a consultation. Two days later, his wife (Priya) uses the same phone number to book with her name.

### What Happens in Our Setup

1. Lambda searches HubSpot for phone `9876543210` → **Contact found** (Rahul, ID 1501).
2. Lambda does NOT overwrite `firstname` with "Priya" (this would lose Rahul's identity).
3. Instead, Lambda performs two actions:

#### Action A: Add a Note to the Existing Contact

```http
POST https://api.hubapi.com/crm/v3/objects/contacts/1501/notes
Authorization: Bearer {HUBSPOT_ACCESS_TOKEN}
Content-Type: application/json
```

```json
{
  "engagement": {
    "active": true,
    "type": "NOTE"
  },
  "metadata": {
    "body": "New enquiry received from this phone number under the name 'Priya'. Clinic preference: Indiranagar, Bengaluru. Possible family member. Please confirm identity during callback."
  }
}
```

#### Action B: Reset Lead Status and Update Clinic Preference

```json
{
  "properties": {
    "hs_lead_status": "NEW",
    "clinic_preference": "indiranagar_bengaluru",
    "submission_timestamp": "2026-07-03T14:00:00Z"
  }
}
```

### Why Not Create a Duplicate?

| Approach | Result | Problem |
| :--- | :--- | :--- |
| **Overwrite name** | Contact becomes "Priya" | Loses Rahul's identity. Bad data. |
| **Create duplicate** | Two contacts with same phone | Front desk calls twice. Marketing double-counts. Analytics corrupted. |
| **Note + status reset** ✅ | Rahul's record stays. Priya's enquiry is captured. Front desk sees the note and asks "Am I speaking with Rahul or Priya?" | Slight manual effort, but **zero data loss or duplication**. |

### Alternative: HubSpot Custom Property for "Secondary Contact"

If this scenario is frequent (common in Indian households), add a custom property:

| Property | Label | Type | Purpose |
| :--- | :--- | :--- | :--- |
| `secondary_contact_name` | Secondary Contact Name | String | Captures alternate names associated with the same phone |

Lambda sets `secondary_contact_name: "Priya"` alongside the note. This makes the data queryable and reportable.

---

## 4. API Rate Limiting

HubSpot API has rate limits that the middleware must respect:

| Limit Type | Threshold | Handling |
| :--- | :--- | :--- |
| Burst (per second) | 100 requests / 10 seconds | Lambda processes one lead at a time — unlikely to hit this |
| Daily (private apps) | 250,000 requests / day | Search (1) + Create/Update (1) = 2 requests per lead. At 1,000 leads/day = 2,000 requests. Well within limit. |
| Search API specifically | 4 requests / second | Lambda is sequential — 1 search per invocation |

If rate limit is hit (HTTP 429), Lambda implements exponential backoff:

```javascript
// Retry logic in Lambda
async function hubspotRequest(options, retries = 3) {
    try {
        const response = await fetch(options.url, options);
        if (response.status === 429) throw new Error('RATE_LIMITED');
        return response;
    } catch (error) {
        if (retries > 0 && error.message === 'RATE_LIMITED') {
            const delay = Math.pow(2, (4 - retries)) * 1000; // 1s, 2s, 4s
            await new Promise(r => setTimeout(r, delay));
            return hubspotRequest(options, retries - 1);
        }
        throw error;
    }
}
```

---

## 5. HubSpot Lifecycle Stage vs Lead Status

These are two different fields — don't confuse them:

| Field | Purpose | Our Value |
| :--- | :--- | :--- |
| `lifecyclestage` | HubSpot's pipeline stage (system-level) | `lead` |
| `hs_lead_status` | Custom lead qualification status | `NEW` |

Both should be set on every contact creation:

```json
{
  "properties": {
    "lifecyclestage": "lead",
    "hs_lead_status": "NEW"
  }
}
```

---

## 6. Webhook: HubSpot → Lambda (Reverse Sync)

In addition to the Lambda → HubSpot flow (creating/updating contacts), we also configure a HubSpot webhook for the reverse direction:

**Purpose**: When a front desk agent manually updates a contact in HubSpot (e.g., changes Lead Status to `OPEN` — appointment booked), HubSpot notifies our system.

**Configuration**: HubSpot → Settings → Webhooks → New Workflow

| Event | Target URL | Purpose |
| :--- | :--- | :--- |
| Contact property changed (`hs_lead_status` → `OPEN`) | `POST /api/webhooks/hubspot` | Triggers WhatsApp appointment confirmation |

This closes the loop: form submission creates the lead → front desk books the appointment → webhook triggers a second WhatsApp with appointment details.
