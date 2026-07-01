# Task 03: Integration Design - OrthoNow

This document outlines the end-to-end architecture to connect the OrthoNow landing page with HubSpot CRM, Karix (WhatsApp), and Google Ads.

## 1. Architectural Design

I recommend a **Serverless Middleware Approach** (using a tool like **Make.com** or a custom **Node.js Lambda**) rather than a native HubSpot embed. This is necessary to handle the complex deduplication logic and multi-step API orchestration required.

### Data Flow & Order of Operations:
1.  **Frontend Submission**: The `index.html` form sends a POST request with payload `{name, phone, clinic_preference}` to the middleware webhook.
2.  **HubSpot Search & Upsert**:
    - **The Trap**: HubSpot deduplicates on `email` by default. Since we only collect `phone`, we must first use the **HubSpot CRM Search API** to check for existing contacts by the `phone` property.
    - If found: Update the existing contact with `Lead Status = 'New Enquiry'` and `Clinic Preference`.
    - If not found: Create a new contact.
3.  **Lead Attribution**: Explicitly set `hs_analytics_source = 'Paid Search'` and `Source = 'Google Ads - Consultation Landing Page'` to preserve attribution.
4.  **WhatsApp Trigger**: Send a request to the **Karix WhatsApp Business API**.
5.  **Analytics Callback**: Fire the Google Ads conversion pixel via the **Google Ads API (Offline Conversions)** or by triggering a GTM server-side event to ensure 100% data accuracy even if the user closes the thank-you page early.

---

## 2. The HubSpot Deduplication Trap

**Challenge**: In Indian healthcare, leads often provide only a phone number. HubSpot's default behavior would create duplicate contacts for the same phone number if the email is missing or different.

**Solution**:
Before calling the Create Contact API, the middleware must execute:
`POST /crm/v3/objects/contacts/search`
Filter: `phone` EQUALS `[submitted_number]`

**Scenario**: If two patients submit with the same phone number but different names (e.g., a husband booking for a wife):
- **Strategy**: I would implement "Append Logic" where the new name is added as a secondary property or a "Relationship" note, rather than overwriting the primary contact. This prevents data loss while maintaining a clean "Phone-as-ID" model.

---

## 3. Failure Points & Fallbacks

### Single Biggest Failure Point: **Karix/WhatsApp API Downtime**
If the WhatsApp API is down, the 2-minute SLA is breached immediately.

**Fallback**:
- **Retry Queue**: Implement an exponential backoff retry mechanism (3 retries).
- **SMS Failover**: If the WhatsApp message fails after 2 retries, the middleware automatically triggers a transactional SMS via a secondary provider (e.g., Twilio or MSG91) as a fallback.

### Monitoring the 2-Minute SLA
- **Latency Monitoring**: Use a tool like **Sentry** or **Datadog** to track "Time to Delivery" for the Karix webhook.
- **Dead Letter Queue (DLQ)**: Any lead that hasn't received a WhatsApp confirmation within 90 seconds triggers an internal Slack/Email alert to the clinic's front-desk team to perform a manual call immediately.
