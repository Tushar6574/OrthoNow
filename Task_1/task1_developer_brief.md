# Task 01 — Developer Briefing: dataLayer Implementation

This document is the handoff specification for the front-end development team. It explains **who writes the dataLayer push**, **what each push looks like**, and **exactly where to place it** in the codebase for each step of the 3-step booking form.

---

## 1. Who Writes the dataLayer Push?

**The front-end developer writes the push.** The GTM/Analytics analyst does not.

GTM's built-in triggers (Click, Form Submit, Element Visibility) **cannot natively detect step transitions** in a multi-step form. They can detect clicks and form submits, but they cannot distinguish "Step 1 → Step 2" from "Step 2 → Step 3" without a signal from the front-end.

The `dataLayer.push()` call IS that signal.

### Division of Responsibility

| Role | Responsibility |
| :--- | :--- |
| **Front-end Developer** | Calls the tracking functions at the right DOM events |
| **Analytics / GTM Analyst** | Configures GTM triggers, tags, and variables to listen for those events |
| **Backend Developer** | Returns a success/failure HTTP status so the analyst knows whether to fire the conversion |

---

## 2. The Tracking Module (`tracking.js`)

We provide a centralized module — `tracking.js` — that exposes typed functions. Developers **never** call `window.dataLayer.push()` directly. They call:

```
OrthoNowTracking.trackBookingStep(stepNumber, data);
```

This ensures:
- Event names and parameters are always correct (no typos polluting GA4)
- Validation is built-in (empty/undefined params are stripped)
- Console logging is automatic for local QA

**Include the module before page logic:**
```html
<script src="tracking.js" defer></script>
```

---

## 3. Step-by-Step Implementation Brief

### Step 1: Location & Specialty Selected

**DOM Event**: User clicks the "Next" button after selecting clinic and specialty.
**Validation Gate**: Both dropdowns must have a value before firing.

**Where in code** (pseudocode):
```
function onStep1NextClick() {
    if (!clinic || !specialty) {
        showError('Please select both fields.');
        return; // <-- DO NOT fire tracking on invalid attempt
    }

    OrthoNowTracking.trackBookingStep(1, {
        clinicLocation: clinic,
        specialty: specialty
    });

    showStep(2);
}
```

**Resulting dataLayer object:**
```json
{
  "event": "booking_step_complete",
  "step_number": 1,
  "step_name": "location_specialty_selected",
  "form_id": "main_appointment_form",
  "clinic_location": "Indiranagar, Bengaluru",
  "specialty": "Knee Replacement"
}
```

---

### Step 2: User Details Submitted

**DOM Event**: User clicks "Next" after entering Name, Phone, and Preferred Date.
**Validation Gate**: Name ≥ 3 chars AND phone matches `^[0-9]{10}$`.

> This is the step the interviewer specifically asks about. Here is the exact brief:

**Where in code** (pseudocode):
```
function onStep2NextClick() {
    // 1. Validate before tracking — never fire on failed validation
    if (name.length < 3) { showNameError(); return; }
    if (!/^[0-9]{10}$/.test(phone)) { showPhoneError(); return; }

    // 2. Fire the tracking event with validated data
    OrthoNowTracking.trackBookingStep(2, {
        preferredDate: date
    });

    // 3. Transition to Step 3
    populateReviewScreen();
    showStep(3);
}
```

**Resulting dataLayer object:**
```json
{
  "event": "booking_step_complete",
  "step_number": 2,
  "step_name": "user_details_submitted",
  "form_id": "main_appointment_form",
  "preferred_date": "2026-07-15"
}
```

**Why `preferred_date` and not `phone_number`?**
Phone number is PII. Pushing raw PII into the dataLayer risks it being visible in GA4 or GTM Preview mode. Phone is sent directly to the backend API (and into HubSpot). The tracking layer only captures the `preferred_date` for funnel analysis.

---

### Step 3: Booking Confirmed (Conversion)

**DOM Event**: Backend returns HTTP 200 from the booking API.
**Validation Gate**: Must be a successful server response — not a client-side assumption.

**Where in code** (pseudocode):
```
async function confirmBooking() {
    const response = await fetch('/api/book-appointment', {
        method: 'POST',
        body: JSON.stringify(bookingData)
    });

    if (response.ok) {
        // Fire conversion ONLY on confirmed success
        OrthoNowTracking.trackFormSubmit({
            clinicPreference: bookingData.clinic,
            specialty: bookingData.specialty
        });

        showThankYouState();
    } else {
        showError('Booking failed. Please try again.');
        // NO tracking event fired here — failed submissions are not conversions
    }
}
```

**Resulting dataLayer object:**
```json
{
  "event": "consultation_form_submitted",
  "step_number": 3,
  "step_name": "booking_confirmed",
  "form_id": "main_appointment_form",
  "clinic_preference": "Indiranagar, Bengaluru",
  "specialty": "Knee Replacement",
  "lead_source": "Google Ads - Consultation Landing Page",
  "submission_timestamp": "2026-07-01T10:30:00.000Z"
}
```

---

## 4. Edge Cases & Rules

| Scenario | Rule |
| :--- | :--- |
| User clicks "Next" with empty fields | **Do not fire.** Validation must block. |
| User navigates back to Step 1 from Step 2 | Do not re-fire Step 1 tracking. Only fire on forward progression. |
| User double-clicks "Confirm" | Button is disabled after first click (loading state). No duplicate push. |
| Network timeout on booking API | **Do not fire conversion.** Show error. Retry allowed. |
| User refreshes on Step 2 | `form_start` fires again (page reload resets state). Acceptable. |

---

## 5. QA Checklist for Developers

Before merging, verify in the browser console:

1. Open `index.html` locally
2. Open Console (`F12`)
3. Type `window.dataLayer` — should show `[[]]` or an array
4. Start the form — check that `form_start` appears in the queue
5. Complete Step 1 → check `booking_step_complete` with `step_number: 1` appears
6. Complete Step 2 → check `booking_step_complete` with `step_number: 2` appears
7. Submit → check `consultation_form_submitted` appears with `lead_source`
8. Confirm: **no tracking event fired on invalid submissions**

If all 8 pass, the implementation is production-ready.
