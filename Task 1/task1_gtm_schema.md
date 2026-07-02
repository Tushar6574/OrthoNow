# Task 01: GTM Event Schema - OrthoNow

This document defines the complete Google Tag Manager (GTM) event tracking schema for OrthoNow's digital properties. It covers naming conventions, the full event taxonomy with parameter-level definitions, the 3-step booking funnel implementation, GA4 funnel configuration, and Google Ads conversion strategy.

---

## 1. Naming Conventions & Standards

All events, parameters, and GTM container assets follow these rules to ensure consistency across GTM, GA4, and downstream systems (HubSpot, Google Ads).

### Event Naming
| Rule | Example |
| :--- | :--- |
| `snake_case` only — lowercase with underscores | `booking_step_complete` |
| Verb-noun structure for actions | `click_to_call`, `download_guide` |
| State-based names for views/impressions | `clinic_page_view`, `form_start` |
| No spaces, camelCase, or special characters | ❌ `BookingStepComplete`, `booking-step` |

### Parameter Naming
| Rule | Example |
| :--- | :--- |
| `snake_case`, descriptive and singular | `clinic_location`, `specialty` |
| PII fields suffixed with `_hashed` when hashed | `phone_number_hashed` |
| Boolean flags prefixed with `is_` | `is_returning_visitor` |

### GTM Container Asset Naming
| Asset Type | Convention | Example |
| :--- | :--- | :--- |
| Variable - Data Layer | `DLV - {parameter}` | `DLV - step_number` |
| Trigger - Custom Event | `CE - {event_name}` | `CE - booking_step_complete` |
| Tag - GA4 Event | `GA4 - {event_name}` | `GA4 - booking_step_complete` |

---

## 2. Complete Event Schema

Each event carries a **minimum of 3 parameters** as required by the brief.

### 2a. Master Event Table

| # | Event Name | Trigger Type | Key Parameters (min 3) | GA4 Report / Audience |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `form_start` | Element Visibility (Form visible) | `form_id`, `form_name`, `page_path` | Funnel Exploration / High Intent |
| 2 | `booking_step_complete` | Custom Event (dataLayer) | `step_number`, `step_name`, `clinic_location`, `specialty` | Funnel Exploration (Drop-off) |
| 3 | `consultation_form_submitted` | Custom Event (dataLayer) | `form_id`, `clinic_preference`, `specialty`, `lead_source` | Conversions (Primary) / Lead Quality |
| 4 | `click_to_call` | Click — `tel:` links | `link_url`, `link_text`, `button_location`, `page_path` | Engagement / Offline Conversion Proxy |
| 5 | `whatsapp_chat_initiated` | Click — `wa.me` links | `link_url`, `button_location`, `page_path`, `referral_source` | Engagement / Social Interaction |
| 6 | `download_patient_guide` | Custom Event (dataLayer) | `file_name`, `file_type`, `lead_source`, `page_path` | Lead Gen / Gated Content Audience |
| 7 | `clinic_page_view` | Page View (regex match) | `clinic_name`, `clinic_city`, `page_path`, `page_referrer` | Traffic / Geo Segmentation |
| 8 | `doctor_profile_view` | Page View (regex match) | `doctor_name`, `specialty`, `clinic_city`, `page_path` | Content Engagement / Remarketing |
| 9 | `blog_scroll_depth` | Scroll (25/50/75/90%) | `page_title`, `scroll_percentage`, `page_path`, `read_time_sec` | Content Engagement / Remarketing |
| 10 | `search_performed` | Form Submit (Search) | `search_term`, `search_category`, `results_count`, `page_path` | Site Search / Intent Segmentation |
| 11 | `video_engagement` | YouTube API (50% / complete) | `video_title`, `video_percent`, `video_duration`, `page_path` | Content Engagement |
| 12 | `newsletter_signup` | Custom Event (dataLayer) | `form_id`, `signup_source`, `page_path`, `lead_source` | Lead Gen / Nurturing Audience |
| 13 | `mobility_quiz_completed` | Custom Event (dataLayer) | `quiz_result`, `form_id`, `page_path` | Engagement / Conversion Priming |

### 2b. Parameter Definitions

These must be registered as **Custom Dimensions** in GA4 (Admin → Custom Definitions) for them to appear in Explorations and reports.

