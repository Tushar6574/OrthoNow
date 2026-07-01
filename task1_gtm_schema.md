# Task 01: GTM Event Schema - OrthoNow

This document outlines the Google Tag Manager (GTM) event tracking schema for the OrthoNow website to enable full-funnel performance marketing and GA4 analysis.

## 1. Complete Event Schema

| Event Name | Trigger Type | Key Parameters | GA4 Report / Audience |
| :--- | :--- | :--- | :--- |
| `appointment_booking_start` | Form Start / Step 1 View | `page_location`, `form_id` | Funnel Exploration / High Intent Users |
| `booking_step_complete` | Custom Event (dataLayer) | `step_number`, `step_name`, `clinic_location`, `specialty` | Funnel Exploration (Drop-off analysis) |
| `consultation_form_submitted` | Custom Event (dataLayer) | `form_id`, `clinic_preference`, `lead_source` | Conversions / Leads |
| `click_to_call` | Click (Tel: links) | `button_location` (header/footer/hero), `page_path` | Engagement / Offline Conversion Proxies |
| `whatsapp_chat_initiated` | Click (wa.me link) | `button_location`, `page_path` | Engagement / Social Interaction |
| `patient_guide_download` | Custom Event (Form Submit) | `file_name`, `user_name` (hashed), `phone_number` (hashed) | Lead Gen / Gated Content Audience |
| `clinic_location_view` | Page View (Location-specific) | `clinic_city`, `clinic_name` | Traffic / Local Interest Segments |
| `blog_scroll_depth` | Scroll (25%, 50%, 75%, 90%) | `page_title`, `scroll_percentage` | Content Engagement / Remarketing |

---

## 2. 3-Step Booking Form Funnel

To track funnel drop-off accurately, we use custom dataLayer pushes at each transition.

### Step 1: Location & Specialty Selected
**Trigger**: User clicks "Next" or selects the second field.
```json
window.dataLayer.push({
  'event': 'booking_step_complete',
  'step_number': 1,
  'step_name': 'location_specialty_selected',
  'clinic_location': 'Indiranagar',
  'specialty': 'Knee Replacement'
});
```

### Step 2: User Details Entered
**Trigger**: User clicks "Next" after name, phone, and date fields.
```json
window.dataLayer.push({
  'event': 'booking_step_complete',
  'step_number': 2,
  'step_name': 'user_details_submitted',
  'preferred_date': '2026-07-15',
  'form_id': 'main_appointment_form'
});
```

### Step 3: Booking Confirmed (Final Conversion)
**Trigger**: Successful API response/Thank you state shown.
```json
window.dataLayer.push({
  'event': 'consultation_form_submitted',
  'step_number': 3,
  'step_name': 'booking_confirmed',
  'clinic_location': 'Indiranagar',
  'specialty': 'Knee Replacement'
});
```

### Funnel Drop-off Analysis in GA4
In GA4 **Explore > Funnel Exploration**, I would create a custom funnel with these steps:
1. `appointment_booking_start`
2. `booking_step_complete` where `step_number` = 1
3. `booking_step_complete` where `step_number` = 2
4. `consultation_form_submitted`

This surfaces the exact drop-off percentage between selecting a clinic and entering contact details.

---

## 3. Google Ads Conversion Action

**Primary Conversion**: `consultation_form_submitted`

**Why?**
- **Bottom-of-Funnel**: This represents a confirmed lead who has provided contact information and clinic preference.
- **Data Quality**: Unlike "Call Now" or "WhatsApp" clicks (which are intent-based but don't guarantee a lead), this event is fired only upon successful form validation and submission.
- **Optimization**: Google Ads Smart Bidding requires high-intent signals to find similar users. This event provides the cleanest signal for ROI calculation.
