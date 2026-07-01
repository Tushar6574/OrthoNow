/**
 * ============================================================
 * OrthoNow — GTM dataLayer Manager
 * File: tracking.js
 * Version: 1.0.0
 * ============================================================
 *
 * PURPOSE
 * A single, centralized module that manages ALL dataLayer pushes
 * for the OrthoNow site. Front-end developers never call
 * window.dataLayer.push() directly — they call these typed,
 * documented functions instead.
 *
 * WHY THIS EXISTS
 * GTM cannot natively listen to multi-step form interactions,
 * SPA route changes, or dynamic content without explicit
 * dataLayer pushes from the front-end. This module ensures
 * every push is structured, validated, and consistent.
 *
 * USAGE
 *   <script src="tracking.js" defer></script>
 *   OrthoNowTracking.trackBookingStep(1, {...});
 *   OrthoNowTracking.trackFormSubmit({...});
 *
 * ============================================================
 */

(function () {
    'use strict';

    // ---- Constants: Single Source of Truth for event names ----
    const EVENTS = {
        FORM_START: 'form_start',
        BOOKING_STEP_COMPLETE: 'booking_step_complete',
        CONSULTATION_SUBMITTED: 'consultation_form_submitted',
        CLICK_TO_CALL: 'click_to_call',
        WHATSAPP_INITIATED: 'whatsapp_chat_initiated',
        DOWNLOAD_GUIDE: 'download_patient_guide',
        CLINIC_PAGE_VIEW: 'clinic_page_view',
        BLOG_SCROLL_DEPTH: 'blog_scroll_depth',
        NEWSLETTER_SIGNUP: 'newsletter_signup',
    };

    const FORM_ID = 'main_appointment_form';
    const LEAD_SOURCE = 'Google Ads - Consultation Landing Page';

    // ---- Internal: Safe dataLayer initialization ----
    function getQueue() {
        window.dataLayer = window.dataLayer || [];
        return window.dataLayer;
    }

    /**
     * Core push function.
     * Validates that 'event' exists and parameters are non-empty.
     * Prevents malformed pushes from polluting GA4.
     *
     * @param {string} eventName - The GA4 event name (snake_case)
     * @param {Object} params - Key-value parameter pairs
     */
    function push(eventName, params) {
        if (!eventName || typeof eventName !== 'string') {
            console.warn('[OrthoNow Tracking] Skipped push: missing event name.');
            return;
        }

        // Strip undefined/null values to keep the payload clean
        const cleanParams = {};
        for (const key in params) {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                cleanParams[key] = params[key];
            }
        }

        const payload = Object.assign({ event: eventName }, cleanParams);

        getQueue().push(payload);

        // Developer-friendly console log (visible during QA)
        if (window.location.hostname === 'localhost' || window.location.hostname === '') {
            console.log('[OrthoNow Tracking] Pushed:', payload);
        }
    }

    // ---- Public API: Typed functions for each event ----

    /**
     * Track Step 1, 2, or 3 of the multi-step booking form.
     *
     * @param {number} stepNumber - 1, 2, or 3
     * @param {Object} data - Step-specific data
     */
    function trackBookingStep(stepNumber, data) {
        data = data || {};

        let stepName;
        const base = {
            step_number: stepNumber,
            form_id: FORM_ID,
        };

        switch (stepNumber) {
            case 1:
                stepName = 'location_specialty_selected';
                base.step_name = stepName;
                base.clinic_location = data.clinicLocation;
                base.specialty = data.specialty;
                break;

            case 2:
                stepName = 'user_details_submitted';
                base.step_name = stepName;
                base.preferred_date = data.preferredDate;
                break;

            case 3:
                stepName = 'booking_confirmed';
                base.step_name = stepName;
                base.clinic_location = data.clinicLocation;
                base.specialty = data.specialty;
                base.lead_source = LEAD_SOURCE;
                break;

            default:
                console.warn('[OrthoNow Tracking] Invalid step number:', stepNumber);
                return;
        }

        push(EVENTS.BOOKING_STEP_COMPLETE, base);
    }

    /**
     * Track the final consultation form submission (primary conversion).
     */
    function trackFormSubmit(data) {
        push(EVENTS.CONSULTATION_SUBMITTED, {
            step_number: 3,
            step_name: 'booking_confirmed',
            form_id: FORM_ID,
            clinic_preference: data.clinicPreference,
            specialty: data.specialty,
            lead_source: LEAD_SOURCE,
            submission_timestamp: new Date().toISOString(),
        });
    }

    /**
     * Track form start (first interaction with the booking form).
     */
    function trackFormStart(formName) {
        push(EVENTS.FORM_START, {
            form_id: FORM_ID,
            form_name: formName || 'Consultation Booking',
            page_path: window.location.pathname,
        });
    }

    /**
     * Track click-to-call button interactions.
     */
    function trackClickToCall(linkUrl, linkText, buttonLocation) {
        push(EVENTS.CLICK_TO_CALL, {
            link_url: linkUrl,
            link_text: linkText,
            button_location: buttonLocation,
            page_path: window.location.pathname,
        });
    }

    /**
     * Track WhatsApp chat initiations.
     */
    function trackWhatsApp(buttonLocation, referralSource) {
        push(EVENTS.WHATSAPP_INITIATED, {
            link_url: 'https://wa.me/918000000000',
            button_location: buttonLocation,
            page_path: window.location.pathname,
            referral_source: referralSource || 'website',
        });
    }

    /**
     * Track patient guide / PDF downloads.
     */
    function trackDownload(fileName, fileType) {
        push(EVENTS.DOWNLOAD_GUIDE, {
            file_name: fileName,
            file_type: fileType || 'pdf',
            lead_source: LEAD_SOURCE,
            page_path: window.location.pathname,
        });
    }

    /**
     * Track clinic location page views (for multi-city segmentation).
     */
    function trackClinicPageView(clinicName, clinicCity) {
        push(EVENTS.CLINIC_PAGE_VIEW, {
            clinic_name: clinicName,
            clinic_city: clinicCity,
            page_path: window.location.pathname,
            page_referrer: document.referrer,
        });
    }

    /**
     * Track blog/article scroll depth milestones.
     */
    function trackScrollDepth(scrollPercent, pageTitle) {
        push(EVENTS.BLOG_SCROLL_DEPTH, {
            page_title: pageTitle || document.title,
            scroll_percentage: scrollPercent,
            page_path: window.location.pathname,
            read_time_sec: Math.floor(performance.now() / 1000),
        });
    }

    /**
     * Track newsletter signup.
     */
    function trackNewsletterSignup(signupSource) {
        push(EVENTS.NEWSLETTER_SIGNUP, {
            form_id: 'newsletter_form',
            signup_source: signupSource || 'footer',
            page_path: window.location.pathname,
            lead_source: 'Organic',
        });
    }

    // ---- Expose public API ----
    window.OrthoNowTracking = {
        EVENTS: EVENTS,
        trackFormStart: trackFormStart,
        trackBookingStep: trackBookingStep,
        trackFormSubmit: trackFormSubmit,
        trackClickToCall: trackClickToCall,
        trackWhatsApp: trackWhatsApp,
        trackDownload: trackDownload,
        trackClinicPageView: trackClinicPageView,
        trackScrollDepth: trackScrollDepth,
        trackNewsletterSignup: trackNewsletterSignup,
    };
})();
