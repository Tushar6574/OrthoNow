# FINT Design System — Engineering Reference

This document is the design-to-engineering handoff reference for the FINT design system. It contains resolved design tokens, typography, and effect styles as defined in the Figma library. Use this as the source of truth for implementing theme files, CSS variables, or design tokens in code.

**Source:** Figma Variables (Color Tokens, Spacing, Border Radius collections) + Text Styles + Effect Styles
**Token collections:** Color Tokens (195 vars) · Spacing (9 vars) · Border Radius (6 vars)
**Text styles:** 52 · **Effect styles:** 4

---

## 1. Color Tokens

### Architecture

Two-layer token system:

- **Primitive ramps** — raw hex values, organized as 11–12 step scales (0/50–950)
- **Semantic groups** — aliased to primitives, named by purpose (`primary`, `success`, `danger`, `warning`, `info`)

Engineers should consume **semantic tokens** in component code, not primitives directly. Primitives exist as the underlying palette; semantic tokens carry the meaning.

---

### 1a. Primitive Ramps

#### `color/black` (neutral scale)

| Token           | Hex     |
| --------------- | ------- |
| color/black/0   | #FFFFFF |
| color/black/50  | #FAFAFA |
| color/black/100 | #F5F5F5 |
| color/black/150 | #EEEEEE |
| color/black/200 | #E5E5E5 |
| color/black/300 | #D4D4D4 |
| color/black/400 | #A3A3A3 |
| color/black/500 | #737373 |
| color/black/600 | #525252 |
| color/black/700 | #404040 |
| color/black/800 | #262626 |
| color/black/900 | #171717 |
| color/black/950 | #000000 |

#### `color/green`

| Token           | Hex     |
| --------------- | ------- |
| color/green/50  | #F0FDF4 |
| color/green/100 | #DCFCE7 |
| color/green/200 | #BBF7D0 |
| color/green/300 | #86EFAC |
| color/green/400 | #4ADE80 |
| color/green/500 | #22C55E |
| color/green/600 | #16A34A |
| color/green/700 | #15803D |
| color/green/800 | #166534 |
| color/green/900 | #14532D |
| color/green/950 | #052E16 |

#### `color/red`

| Token         | Hex     |
| ------------- | ------- |
| color/red/50  | #FEF2F2 |
| color/red/100 | #FEE2E2 |
| color/red/200 | #FECACA |
| color/red/300 | #FCA5A5 |
| color/red/400 | #F87171 |
| color/red/500 | #EF4444 |
| color/red/600 | #DC2626 |
| color/red/700 | #B91C1C |
| color/red/800 | #991B1B |
| color/red/900 | #7F1D1D |
| color/red/950 | #450A0A |

#### `color/amber`

| Token           | Hex     |
| --------------- | ------- |
| color/amber/50  | #FFFBEB |
| color/amber/100 | #FEF3C7 |
| color/amber/200 | #FDE68A |
| color/amber/300 | #FCD34D |
| color/amber/400 | #FBBF24 |
| color/amber/500 | #F59E0B |
| color/amber/600 | #D97706 |
| color/amber/700 | #B45309 |
| color/amber/800 | #92400E |
| color/amber/900 | #78350F |
| color/amber/950 | #451A03 |

#### `color/blue`

| Token          | Hex     |
| -------------- | ------- |
| color/blue/50  | #EFF6FF |
| color/blue/100 | #DBEAFE |
| color/blue/200 | #BFDBFE |
| color/blue/300 | #93C5FD |
| color/blue/400 | #60A5FA |
| color/blue/500 | #3B82F6 |
| color/blue/600 | #2563EB |
| color/blue/700 | #1D4ED8 |
| color/blue/800 | #1E40AF |
| color/blue/900 | #1E3A8A |
| color/blue/950 | #172554 |

---

### 1b. Semantic Groups

Format: `token → primitive alias → resolved hex`

#### `color/primary` → `color/black` scale

**Interactive states**