| Parameter | GA4 Scope | Data Type | Example Value | Custom Dim? |
| :--- | :--- | :--- | :--- | :--- |
| `form_id` | Event | string | `main_appointment_form` | Yes |
| `form_name` | Event | string | `Consultation Booking` | Yes |
| `step_number` | Event | integer | `1` | Yes |
| `step_name` | Event | string | `location_specialty_selected` | Yes |
| `quiz_result` | Event | string | `high_risk` / `low_risk` | **Yes** |
| `clinic_location` | Event | string | `Indiranagar, Bengaluru` | Yes |
| `clinic_preference` | Event | string | `Indiranagar` | Yes |
| `clinic_name` | Event | string | `OrthoNow Indiranagar` | Yes |
| `clinic_city` | Event | string | `Bengaluru` | Yes |
| `specialty` | Event | string | `Knee Replacement` | Yes |
| `doctor_name` | Event | string | `Dr. Rajesh Kumar` | Yes |
| `preferred_date` | Event | string (ISO) | `2026-07-15` | Yes |
| `lead_source` | Event | string | `Google Ads - Consultation Landing Page` | Yes |
| `button_location` | Event | string | `hero`, `header`, `footer`, `sticky` | Yes |
| `link_url` | Event | string | `tel:1800ORTHO` | Yes |
| `link_text` | Event | string | `Call Now` | Yes |
| `file_name` | Event | string | `knee-pain-guide.pdf` | Yes |
| `file_type` | Event | string | `pdf` | Yes |
| `scroll_percentage` | Event | integer | `75` | Yes |
| `read_time_sec` | Event | integer | `120` | Yes |
| `search_term` | Event | string | `knee replacement cost` | Yes |
| `video_title` | Event | string | `Post-Op Recovery Guide` | Yes |
| `page_path` | (Built-in) | string | `/indiranagar` | No |

---

## 3. GTM Container Configuration

This section maps every event to its GTM Variable, Trigger, and Tag so a developer can replicate the container from scratch.

### 3a. Data Layer Variables (DLV)

Create these in **GTM → Variables → User-Defined Variables → Data Layer Variable**:

| Variable Name | Data Layer Variable Name |
| :--- | :--- |
| `DLV - step_number` | `step_number` |
| `DLV - step_name` | `step_name` |
| `DLV - clinic_location` | `clinic_location` |
| `DLV - specialty` | `specialty` |
| `DLV - form_id` | `form_id` |
| `DLV - lead_source` | `lead_source` |
| `DLV - file_name` | `file_name` |
| `DLV - scroll_percentage` | `scroll_percentage` |
| `DLV - button_location` | `button_location` |

### 3b. Triggers

| Trigger Name | Type | Configuration |
| :--- | :--- | :--- |
| `CE - form_start` | Custom Event | Event name equals `form_start` |
| `CE - booking_step_complete` | Custom Event | Event name equals `booking_step_complete` |
| `CE - consultation_form_submitted` | Custom Event | Event name equals `consultation_form_submitted` |
| `CE - download_patient_guide` | Custom Event | Event name equals `download_patient_guide` |
| `CE - newsletter_signup` | Custom Event | Event name equals `newsletter_signup` |
| `Click - tel: links` | Click — All Elements | `{{Click URL}}` matches RegEx `tel:.*` |
| `Click - wa.me links` | Click — All Elements | `{{Click URL}}` contains `wa.me` |
| `Scroll - 25%` | Scroll Depth | Vertical scroll at 25% |
| `Scroll - 50%` | Scroll Depth | Vertical scroll at 50% |
| `Scroll - 75%` | Scroll Depth | Vertical scroll at 75% |
| `Scroll - 90%` | Scroll Depth | Vertical scroll at 90% |
| `Page View - Clinic Pages` | Page View | `{{Page Path}}` matches RegEx `^/(indiranagar\|jayanagar\|whitefield\|hitech-city\|jubilee-hills\|adyar\|anna-nagar)` |
| `Page View - Doctor Profiles` | Page View | `{{Page Path}}` matches RegEx `^/doctors/` |

### 3c. Tags (GA4 Events)

Every tag uses the GA4 Configuration tag as the base and sends the event with its parameters.

| Tag Name | GA4 Event Name | Trigger | Parameters Passed |
| :--- | :--- | :--- | :--- |
| `GA4 - form_start` | `form_start` | `CE - form_start` | `form_id`, `form_name`, `page_path` |
| `GA4 - booking_step_complete` | `booking_step_complete` | `CE - booking_step_complete` | `step_number`, `step_name`, `clinic_location`, `specialty` |
| `GA4 - consultation_form_submitted` | `consultation_form_submitted` | `CE - consultation_form_submitted` | `form_id`, `clinic_preference`, `specialty`, `lead_source` |
| `GA4 - click_to_call` | `click_to_call` | `Click - tel: links` | `link_url`, `link_text`, `button_location`, `page_path` |
| `GA4 - whatsapp_chat_initiated` | `whatsapp_chat_initiated` | `Click - wa.me links` | `link_url`, `button_location`, `page_path`, `referral_source` |
| `GA4 - download_patient_guide` | `download_patient_guide` | `CE - download_patient_guide` | `file_name`, `file_type`, `lead_source`, `page_path` |
| `GA4 - clinic_page_view` | `clinic_page_view` | `Page View - Clinic Pages` | `clinic_name`, `clinic_city`, `page_path`, `page_referrer` |
| `GA4 - blog_scroll_depth` | `blog_scroll_depth` | `Scroll - 25/50/75/90%` | `page_title`, `scroll_percentage`, `page_path`, `read_time_sec` |

