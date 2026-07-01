# Task 01 — Phase 4: GA4 & Google Ads Optimization Strategy

This document provides step-by-step, production-ready configuration for GA4 and Google Ads so the OrthoNow tracking schema becomes a measurable, optimizable funnel. Every section includes the exact UI path and configuration values.

---

## 1. GA4 Property Setup

### 1a. Property Configuration

| Setting | Value |
| :--- | :--- |
| Property Name | `OrthoNow - Production` |
| Reporting Time Zone | `Asia/Kolkata (IST)` |
| Currency | `INR (₹)` |
| Industry Category | `Health/Medical` |
| Data Retention (User/Event) | `14 months` → **change to `14 months`** (default is 2 months; longer retention is required for Funnel Explorations) |

**Path**: GA4 → Admin → Property Settings → Data Retention and Reporting → set to **14 months**.

### 1b. Data Stream

| Setting | Value |
| :--- | :--- |
| Stream Type | Web |
| Stream URL | `https://www.orthonow.in` |
| Stream ID | (auto-generated) |
| Measurement ID | `G-XXXXXXXXXX` |

**Enhanced Measurement**: Enabled, but **disable** the following to avoid duplicate event conflicts:

| Enhanced Event | Status | Reason |
| :--- | :--- | :--- |
| Page views | ✅ Enabled | Core baseline |
| Scrolls | ❌ Disabled | We track custom `blog_scroll_depth` with richer params |
| Outbound clicks | ✅ Enabled | Useful for affiliate/partner links |
| Site search | ❌ Disabled | We track custom `search_performed` with `search_term` |
| Video engagement | ❌ Disabled | We track custom `video_engagement` via YouTube API |
| Form interactions | ❌ Disabled | Conflicts with our `form_start` custom event |

**Path**: GA4 → Admin → Data Streams → Web Stream → Configure tag settings → Enhanced Measurement → gear icon.

### 1c. Consent Mode v2 (India GDPR-equivalent compliance)

OrthoNow's WordPress site currently has no consent banner. For compliant tracking under India's DPDP Act 2023:

```html
<!-- Load before GTM container -->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'wait_for_update': 500
  });
</script>
<!-- GTM container script loads here -->
```

When the user accepts the cookie banner, fire:
```javascript
gtag('consent', 'update', {
  'ad_storage': 'granted',
  'ad_user_data': 'granted',
  'ad_personalization': 'granted',
  'analytics_storage': 'granted'
});
```

---

## 2. Custom Dimension Registration

These must be created in GA4 before the events appear in Explorations. **Parameters pushed via dataLayer without registration are invisible in reports.**

**Path**: GA4 → Admin → Custom Definitions → Create Custom Dimensions

| Dimension Name | Event Parameter | Scope | Description |
| :--- | :--- | :--- | :--- |
| Form ID | `form_id` | Event | Identifies which form the user interacted with |
| Form Name | `form_name` | Event | Human-readable form label |
| Step Number | `step_number` | Event | 1, 2, or 3 in the booking funnel |
| Step Name | `step_name` | Event | Machine-readable step identifier |
| Clinic Location | `clinic_location` | Event | City + clinic name |
| Clinic Preference | `clinic_preference` | Event | User's selected clinic |
| Clinic City | `clinic_city` | Event | Bengaluru / Hyderabad / Chennai |
| Specialty | `specialty` | Event | Knee, Spine, Sports, etc. |
| Doctor Name | `doctor_name` | Event | Profile viewed |
| Preferred Date | `preferred_date` | Event | ISO date string |
| Lead Source | `lead_source` | Event | Campaign attribution |
| Button Location | `button_location` | Event | hero / header / footer / sticky |
| File Name | `file_name` | Event | Downloaded PDF identifier |
| Scroll Percentage | `scroll_percentage` | Event | 25 / 50 / 75 / 90 |
| Read Time (sec) | `read_time_sec` | Event | Seconds spent before scroll milestone |
| Search Term | `search_term` | Event | What the user searched for |
| Video Title | `video_title` | Event | YouTube video identifier |

> **Total: 17 custom dimensions.** GA4 allows 50 per property (standard) — well within limits.

---

## 3. Conversions Configuration

**Path**: GA4 → Admin → Events → toggle **"Mark as conversion"**

### 3a. Primary Conversion

| Event | Status | Why |
| :--- | :--- | :--- |
| `consultation_form_submitted` | ✅ **Conversion** | Highest-intent action; validated lead with PII |

### 3b. Secondary Conversions (Micro)

| Event | Status | Purpose |
| :--- | :--- | :--- |
| `click_to_call` | ✅ Conversion | Offline conversion proxy for Smart Bidding experiments |
| `whatsapp_chat_initiated` | ✅ Conversion | Secondary engagement signal for audience expansion |
| `download_patient_guide` | ✅ Conversion | Mid-funnel content engagement |

> Micro-conversions are **not** imported into Google Ads for bidding. They are used for audience building and engagement analysis only.

### 3c. Conversion Value Model

Assigning value to conversions enables **value-based Smart Bidding** (tROAS) in Google Ads:

| Conversion | Value (₹) | Rationale |
| :--- | :--- | :--- |
| `consultation_form_submitted` | ₹500 | Average lead value; ~15% of a ₹3,500 consultation fee |
| `click_to_call` | ₹100 | Lower intent; 30% connect → appointment rate |
| `download_patient_guide` | ₹50 | Top-of-funnel engagement |