| Token                  | Alias           | Hex     |
| ---------------------- | --------------- | ------- |
| color/primary/default  | color/black/950 | #000000 |
| color/primary/hover    | color/black/900 | #171717 |
| color/primary/pressed  | color/black/800 | #262626 |
| color/primary/disabled | color/black/300 | #D4D4D4 |

**On-primary**

| Token                                        | Alias         | Hex     |
| -------------------------------------------- | ------------- | ------- |
| color/primary/on-primary/on-primary          | color/black/0 | #FFFFFF |
| color/primary/on-primary/on-primary-disabled | color/black/0 | #FFFFFF |

**Subtle**

| Token                               | Alias           | Hex     |
| ----------------------------------- | --------------- | ------- |
| color/primary/subtle/subtle         | color/black/100 | #F5F5F5 |
| color/primary/subtle/subtle-hover   | color/black/150 | #EEEEEE |
| color/primary/subtle/subtle-pressed | color/black/200 | #E5E5E5 |

**Outline**

| Token                                  | Alias           | Hex     |
| -------------------------------------- | --------------- | ------- |
| color/primary/outline/outline          | color/black/950 | #000000 |
| color/primary/outline/outline-hover    | color/black/800 | #262626 |
| color/primary/outline/outline-disabled | color/black/300 | #D4D4D4 |

**Text**

| Token                             | Alias           | Hex     |
| --------------------------------- | --------------- | ------- |
| color/primary/text/text-primary   | color/black/950 | #000000 |
| color/primary/text/text-secondary | color/black/500 | #737373 |
| color/primary/text/text-tertiary  | color/black/400 | #A3A3A3 |
| color/primary/text/text-disabled  | color/black/300 | #D4D4D4 |
| color/primary/text/text-inverse   | color/black/0   | #FFFFFF |
| color/primary/text/text-strong    | color/black/900 | #171717 |
| color/primary/text/text-subtle    | color/black/600 | #525252 |

**Surface**

| Token                                        | Alias           | Hex     |
| -------------------------------------------- | --------------- | ------- |
| color/primary/surface/surface-base           | color/black/0   | #FFFFFF |
| color/primary/surface/surface-subtle         | color/black/50  | #FAFAFA |
| color/primary/surface/surface-muted          | color/black/100 | #F5F5F5 |
| color/primary/surface/surface-raised         | color/black/0   | #FFFFFF |
| color/primary/surface/surface-overlay        | color/black/950 | #000000 |
| color/primary/surface/surface-inverse        | color/black/950 | #000000 |
| color/primary/surface/surface-inverse-subtle | color/black/900 | #171717 |
| color/primary/surface/surface-inverse-muted  | color/black/800 | #262626 |

**Border**

| Token                                      | Alias           | Hex     |
| ------------------------------------------ | --------------- | ------- |
| color/primary/border/border-subtle         | color/black/150 | #EEEEEE |
| color/primary/border/border-default        | color/black/200 | #E5E5E5 |
| color/primary/border/border-strong         | color/black/300 | #D4D4D4 |
| color/primary/border/border-focus          | color/black/950 | #000000 |
| color/primary/border/border-inverse        | color/black/0   | #FFFFFF |
| color/primary/border/border-inverse-subtle | color/black/700 | #404040 |

**Icon**

| Token                                   | Alias           | Hex     |
| --------------------------------------- | --------------- | ------- |
| color/primary/icon roles/icon-primary   | color/black/950 | #000000 |
| color/primary/icon roles/icon-secondary | color/black/500 | #737373 |
| color/primary/icon roles/icon-tertiary  | color/black/400 | #A3A3A3 |
| color/primary/icon roles/icon-disabled  | color/black/300 | #D4D4D4 |
| color/primary/icon roles/icon-inverse   | color/black/0   | #FFFFFF |

---

#### `color/success` → `color/green` scale

**Interactive states**

| Token                  | Alias           | Hex     |
| ---------------------- | --------------- | ------- |
| color/success/default  | color/green/500 | #22C55E |
| color/success/hover    | color/green/600 | #16A34A |
| color/success/pressed  | color/green/700 | #15803D |
| color/success/disabled | color/green/200 | #BBF7D0 |