---

## 4. 3-Step Booking Form Funnel

The brief asks how funnel drop-off is tracked between steps. GTM **cannot natively listen** to multi-step form interactions without custom `dataLayer.push()` calls written by the front-end developer. Below is the complete specification.

### Who writes the dataLayer push?

**The front-end developer writes the push.** The GTM analyst configures the Custom Event trigger and GA4 tag to listen for it. The analyst briefs the dev with the exact JSON structure (shown below) and the DOM event that should trigger each push.

### Step 1: Location & Specialty Selected

**Brief for dev**: On click of the "Next" button after the user selects clinic and specialty, push:

```json
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  'event': 'booking_step_complete',
  'step_number': 1,
  'step_name': 'location_specialty_selected',
  'clinic_location': 'Indiranagar, Bengaluru',
  'specialty': 'Knee Replacement'
});
```

### Step 2: User Details Entered

**Brief for dev**: On click of the "Next" button after the user fills name, phone, and preferred date — and **after client-side validation passes**:

```json
window.dataLayer.push({
  'event': 'booking_step_complete',
  'step_number': 2,
  'step_name': 'user_details_submitted',
  'preferred_date': '2026-07-15',
  'form_id': 'main_appointment_form'
});
```

### Step 3: Booking Confirmed (Primary Conversion)

**Brief for dev**: On receipt of a successful API response (HTTP 200) from the backend booking endpoint, before showing the thank-you state:

```json
window.dataLayer.push({
  'event': 'consultation_form_submitted',
  'step_number': 3,
  'step_name': 'booking_confirmed',
  'clinic_location': 'Indiranagar, Bengaluru',
  'specialty': 'Knee Replacement',
  'lead_source': 'Google Ads - Consultation Landing Page'
});
```

> **Live Verification**: This implementation is functional in the `index.html` landing page in this repo. Open the page in a browser, open the Console, and step through the form. Inspect `window.dataLayer` after each step to see the live events with real user data.

---

## 5. GA4 Funnel Exploration (Step-Level Drop-off)

In GA4 → **Explore → Funnel Exploration**, configure:

| Step | Event Name | Filter |
| :--- | :--- | :--- |
| 1 | `form_start` | — |
| 2 | `booking_step_complete` | `step_number = 1` |
| 3 | `booking_step_complete` | `step_number = 2` |
| 4 | `consultation_form_submitted` | — |

**Settings**: Make funnel open (users can enter at any step) and set a 30-minute timeout between steps. This surfaces exact drop-off between each transition — for example, if 60% abandon at Step 2 (entering phone number), that signals friction in the PII collection step, not in clinic selection.

**Audience**: Create an audience of users who completed Step 1 but not Step 4 (`booking_step_completers_non_converters`). This audience is exported to Google Ads for remarketing with a "Still interested? Book your slot" creative.

---

## 6. Google Ads Conversion Import

### Selected Conversion: `consultation_form_submitted`

This event is marked as a **Conversion** in GA4 (Admin → Events → toggle "Mark as conversion"). It is then imported into Google Ads via **Tools → Conversions → Import from GA4**.

### Why this event over the others?

| Candidate Event | Why / Why Not |
| :--- | :--- |
| `consultation_form_submitted` | ✅ **Selected** — fires only on successful submission with validated PII. Highest intent. Directly tieable to revenue (lead → appointment → billing). |
| `click_to_call` | ❌ Fires on intent, not confirmation. User may not connect or may not be a qualified lead. Inflates conversion volume with low-quality data. |
| `booking_step_complete (Step 1)` | ❌ Too early in funnel. No PII captured. Would optimize Google Ads toward "tire-kickers," not leads. |
| `whatsapp_chat_initiated` | ❌ Click-based, no completion confirmation. WhatsApp chats have high drop-off after first message. |

**Rationale**: Smart Bidding needs clean, high-intent signals to optimize toward. `consultation_form_submitted` gives Google Ads the strongest possible signal: a validated lead with clinic preference, captured after a 3-step commitment from the user. This directly improves cost-per-lead and lead quality.
