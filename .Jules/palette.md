## 2024-05-14 - Redundant ARIA labels on Title attributes
**Learning:** Adding `aria-label` to buttons that already have a `title` attribute with the exact same text is slightly redundant, as screen readers often fall back to `title` for the accessible name when `aria-label` is missing.
**Action:** Before adding an `aria-label`, check if the element already has a descriptive `title` attribute. If the `title` provides sufficient accessible context, skip the `aria-label` to keep the code cleaner, or use `aria-label` if it needs to be more descriptive than the tooltip.