**On-success**

| Token                                       | Alias           | Hex     |
| ------------------------------------------- | --------------- | ------- |
| color/success/on-success/on-filled          | color/black/0   | #FFFFFF |
| color/success/on-success/on-filled disabled | color/green/300 | #86EFAC |

**Subtle**

| Token                               | Alias           | Hex     |
| ----------------------------------- | --------------- | ------- |
| color/success/subtle/subtle         | color/green/50  | #F0FDF4 |
| color/success/subtle/subtle-hover   | color/green/100 | #DCFCE7 |
| color/success/subtle/subtle-pressed | color/green/200 | #BBF7D0 |

**Outline**

| Token                                  | Alias           | Hex     |
| -------------------------------------- | --------------- | ------- |
| color/success/outline/outline          | color/green/500 | #22C55E |
| color/success/outline/outline-hover    | color/green/700 | #15803D |
| color/success/outline/outline-disabled | color/green/200 | #BBF7D0 |

**Text**

| Token                             | Alias           | Hex     |
| --------------------------------- | --------------- | ------- |
| color/success/text/text-primary   | color/green/700 | #15803D |
| color/success/text/text-secondary | color/green/600 | #16A34A |
| color/success/text/text-on-filled | color/black/0   | #FFFFFF |
| color/success/text/text-disabled  | color/green/300 | #86EFAC |

**Surface**

| Token                                | Alias           | Hex     |
| ------------------------------------ | --------------- | ------- |
| color/success/surface/surface-subtle | color/green/200 | #BBF7D0 |
| color/success/surface/surface-muted  | color/green/100 | #DCFCE7 |
| color/success/surface/surface-strong | color/green/500 | #22C55E |

**Border**

| Token                               | Alias           | Hex     |
| ----------------------------------- | --------------- | ------- |
| color/success/border/border-subtle  | color/green/200 | #BBF7D0 |
| color/success/border/border-default | color/green/300 | #86EFAC |
| color/success/border/border-strong  | color/green/500 | #22C55E |

**Icon**

| Token                             | Alias           | Hex     |
| --------------------------------- | --------------- | ------- |
| color/success/icon/icon-primary   | color/green/600 | #16A34A |
| color/success/icon/icon-secondary | color/green/400 | #4ADE80 |
| color/success/icon/icon-on-filled | color/black/0   | #FFFFFF |

---

#### `color/danger` → `color/red` scale

**Interactive states**

| Token                 | Alias         | Hex     |
| --------------------- | ------------- | ------- |
| color/danger/default  | color/red/500 | #EF4444 |
| color/danger/hover    | color/red/600 | #DC2626 |
| color/danger/pressed  | color/red/700 | #B91C1C |
| color/danger/disabled | color/red/200 | #FECACA |

**On-danger**

| Token                                     | Alias         | Hex     |
| ----------------------------------------- | ------------- | ------- |
| color/danger/on-danger/on-filled          | color/black/0 | #FFFFFF |
| color/danger/on-danger/on-filled disabled | color/red/300 | #FCA5A5 |

**Subtle**

| Token                              | Alias         | Hex     |
| ---------------------------------- | ------------- | ------- |
| color/danger/subtle/subtle         | color/red/50  | #FEF2F2 |
| color/danger/subtle/subtle-hover   | color/red/100 | #FEE2E2 |
| color/danger/subtle/subtle-pressed | color/red/200 | #FECACA |

**Outline**

| Token                                 | Alias         | Hex     |
| ------------------------------------- | ------------- | ------- |
| color/danger/outline/outline          | color/red/500 | #EF4444 |
| color/danger/outline/outline-hover    | color/red/700 | #B91C1C |
| color/danger/outline/outline-disabled | color/red/200 | #FECACA |

**Text**

