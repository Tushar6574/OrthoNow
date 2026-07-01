# Structured Phases for Task 01: GTM Event Schema

To deliver a production-ready GTM tracking setup for OrthoNow, the work is divided into five structured phases.

## Phase 1: Discovery & Technical Audit
*   **Interaction Mapping**: Audit the OrthoNow website to identify every critical touchpoint: the 3-step booking form, 'Call Now' buttons, WhatsApp widget, PDF downloads, and clinic location pages.
*   **Technical Constraint Review**: Analyze how the current WordPress site handles form submissions (AJAX vs. Page Reload) to determine the best GTM trigger strategy (Custom Event vs. Form Submission vs. Thank You page view).

## Phase 2: Event Taxonomy & Schema Design
*   **Standardization**: Define a naming convention (e.g., `snake_case`) to ensure consistency across GA4, GTM, and future CRM integrations.
*   **Schema Construction**: Build the master tracking table including:
    *   **Event Name**: Unique identifier (e.g., `appointment_booking_start`).
    *   **Trigger Type**: Technical condition (e.g., Data Layer Variable, Click, or Custom Event).
    *   **Parameters**: Minimum 3 data points per event (e.g., `clinic_name`, `form_id`, `user_specialty`).
    *   **GA4 Mapping**: Identify which report or audience segment the event populates.

## Phase 3: dataLayer Implementation Specification
*   **Funnel Logic**: Design the multi-step tracking logic for the 3-step booking form.
*   **JSON Schemas**: Write the exact `window.dataLayer.push()` snippets for each step:
    *   Step 1: Selection (Clinic/Specialty).
    *   Step 2: PII Entry (Name/Phone).
    *   Step 3: Confirmation (Success).
*   **Validation**: Ensure triggers only fire upon successful form validation to avoid "dirty data" from failed submissions.

## Phase 4: GA4 Configuration & Funnel Strategy
*   **Funnel Exploration**: Define the steps required to build a custom Funnel Exploration in GA4 to surface drop-off rates between Step 1 and Step 3.
*   **Conversion Selection**: Identify the single highest-intent action (`consultation_form_submitted`) for Google Ads import.
*   **Justification**: Document the ROI impact of optimizing for leads vs. mere clicks.

## Phase 5: Documentation & Developer Handoff
*   **Markdown Finalization**: Compile the schema into a scannable `task1_gtm_schema.md`.
*   **Briefing Material**: Create a technical brief for the front-end team (as per the "Interviewer Only" requirement) explaining how to implement step-level tracking without native GTM listeners.
