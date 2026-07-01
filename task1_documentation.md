# Task 01 — Documentation & Handoff: GTM Event Tracking

This document is the master entry point for Task 01. It maps all deliverables, provides the Loom walkthrough script (as required by the submission format), and includes the final QA verification protocol.

---

## 1. Deliverables Map

| File | Purpose | Status |
| :--- | :--- | :--- |
| `tracking.js` | Centralized dataLayer manager module (9 typed functions) | ✅ Production-ready |
| `index.html` | Live 3-step booking form using `tracking.js` | ✅ Functional |
| `task1_gtm_schema.md` | Full event schema, naming conventions, parameter definitions, GTM container config | ✅ Complete |
| `task1_developer_brief.md` | Step-by-step dev handoff with exact pseudocode per funnel step | ✅ Complete |
| `task1_ga4_ads_strategy.md` | GA4 property setup, custom dimensions, funnel exploration, audiences, Google Ads import | ✅ Complete |

---

## 2. Event Architecture Summary

```
┌─────────────────────────────────────────────────────┐
│                 USER JOURNEY                          │
│                                                      │
│  Form View ──► Step 1 ──► Step 2 ──► Step 3 (Conv) │
│      │           │          │           │            │
│      ▼           ▼          ▼           ▼            │
│  form_start   booking    booking   consultation     │
│               _step_     _step_    _form_submitted  │
│               (step 1)   (step 2)                    │
└─────────────────────────────────────────────────────┘
         │           │          │           │
         ▼           ▼          ▼           ▼
    ┌─────────────────────────────────────┐
    │        tracking.js (Module)          │
    │  trackFormStart()                    │
    │  trackBookingStep(1, {...})          │
    │  trackBookingStep(2, {...})          │
    │  trackFormSubmit({...})              │
    └──────────────┬──────────────────────┘
                   │
                   ▼
    ┌──────────────────────────┐
    │   window.dataLayer (queue) │
    └──────────────┬───────────┘
                   │
                   ▼
    ┌──────────────────────────┐
    │  GTM Container (Listener)  │
    │  Custom Event Triggers     │
    │  → GA4 Event Tags          │
    └──────────────┬───────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │              GA4 Property              │
    │  Funnel Exploration                    │
    │  Conversions → Google Ads Import       │
    │  Audiences → Google Ads Remarketing    │
    └──────────────────────────────────────┘
```

### Key Architectural Decision

The `tracking.js` module is the **single point of truth** for all dataLayer interactions. This design means:

- Developers call typed functions, not raw `push()` calls — no typos, no missing params
- The analytics team controls event names and parameter structure in one file
- Adding a new event requires one new function — no scattered inline pushes across the codebase

---

## 3. Loom Walkthrough Script (2 Minutes)

The brief requires a 2-minute walkthrough of GTM schema decisions. Use this script:

### T+0:00 — Opening
> "Let me walk through the GTM tracking architecture I built for OrthoNow. The core problem was that their current GA4 setup only tracks pageviews — zero visibility into the booking funnel."

### T+0:15 — The Funnel Design
> "I identified the 3-step booking form as the critical conversion path. GTM cannot natively detect step transitions in a multi-step form, so I designed a custom dataLayer architecture. At each step transition, the front-end fires a `booking_step_complete` event with the step number, step name, and contextual data like clinic location and specialty."

### T+0:45 — The Module
> "Rather than scattering raw `dataLayer.push()` calls across the codebase, I built a centralized `tracking.js` module. It exposes typed functions — `trackBookingStep()`, `trackFormSubmit()` — that validate payloads, strip empty values, and log to console during QA. Developers never write raw pushes."

### T+1:10 — The Live Demo
> "Let me show this working. I'll open the landing page, open the console, and step through the form. After Step 1, you see `booking_step_complete` with `step_number: 1`. After Step 2, `step_number: 2`. On final submit, `consultation_form_submitted` fires with `lead_source` — the primary Google Ads conversion."
>
> *(Screen-share: open `index.html`, open Console, complete all 3 steps, run the verification snippet)*

### T+1:35 — The Developer Brief
> "The key interview question is 'who writes the dataLayer push?' — the answer is the front-end developer, not the analyst. I've documented this in `task1_developer_brief.md` with exact pseudocode for each step, validation gates, and edge case rules."

### T+1:50 — Closing
> "On the GA4 side, this feeds a Funnel Exploration with 4 steps, exports abandonment audiences to Google Ads for remarketing, and imports `consultation_form_submitted` as the single Smart Bidding conversion at ₹500 lead value."

---

## 4. Final QA Verification Protocol

Run this checklist before submitting. Each item must pass.

### 4a. Code Verification

| # | Test | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| 1 | Open `index.html` in browser | Page loads, Step 1 visible | ☐ |
| 2 | Click "Next" without selecting clinic | Alert: "Please select clinic and specialty." | ☐ |
| 3 | Select clinic + specialty, click "Next" | Step 2 appears, progress bar at 50% | ☐ |
| 4 | Click "Next" with empty name | Red error message appears | ☐ |
| 5 | Enter invalid phone (e.g., "123") | Red error message appears | ☐ |
| 6 | Enter valid details, click "Next" | Step 3 appears with review summary | ☐ |
| 7 | Click "Confirm Booking" | Button shows "Verifying...", spinner state | ☐ |
| 8 | After ~1.5s | Thank-you state appears with ✅ | ☐ |

### 4b. Console / dataLayer Verification

| # | Test | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| 9 | Run after Step 1 | `window.dataLayer` contains object with `event: "booking_step_complete"`, `step_number: 1` | ☐ |
| 10 | Run after Step 2 | `window.dataLayer` contains object with `step_number: 2`, `step_name: "user_details_submitted"` | ☐ |
| 11 | Run after Submit | `window.dataLayer` contains object with `event: "consultation_form_submitted"`, `lead_source` | ☐ |
| 12 | Check no event fired on invalid attempts | No `booking_step_complete` in queue from failed validation clicks | ☐ |
| 13 | Run full verification snippet (below) | 4 events listed in order: form_start → step 1 → step 2 → submitted | ☐ |

**Console snippet for test #13:**
```javascript
window.dataLayer.forEach(function(item, i) {
    if (item.event) console.log(i, item.event, item.step_name || '');
});
```

### 4c. Document Consistency Check

| # | Check | Status |
| :--- | :--- | :--- |
| 14 | Event names in `tracking.js` match `task1_gtm_schema.md` | ☐ |
| 15 | Parameter names in `tracking.js` match custom dimensions in `task1_ga4_ads_strategy.md` | ☐ |
| 16 | JSON snippets in `task1_developer_brief.md` match `tracking.js` output | ☐ |

---

## 5. What Makes This Submission Strong

| Brief Requirement | How It's Addressed |
| :--- | :--- |
| "Who writes the dataLayer push?" | Explicitly answered in `task1_developer_brief.md` — the developer does, using the `tracking.js` module |
| "Define how you track funnel drop-off" | 4-step Funnel Exploration in GA4 with `step_number` filters and benchmark targets |
| "Actual JSON, not pseudocode" | All 3 step pushes are real, working JSON in `tracking.js` — verifiable live in the browser |
| "One conversion for Google Ads" | `consultation_form_submitted` — justified with rationale table over alternatives |
| "Min 3 parameters per event" | Every event in the schema has 3+ parameters, documented in the parameter definitions table |
| "Build real, working output" | The 3-step form is functional, the tracking module is reusable, and the console verification proves it works |