| Token                            | Alias         | Hex     |
| -------------------------------- | ------------- | ------- |
| color/danger/text/text-primary   | color/red/700 | #B91C1C |
| color/danger/text/text-secondary | color/red/600 | #DC2626 |
| color/danger/text/text-on-filled | color/black/0 | #FFFFFF |
| color/danger/text/text-disabled  | color/red/300 | #FCA5A5 |

**Surface**

| Token                               | Alias         | Hex     |
| ----------------------------------- | ------------- | ------- |
| color/danger/surface/surface-subtle | color/red/50  | #FEF2F2 |
| color/danger/surface/surface-muted  | color/red/100 | #FEE2E2 |
| color/danger/surface/surface-strong | color/red/500 | #EF4444 |

**Border**

| Token                              | Alias         | Hex     |
| ---------------------------------- | ------------- | ------- |
| color/danger/border/border-subtle  | color/red/200 | #FECACA |
| color/danger/border/border-default | color/red/300 | #FCA5A5 |
| color/danger/border/border-strong  | color/red/500 | #EF4444 |

**Icon**

| Token                            | Alias         | Hex     |
| -------------------------------- | ------------- | ------- |
| color/danger/icon/icon-primary   | color/red/600 | #DC2626 |
| color/danger/icon/icon-secondary | color/red/400 | #F87171 |
| color/danger/icon/icon-on-filled | color/black/0 | #FFFFFF |

---

#### `color/warning` → `color/amber` scale

> **⚠️ Critical accessibility rule:** Warning's "on-filled" text uses dark amber (`#78350F`), **not white**. White text on the `color/warning/default` (#F59E0B) background fails WCAG AA contrast. This is a deliberate, system-wide exception — do not default to white text on warning-filled surfaces as you would for other semantic colors.

**Interactive states**

| Token                  | Alias           | Hex     |
| ---------------------- | --------------- | ------- |
| color/warning/default  | color/amber/500 | #F59E0B |
| color/warning/hover    | color/amber/600 | #D97706 |
| color/warning/pressed  | color/amber/700 | #B45309 |
| color/warning/disabled | color/amber/200 | #FDE68A |

**On-warning** _(dark text on filled, not white — see note above)_

| Token                                       | Alias           | Hex     |
| ------------------------------------------- | --------------- | ------- |
| color/warning/on-warning/on-filled          | color/amber/900 | #78350F |
| color/warning/on-warning/on-filled-disabled | color/amber/800 | #92400E |

**Subtle**

| Token                               | Alias           | Hex     |
| ----------------------------------- | --------------- | ------- |
| color/warning/subtle/subtle         | color/amber/50  | #FFFBEB |
| color/warning/subtle/subtle-hover   | color/amber/100 | #FEF3C7 |
| color/warning/subtle/subtle-pressed | color/amber/200 | #FDE68A |

**Outline**

| Token                                  | Alias           | Hex     |
| -------------------------------------- | --------------- | ------- |
| color/warning/outline/outline          | color/amber/500 | #F59E0B |
| color/warning/outline/outline-hover    | color/amber/700 | #B45309 |
| color/warning/outline/outline-disabled | color/amber/200 | #FDE68A |

**Text**

| Token                             | Alias           | Hex     |
| --------------------------------- | --------------- | ------- |
| color/warning/text/text-primary   | color/amber/800 | #92400E |
| color/warning/text/text-secondary | color/amber/700 | #B45309 |
| color/warning/text/text-on-filled | color/amber/900 | #78350F |
| color/warning/text/text-disabled  | color/amber/300 | #FCD34D |

**Surface**

| Token                                | Alias           | Hex     |
| ------------------------------------ | --------------- | ------- |
| color/warning/surface/surface-subtle | color/amber/50  | #FFFBEB |
| color/warning/surface/surface-muted  | color/amber/100 | #FEF3C7 |
| color/warning/surface/surface-strong | color/amber/500 | #F59E0B |

**Border**

| Token                               | Alias           | Hex     |
| ----------------------------------- | --------------- | ------- |
| color/warning/border/border-subtle  | color/amber/200 | #FDE68A |
| color/warning/border/border-default | color/amber/300 | #FCD34D |
| color/warning/border/border-strong  | color/amber/500 | #F59E0B |

