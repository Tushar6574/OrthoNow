# PageSpeed Insights — Results Summary

Both pages were deployed to GitHub Pages and audited with Lighthouse (mobile, throttled 4G simulation).

## Live URLs

| Page | URL |
| :--- | :--- |
| Task 1 (index.html) | https://tushar6574.github.io/OrthoNow/ |
| Task 2 (landing.html) | https://tushar6574.github.io/OrthoNow/Task%202/landing.html |

## Scores

| Metric | Target | Task 1 (index.html) | Task 2 (landing.html) |
| :--- | :--- | :--- | :--- |
| **Performance Score** | 90+ | **100** | **100** |
| **LCP** | < 2.5s | 1.1s | 1.2s |
| **CLS** | < 0.1 | 0 | 0 |
| **TBT** | < 200ms | 0ms | 0ms |
| **FCP** | < 1.8s | 1.1s | 1.2s |
| **Speed Index** | < 3.4s | 1.1s | 1.2s |

## Files in This Repo

| File | Description |
| :--- | :--- |
| `pagespeed-task1.png` | Screenshot of Task 1 Lighthouse report (mobile) |
| `pagespeed-task2.png` | Screenshot of Task 2 Lighthouse report (mobile) |
| `pagespeed-task1.html` | Full interactive Lighthouse report for Task 1 |
| `pagespeed-task2.html` | Full interactive Lighthouse report for Task 2 |

## How to Verify Independently

1. Visit https://pagespeed.web.dev
2. Paste either URL from the table above
3. Select "Mobile"
4. Click "Analyze"
5. Confirm the 90+ score

## Why Both Pages Score 100

- **Zero external requests**: No external CSS, JS, fonts, or images
- **System font stack**: No web font loading (eliminates FOUT/FOIT)
- **Inlined critical CSS**: All styles in `<head>`, no render-blocking
- **Script at end of body**: Equivalent to `defer`, no parse-blocking
- **No layout shifts**: Fixed CTA uses `transform`, no dynamic body padding
- **Minimal JS**: Single IIFE, no frameworks, no loops
- **Total page weight**: ~20KB (industry average: 2.5MB)
