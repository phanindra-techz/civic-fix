# CivicFix Design System & Engineering Rules

## 1. Visual Theme & Color Palette
- **Light Theme by Default**: Clean, high-contrast, professional government & enterprise civic product.
- **Page Background**: `#F7F8FA`
- **Surfaces & Cards**: `#FFFFFF`
- **Borders & Dividers**: `1px solid #E4E7EC`
- **Text Primary**: `#101828`
- **Text Secondary / Muted**: `#667085`
- **Brand Navy**: `#0B1437` (used for top navigation bar, officer desktop sidebar, and primary section headings)
- **Brand Teal**: `#0FB5A8` (used exclusively for primary action buttons, links, and active navigation states)
- **Status Colors** (STRICTLY used for status only; never as arbitrary background gradients):
  - Green `#12B76A`: Resolved
  - Amber `#F79009`: In Progress / Medium Priority
  - Red `#F04438`: High Priority / Critical
  - Orange `#FF7A30`: Escalated (statutory SLA breach)
  - Grey `#98A2B3`: Reported / Closed / Inactive

## 2. Surfaces, Shadows & Radii
- **No Decorative Gradients**: Remove all purple/blue gradients, glassmorphism, back-drop blurs, glow effects, and blurred background blobs.
- **Flat Crisp Surfaces**: White card backgrounds with `1px border #E4E7EC`.
- **Subtle Shadows**: `box-shadow: 0 1px 2px 0 rgba(16, 24, 40, 0.06), 0 1px 3px 0 rgba(16, 24, 40, 0.08)`.
- **Border Radii**:
  - `8px` (`rounded-lg`) for inputs, buttons, select fields, and badges.
  - `12px` (`rounded-xl`) for cards, dialogs, drawers, and metric tiles.

## 3. Typography & Formatting
- **Font Family**: Inter (`--font-inter`), with fallback to Noto Sans Devanagari and Telugu for Indian local language scripts.
- **Scale**: 12px (`text-xs`), 14px (`text-sm`), 16px (`text-base`), 20px (`text-xl`), 24px (`text-2xl`), 32px (`text-3xl`).
- **Font Weights**: Regular (400) for descriptions, Medium (500) for labels & metadata, Semibold (600) for headings. Never use extra-bold/black.
- **Tabular Numerals**: Use `tabular-nums font-mono` for report IDs (`CF-2026-0147`), timestamps, SLA timers, and metric counters.
- **Alignment**: Strict left-alignment for copy, labels, and content blocks.

## 4. Icons & Emojis
- **Icon Set**: `lucide-react` only.
- **Stroke Width**: `1.75px`.
- **Icon Sizing**: 16px to 20px.
- **Zero Emojis**: Absolutely no emojis anywhere in the interface or copy.

## 5. Spacing Grid
- Strict 4px / 8px grid (e.g., `gap-2` [8px], `gap-3` [12px], `gap-4` [16px], `p-4` [16px], `p-6` [24px]).
- Generous whitespace on citizen-facing mobile views.
- High data density on municipal officer dashboard views.

## 6. Motion & Animation
- Restrained transitions: `150ms` to `200ms` `cubic-bezier(0.16, 1, 0.3, 1)`.
- No bouncing, spinning, or continuous floating animations.
- **Only two signature moments allowed**:
  1. The AI scan overlay on newly captured defect photos.
  2. The orange Escalated state transition for SLA breach.

## 7. Accessibility & Touch Targets
- Minimum 44x44px touch targets on mobile viewports.
- Visible, high-contrast focus rings (`focus:ring-2 focus:ring-[#0FB5A8] focus:outline-none`).
- Semantic HTML tags (`<main>`, `<header>`, `<nav>`, `<section>`, `<h1>`-`<h3>`, `<button>`, `<label>`).
- Explicit form labels for all inputs.

## 8. Real-World Indian Municipal Context
- Departments:
  - GHMC Engineering (Roads)
  - Solid Waste Management
  - TSSPDCL (Electricity & Streetlights)
  - HMWSSB (Drainage & Water Supply)
  - Hyderabad Traffic Police
- Realistic Wards: Ward 98 (Banjara Hills), Ward 104 (Kondapur), Ward 112 (Madhapur / HITEC City), Ward 82 (Jubilee Hills), Ward 74 (Charminar).
- Verbs on Action Buttons: "Report an issue", "Track status", "Assign officer", "Mark as resolved", "Escalate to Commissioner".
- Helpful Empty & Error States: Clear, supportive guidance instead of tech jargon.