**Icon**

| Token                             | Alias           | Hex     |
| --------------------------------- | --------------- | ------- |
| color/warning/icon/icon-primary   | color/amber/700 | #B45309 |
| color/warning/icon/icon-secondary | color/amber/500 | #F59E0B |
| color/warning/icon/icon-on-filled | color/amber/900 | #78350F |

---

#### `color/info` → `color/blue` scale

**Interactive states**

| Token               | Alias          | Hex     |
| ------------------- | -------------- | ------- |
| color/info/default  | color/blue/500 | #3B82F6 |
| color/info/hover    | color/blue/600 | #2563EB |
| color/info/pressed  | color/blue/700 | #1D4ED8 |
| color/info/disabled | color/blue/200 | #BFDBFE |

**On-info**

| Token                                 | Alias          | Hex     |
| ------------------------------------- | -------------- | ------- |
| color/info/on-info/on-filled          | color/black/0  | #FFFFFF |
| color/info/on-info/on-filled-disabled | color/blue/300 | #93C5FD |

**Subtle**

| Token                            | Alias          | Hex     |
| -------------------------------- | -------------- | ------- |
| color/info/subtle/subtle         | color/blue/50  | #EFF6FF |
| color/info/subtle/subtle-hover   | color/blue/100 | #DBEAFE |
| color/info/subtle/subtle-pressed | color/blue/200 | #BFDBFE |

**Outline**

| Token                               | Alias          | Hex     |
| ----------------------------------- | -------------- | ------- |
| color/info/outline/outline          | color/blue/500 | #3B82F6 |
| color/info/outline/outline-hover    | color/blue/700 | #1D4ED8 |
| color/info/outline/outline-disabled | color/blue/200 | #BFDBFE |

**Text**

| Token                          | Alias          | Hex     |
| ------------------------------ | -------------- | ------- |
| color/info/text/text-primary   | color/blue/800 | #1E40AF |
| color/info/text/text-secondary | color/blue/700 | #1D4ED8 |
| color/info/text/text-on-filled | color/black/0  | #FFFFFF |
| color/info/text/text-disabled  | color/blue/300 | #93C5FD |

**Surface**

| Token                             | Alias          | Hex     |
| --------------------------------- | -------------- | ------- |
| color/info/surface/surface-subtle | color/blue/50  | #EFF6FF |
| color/info/surface/surface-muted  | color/blue/100 | #DBEAFE |
| color/info/surface/surface-strong | color/blue/500 | #3B82F6 |

**Border**

| Token                            | Alias          | Hex     |
| -------------------------------- | -------------- | ------- |
| color/info/border/border-subtle  | color/blue/200 | #BFDBFE |
| color/info/border/border-default | color/blue/300 | #93C5FD |
| color/info/border/border-strong  | color/blue/500 | #3B82F6 |

**Icon**

| Token                          | Alias          | Hex     |
| ------------------------------ | -------------- | ------- |
| color/info/icon/icon-primary   | color/blue/600 | #2563EB |
| color/info/icon/icon-secondary | color/blue/400 | #60A5FA |
| color/info/icon/icon-on-filled | color/black/0  | #FFFFFF |

---

## 2. Spacing Tokens

Base unit: **4px**. The scale is additive but intentionally non-sequential — there is no `space-7`, `-9`, `-10`, or `-11`. Engineers should not interpolate missing values; use the nearest defined token.

| Token      | Value |
| ---------- | ----- |
| --space-1  | 4px   |
| --space-2  | 8px   |
| --space-3  | 12px  |
| --space-4  | 16px  |
| --space-5  | 20px  |
| --space-6  | 24px  |
| --space-8  | 32px  |
| --space-12 | 48px  |
| --space-16 | 64px  |

---

## 3. Corner Radius Tokens