**Implementation**: Set value in the GA4 tag within GTM:
```javascript
// In the GA4 Event tag for consultation_form_submitted
// Add these parameters:
'value': 500,
'currency': 'INR'
```

---

## 4. Funnel Exploration Configuration

**Path**: GA4 → Explore → Funnel Exploration → New

### 4a. Funnel Settings

| Setting | Value |
| :--- | :--- |
| Funnel type | **Open funnel** (users can enter at any step) |
| Step timeout | **30 minutes** (user must complete next step within 30 min) |
| Breakdown | `clinic_city` (to compare Bengaluru vs Hyderabad vs Chennai drop-off) |

### 4b. Funnel Steps

| Step # | Event | Additional Filter | What it Measures |
| :--- | :--- | :--- | :--- |
| 1 | `form_start` | — | Users who started the booking journey |
| 2 | `booking_step_complete` | `step_number = 1` | Users who selected clinic + specialty |
| 3 | `booking_step_complete` | `step_number = 2` | Users who entered PII (name + phone) |
| 4 | `consultation_form_submitted` | — | Users who completed booking (conversion) |

### 4c. Expected Drop-off Targets (Benchmark)

Based on the healthcare industry benchmark (6–8% landing page conversion):

| Transition | Target Completion Rate | Current (2.1%) | Action if Below Target |
| :--- | :--- | :--- | :--- |
| Step 1 → Step 2 | 70%+ | Unknown | Simplify clinic dropdown; reduce options |
| Step 2 → Step 3 | 50%+ | Unknown | Shorten PII form; remove date field |
| Step 3 → Conversion | 85%+ | Unknown | Optimize API response time; reduce loading |

---

## 5. Remarketing Audiences

**Path**: GA4 → Admin → Audiences → New Audience → Create Custom Audience

### 5a. Funnel-Based Audiences

| Audience Name | Definition | Exported To | Use Case |
| :--- | :--- | :--- | :--- |
| `Cart Abandoners - Step 1 Only` | `booking_step_complete (step 1)` AND NOT `booking_step_complete (step 2)` within 24h | Google Ads | Retarget with "Pick your clinic today" |
| `Cart Abandoners - Step 2 Only` | `booking_step_complete (step 2)` AND NOT `consultation_form_submitted` within 24h | Google Ads | Retarget with "You're one step away" |
| `Form Starters - No Step Completion` | `form_start` AND NOT `booking_step_complete` within 1h | Google Ads | Retarget with urgency messaging |

### 5b. Content Engagement Audiences

| Audience Name | Definition | Use Case |
| :--- | :--- | :--- |
| `Blog Engaged - Knee Pain` | `blog_scroll_depth` (75%+) AND `page_path` contains `/blog/knee` | Cross-sell consultation for knee specialty |
| `Guide Downloaders` | `download_patient_guide` within 7 days | Nurture sequence → consultation CTA |
| `Doctor Profile Viewers` | `doctor_profile_view` within 7 days | Retarget with that specific doctor's availability |

---

## 6. Google Ads Conversion Import

### 6a. Import Steps

1. **GA4 Side**: Ensure `consultation_form_submitted` is marked as a conversion (Section 3a).
2. **Google Ads Side**: Tools & Settings → Conversions → **New conversion action** → **Import from GA4**.
3. Select `consultation_form_submitted` from the list.
4. Configure:

| Setting | Value |
| :--- | :--- |
| Conversion Name | `OrthoNow Consultation Lead` |
| Value | `Use the same value for each conversion` → ₹500 |
| Count | `One` (one conversion per click — lead quality over volume) |
| Click-through window | `7 days` (healthcare decisions are shorter-window) |
| Include in "Conversions" | ✅ Yes (for Smart Bidding) |
| Include in "All Conversions" | ✅ Yes |
| Attribution model | `Data-driven` (default; let Google allocate credit) |

### 6b. Why Only One Conversion for Bidding

Importing multiple conversions (calls, WhatsApp, form submits) into Google Ads Smart Bidding causes the algorithm to optimize toward the **easiest** action (clicks/WhatsApp), not the most valuable (form submit). By importing only `consultation_form_submitted` as the bidding conversion, we force Smart Bidding to find users most likely to submit a lead.

---

## 7. Debugging & Verification Protocol

### 7a. GA4 DebugView

**Path**: GA4 → Admin → DebugView

1. Install the **GA Debugger** Chrome extension (or append `?gtm_debug=x` to URL).
2. Enable debug mode.
3. Walk through the 3-step form.
4. Verify each event appears in DebugView with correct parameters in real-time.

### 7b. GTM Preview Mode

1. GTM → **Preview** → enter the landing page URL.
2. Complete each form step.
3. Verify each tag fires on the correct trigger with the correct parameters.
4. Check the **Tags Fired** vs **Tags Not Fired** panel.

### 7c. Console Verification (For This Repo)

Open `index.html` locally → Console → run:

```javascript
// After completing all 3 steps
window.dataLayer.forEach(function(item, i) {
    if (item.event) console.log(i, item.event, item.step_name || '');
});
```

Expected output:
```
0 form_start
1 booking_step_complete location_specialty_selected
2 booking_step_complete user_details_submitted
3 consultation_form_submitted booking_confirmed
```

If all 4 events appear in order, the implementation is verified.
