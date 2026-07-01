# NAMOZA_DEVELOPER_SKILL.md

This document serves as the internal "skill" and quality standard for the OrthoNow developer assignment. All implementations must adhere to these principles.

## 🚀 Strategies to Make Your Submission Stand Out

### 1. Robust Data Handling (No Placeholder Logic)
- **Rule**: Never use `console.log("submitted")` as the final implementation.
- **Implementation**:
    - Build actual `async/await` fetch handlers.
    - Use `try/catch` blocks for comprehensive error handling.
    - Implement UI loading states (e.g., disabling buttons, showing spinners).
    - Handle network timeouts and validation errors gracefully.

### 2. Architect for Scannability (GitHub Repo Excellence)
- **Rule**: The repository must be navigable in 60 seconds.
- **Implementation**:
    - Clean `README.md` containing:
        - Tech Stack (HTML5, CSS3, Vanilla JS).
        - Local Setup (Standard browser opening).
        - **Architectural Section**: Explain *why* tracking is structured a certain way or why specific form logic was chosen.
    - Commented code explaining the "why" behind complex logic.

### 3. Performance & Core Web Vitals (Clean DOM)
- **Rule**: Target 90+ PageSpeed Mobile score.
- **Implementation**:
    - **Semantic HTML5**: Use `<header>`, `<main>`, `<section>`, `<form>`, etc.
    - **Minimize Layout Shifts (CLS)**: Define image dimensions and avoid dynamic content that moves elements after load.
    - **Non-blocking Scripts**: Use `defer` or `async` for all script tags.
    - **Zero Dependencies**: Pure Vanilla JS to minimize bundle size.

---

## 🛠 Task-Specific Guidelines

### Task 01: GTM Schema
- Use `snake_case` for event names.
- Ensure `dataLayer` pushes are valid JSON.
- Focus on the "Funnel Exploration" logic in GA4.

### Task 02: Landing Page
- Implement from `design.md`.
- Ensure the form fires a valid GTM event on successful submission.

### Task 03: Integration
- Address the **HubSpot Phone Deduplication Trap**.
- Define an SLA-driven architecture for WhatsApp.