| Token         | Value        |
| ------------- | ------------ |
| --radius-none | 0px          |
| --radius-sm   | 4px          |
| --radius-md   | 6px          |
| --radius-lg   | 8px          |
| --radius-xl   | 12px         |
| --radius-full | 100px (pill) |

---

## 4. Typography

**Font families:** Geist (UI text) · Geist Mono (code/financial data)

**Letter spacing unit:** All values below are expressed in Figma's PERCENT unit, which is a fraction of font size — equivalent to `em × (value / 100)` in CSS. Example: `1%` on a 16px style = `0.16px` (i.e. `0.01em`).

- All Geist styles use **1% letter spacing** by default, with one documented exception (Label MD/Medium at 2.5%).
- All Geist Mono styles use **0% letter spacing**.

### Display (Geist)

| Style              | Size | Line height | Weight  | Letter spacing |
| ------------------ | ---- | ----------- | ------- | -------------- |
| Display/2XL/Bold   | 64px | 72px        | Bold    | 1%             |
| Display/2XL/Medium | 64px | 72px        | Medium  | 1%             |
| Display/XL/Bold    | 48px | 56px        | Bold    | 1%             |
| Display/XL/Medium  | 48px | 56px        | Medium  | 1%             |
| Display/LG/Bold    | 40px | 48px        | Bold    | 1%             |
| Display/LG/Medium  | 40px | 48px        | Medium  | 1%             |
| Display/MD/Bold    | 32px | 40px        | Bold    | 1%             |
| Display/MD/Medium  | 32px | 40px        | Medium  | 1%             |
| Display/SM/Bold    | 24px | 32px        | Bold    | 1%             |
| Display/SM/Medium  | 24px | 32px        | Medium  | 1%             |
| Display/SM/Regular | 24px | 32px        | Regular | 1%             |

### Heading (Geist)

| Style              | Size | Line height | Weight  | Letter spacing |
| ------------------ | ---- | ----------- | ------- | -------------- |
| Heading/XL/Bold    | 20px | 28px        | Bold    | 1%             |
| Heading/XL/Medium  | 20px | 28px        | Medium  | 1%             |
| Heading/LG/Bold    | 18px | 26px        | Bold    | 1%             |
| Heading/LG/Medium  | 18px | 26px        | Medium  | 1%             |
| Heading/MD/Bold    | 16px | 24px        | Bold    | 1%             |
| Heading/MD/Medium  | 16px | 24px        | Medium  | 1%             |
| Heading/MD/Regular | 16px | 24px        | Regular | 1%             |
| Heading/SM/Bold    | 15px | 22px        | Bold    | 1%             |
| Heading/SM/Medium  | 15px | 22px        | Medium  | 1%             |
| Heading/XS/Bold    | 13px | 20px        | Bold    | 1%             |
| Heading/XS/Medium  | 13px | 20px        | Medium  | 1%             |

### Body (Geist)

| Style           | Size | Line height | Weight  | Letter spacing |
| --------------- | ---- | ----------- | ------- | -------------- |
| Body/XL/Medium  | 18px | 28px        | Medium  | 1%             |
| Body/XL/Regular | 18px | 28px        | Regular | 1%             |
| Body/LG/Medium  | 16px | 26px        | Medium  | 1%             |
| Body/LG/Regular | 16px | 26px        | Regular | 1%             |
| Body/MD/Medium  | 14px | 22px        | Medium  | 1%             |
| Body/MD/Regular | 14px | 22px        | Regular | 1%             |
| Body/SM/Medium  | 13px | 20px        | Medium  | 1%             |
| Body/SM/Regular | 13px | 20px        | Regular | 1%             |
| Body/XS/Medium  | 12px | 18px        | Medium  | 1%             |
| Body/XS/Regular | 12px | 18px        | Regular | 1%             |

### Label (Geist)

