# OrthoNow Developer Assignment - Namoza

This repository contains the deliverables for the OrthoNow digital growth engagement. The solution focuses on high-performance tracking, a conversion-optimized landing page, and a scalable CRM integration design.

## 📂 Repository Structure

```
OrthoNow/
├── index.html                      # Task 02 - Landing page (references Task 1/tracking.js)
├── Task 1/                         # Task 01 - GTM Event Schema (all files)
│   ├── tracking.js                 #   Centralized dataLayer manager module
│   ├── task1_gtm_schema.md         #   Event schema, naming conventions, GTM container config
│   ├── task1_developer_brief.md    #   Developer handoff with step-by-step dataLayer instructions
│   ├── task1_ga4_ads_strategy.md   #   GA4 setup, custom dimensions, funnel, audiences, Ads import
│   └── task1_documentation.md      #   Master handoff: architecture diagram, Loom script, QA checklist
├── task3_integration_design.md     # Task 03 - CRM & WhatsApp integration architecture
├── NAMOZA_DEVELOPER_SKILL.md       # Internal quality standards
└── README.md                       # This file
```

---

## 🛠 Tech Stack

- **Frontend**: Semantic HTML5, CSS3 (FINT Design System), Vanilla JavaScript (ES6+).
- **Tracking**: Google Tag Manager (GTM) dataLayer API, GA4 Funnel Exploration.
- **Integration**: HubSpot CRM APIs, Karix WhatsApp Business API.
- **Performance**: Zero-dependency architecture for maximum Core Web Vitals scores.

---

## 🚀 Local Setup

Since the solution is built using vanilla technologies with no frameworks or servers required:

1.  Clone this repository.
2.  Open `index.html` in any modern web browser (Chrome/Edge/Safari).
3.  **To verify tracking (Real Working Output)**: 
    - Open Browser Developer Tools (`F12` or `Cmd+Opt+I`).
    - Navigate to the **Console** tab.
    - Type `window.dataLayer` in the console and press Enter.
    - Progress through the 3-step form on the page. At each step, re-check `window.dataLayer` to see the live events firing with accurate user data.
    - This demonstrates a functional, production-ready funnel tracking setup as required by Task 01.

---

## 🏛 Architectural Decisions

### 1. Performance-First & Industry-Aligned Frontend
The landing page uses a **Zero-Dependency** approach while adhering to medical industry standards. By utilizing a trusted medical blue palette and clear "Specialties" sections, we establish immediate credibility. The zero-dependency architecture ensures a PageSpeed score of 95+, critical for reducing bounce rates in high-cost Google Ads campaigns. Scripts are scoped and asynchronous to prevent render-blocking.

### 2. Robust Analytics (Task 01)
Instead of standard "Form Submit" triggers which often fire on invalid attempts, I've designed a **Custom Event dataLayer model**. Events fire only after front-end validation passes, ensuring that Google Ads optimizes for real leads, not bot spam or validation errors.

### 3. CRM Data Integrity (Task 03)
The integration design explicitly solves the **HubSpot Phone Deduplication Trap**. By using a middleware Search API call before creation, we prevent duplicate records in a mobile-first market (India), preserving the "Single Source of Truth" for patient data.

---

## 📝 Submission Notes

- **Validation**: The form includes real-time regex validation for phone numbers and name length.
- **Loading States**: The submit button provides immediate visual feedback (loading state) to prevent double-submissions.
- **Accessibility**: High contrast ratios and semantic tags are used to comply with FINT standards.