| Style            | Size | Line height | Weight  | Letter spacing |
| ---------------- | ---- | ----------- | ------- | -------------- |
| Label/LG/Bold    | 14px | 20px        | Bold    | 1%             |
| Label/LG/Medium  | 14px | 20px        | Medium  | 1%             |
| Label/LG/Regular | 14px | 20px        | Regular | 1%             |
| Label/MD/Bold    | 12px | 16px        | Bold    | 1%             |
| Label/MD/Medium  | 12px | 16px        | Medium  | **2.5%**       |
| Label/MD/Regular | 12px | 16px        | Regular | 1%             |
| Label/SM/Bold    | 11px | 15px        | Bold    | 1%             |
| Label/SM/Medium  | 11px | 15px        | Medium  | 1%             |
| Label/SM/Regular | 11px | 15px        | Regular | 1%             |
| Label/XS/Medium  | 10px | 14px        | Medium  | 1%             |
| Label/XS/Regular | 10px | 14px        | Regular | 1%             |
| Label/XS/Badge   | 8px  | 14px        | Regular | 1%             |

> Note: `Label/MD/Medium` is the single exception to the 1% letter-spacing default — it uses 2.5%. Implement this explicitly; don't assume it inherits the default.

### Mono (Geist Mono)

Used for financial data — amounts, GSTINs, invoice IDs, and other tabular/numeric content.

| Style           | Size | Line height | Weight  | Letter spacing |
| --------------- | ---- | ----------- | ------- | -------------- |
| Mono/LG/Bold    | 18px | 26px        | Bold    | 0%             |
| Mono/LG/Medium  | 18px | 26px        | Medium  | 0%             |
| Mono/MD/Bold    | 14px | 20px        | Bold    | 0%             |
| Mono/MD/Medium  | 14px | 20px        | Medium  | 0%             |
| Mono/MD/Regular | 14px | 20px        | Regular | 0%             |
| Mono/SM/Medium  | 12px | 17px        | Medium  | 0%             |
| Mono/SM/Regular | 12px | 17px        | Regular | 0%             |
| Mono/XS/Regular | 11px | 15px        | Regular | 0%             |

---

## 5. Effect Styles

Four named effect styles. All shadows are multi-layer composites — implement as stacked `box-shadow` declarations (comma-separated), not a single shadow.

### Button Shadow

```css
box-shadow:
  inset 0px 4px 8px 0px rgba(170, 170, 170, 0.3),
  inset 0px -3px 4px 0px rgba(0, 0, 0, 0.25);
```

### Toggle Switch — Drop Shadow (5 layers)

```css
box-shadow:
  0px 1px 2px rgba(0, 0, 0, 0.02),
  0px 3px 3px rgba(0, 0, 0, 0.02),
  0px 8px 5px rgba(0, 0, 0, 0.01),
  0px 14px 6px rgba(0, 0, 0, 0),
  0px 22px 6px rgba(0, 0, 0, 0);
```

### Popover Shadow (5 layers)

```css
box-shadow:
  5px 7px 19px rgba(0, 0, 0, 0.02),
  18px 29px 34px rgba(0, 0, 0, 0.02),
  41px 65px 46px rgba(0, 0, 0, 0.01),
  72px 115px 54px rgba(0, 0, 0, 0),
  113px 180px 60px rgba(0, 0, 0, 0);
```

### Tooltip Shadow (5 layers)

```css
box-shadow:
  3px 2px 9px rgba(0, 0, 0, 0.05),
  13px 9px 16px rgba(0, 0, 0, 0.04),
  29px 20px 21px rgba(0, 0, 0, 0.03),
  52px 36px 25px rgba(0, 0, 0, 0.01),
  81px 56px 28px rgba(0, 0, 0, 0);
```

---

## Notes for Engineering

- **Consume semantic tokens, not primitives** in component code. Primitives are the underlying palette only.
- **Warning color is the one exception to the standard on-filled pattern** — see the callout in Section 1b. Do not assume white text on filled warning surfaces.
- **Spacing scale has intentional gaps.** Don't introduce intermediate values (e.g. a `space-7`) without checking with design first.
- This document covers **tokens, typography, and effects only.** Component inventory and behavior specs are a separate deliverable, to follow.
