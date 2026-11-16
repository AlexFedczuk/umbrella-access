---
name: Bio-Surveillance Security Architecture
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#5c403f'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#906f6e'
  outline-variant: '#e5bdbb'
  surface-tint: '#bf0229'
  primary: '#9e001f'
  on-primary: '#ffffff'
  primary-container: '#c8102e'
  on-primary-container: '#ffdad8'
  inverse-primary: '#ffb3b1'
  secondary: '#5c5e66'
  on-secondary: '#ffffff'
  secondary-container: '#e0e2ec'
  on-secondary-container: '#62646d'
  tertiary: '#434d61'
  on-tertiary: '#ffffff'
  tertiary-container: '#5b657a'
  on-tertiary-container: '#d9e3fb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#92001c'
  secondary-fixed: '#e0e2ec'
  secondary-fixed-dim: '#c4c6d0'
  on-secondary-fixed: '#191c22'
  on-secondary-fixed-variant: '#44474f'
  tertiary-fixed: '#d9e3fb'
  tertiary-fixed-dim: '#bdc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3d475a'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: '0'
  label-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system establishes an uncompromising corporate bio-surveillance visual language. Designed for critical perimeter monitoring, facility access management, and biosecurity containment operations, the interface projects absolute clinical authority, procedural precision, and systematic calm.

The design movement combines **Minimalism** with **High-Contrast Structuralism**. The interface avoids decorative trends, skeuomorphic noise, or ambient distractions. Pure clinical whites, razor-sharp hairline dividers, dense tabular data grids, and stark corporate crimson indicators command attention only where protocol deviations or clearance actions occur.

Primary emotional directives:
- **Procedural Trust:** Every surface feels rigorously audited, immutable, and regulated.
- **Immediate Legibility:** Mission-critical statuses (clearance levels, biometric validation, hazard quarantine) register instantaneously.
- **Sterile Efficiency:** High data density wrapped in clean, high-contrast framing to support continuous 24/7 operations room monitoring.

## Colors

The color palette is engineered for clinical clarity under high-stress operator workflows, prioritizing pure white surfaces accented by distinct organizational identifiers and operational statuses.

### Core Architecture Palette
- **Brand Primary Accent (`#C8102E`):** Canonical Corporate Crimson. Reserved strictly for system authorizations, clearance tier highlights, emergency overrides, and brand anchors.
- **On-Surface / Primary Text (`#1A1D24`):** High-density carbon black delivering maximal contrast against pure white backgrounds.
- **On-Surface-Variant / Secondary Text (`#667085`):** Neutral slate for metadata, timestamps, protocol signatures, and secondary field tags.
- **Surface Canvas / Panels (`#FFFFFF`):** Pure clinical white base for workstations, data cards, containment status feeds, and modal surfaces.
- **Surface-Container-Low / Secondary Canvas (`#F5F6F8`):** Off-white tinted background applied to canvas backdrops, sidebars, and inactive tabular rows.
- **Outline / Border (`#E5E7EB`):** Crisp, low-contrast structural boundaries maintaining tabular structure without visual bloat.

### Functional Status Indicators
- **Authorized / Secure (`#16A34A`):** Personnel granted access, biometric match confirmed, containment parameters nominal.
- **Pending / Audit Review (`#D97706`):** Dual-custody authorization pending, badge re-scan required, telemetry updating.
- **Denied / Breach (`#DC2626`):** Unauthorized breach attempt, credential revoked, facility lockout engaged.

## Typography

Inter serves as the universal typographic engine for all UI contexts. Its mechanical glyph construction, tall x-height, and tabular numeral support accommodate dense instrumentation logs and multi-level security hierarchies.

- **Display & Headlines:** Set in bold and semi-bold weights with negative tracking to convey structural authority across dashboard headers and facility zone designations.
- **Body:** Calibrated at 14px default (`body-md`) to optimize information density within dense log views and complex form configurations.
- **Labels & Monospace Metadata:** Monospace digits are enforced across timestamps, clearance badge IDs, and IP subnets using `font-feature-settings: "tnum" on, "cv05" on`. Upper-level micro-labels (`label-sm`, `label-md`) use uppercase casing and expanded tracking (`0.04em`–`0.06em`) for categorical classification tags.

## Layout & Spacing

Layouts follow a structured **fluid grid** paradigm that balances compact analytical data density with precise spatial hierarchy.

### Layout Model
- **Grid Architecture:** 12-column fluid grid system across desktop viewports; 4-column system for handheld terminals and mobile security tablets.
- **Navigation Framing:** Persistent 240px clean light sidebar paired with a 56px sticky utilitarian topbar. Both remain light-themed (`#FFFFFF` background with `#E5E7EB` right/bottom hairline borders).
- **Spatial Multiplier:** A rigid 4px base scale governs all layout gaps and internal component insets (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 16px, `space-lg` = 24px, `space-xl` = 32px).

### Form Factors & Adaptation
- **Desktop (1280px+):** Full 12-column layout with 24px gutters. Tri-pane layouts (navigation sidebar, primary data grid, contextual inspector pane) operate simultaneously.
- **Tablet / Patrol Console (768px – 1279px):** Collapsible sidebar shifts into an icon-rail format (64px width); inspector panes stack beneath the primary ledger or tuck into sliding modal drawbars.
- **Mobile Handheld (320px – 767px):** Single-column stack. Tables reflow into structured key-value clearance cards with persistent top-level filter toggles.

## Elevation & Depth

Visual hierarchy relies on **crisp structural outlines** and subtle tonal surfaces rather than heavy drop shadows. This preserves the sterile, high-precision atmosphere demanded by biosecurity command environments.

- **Flat Outlines:** Primary visual separation between panels, cards, and toolbars is executed via 1px solid borders (`#E5E7EB`). 
- **Surface Nesting:** Depth is communicated by nesting pure white (`#FFFFFF`) containers over the cool neutral canvas (`#F5F6F8`). Inner table headers and auxiliary panes use light gray fills (`#F5F6F8`) with inset borders.
- **Modal & Popover Depth:** Floating overlays (e.g., biometric override dialogs, personnel clearance inspectors) utilize an ultra-diffused, sharp structural shadow: `0 4px 12px rgba(26, 29, 36, 0.06), 0 1px 2px rgba(26, 29, 36, 0.04)`, combined with a 1px border (`#E5E7EB`).
- **Active Focus & Override States:** Active elements receive a sharp 2px focus ring tinted with Corporate Crimson (`#C8102E`) and a 0px blur offset.

## Shapes

The interface implements a **soft clinical curvature** (`roundedness: 1`), utilizing controlled 4px to 6px radii to balance industrial rigidity with contemporary software polish.

- **Base Radius (`0.25rem` / 4px):** Applied to form controls, inputs, operational buttons, badges, chips, and notification banners.
- **Container Radius (`0.5rem` / 8px):** Applied to top-level modular panels, data cards, modals, and slide-over drawers.
- **Strict Square Radii (`0px`):** Enforced across tabular cells, progress tracking indicators, and split layout dividers to emphasize continuous operational telemetry.

## Components

### Buttons
- **Primary Action (Clearance/Authorize):** Background `#C8102E`, text `#FFFFFF`, 0.25rem border-radius, font weight 600, height 36px. Hover state shifts to `#A60D25`. Active state engages `#850B1E`.
- **Secondary / Neutral:** Background `#FFFFFF`, border 1px solid `#E5E7EB`, text `#1A1D24`. Hover state transitions background to `#F5F6F8`.
- **Destructive / Lockout:** Background `#DC2626`, text `#FFFFFF`, border-radius 0.25rem. Hover state `#B91C1C`.

### Clearance Chips & Status Badges
- **Structure:** 20px height, 0.25rem radius, padding 2px 8px, font size 11px (`label-md`), uppercase tracking.
- **Authorized / Confirmed:** Background `#DCFCE7`, border 1px solid `#86EFAC`, text `#166534`.
- **Pending / In Review:** Background `#FEF3C7`, border 1px solid `#FCD34D`, text `#92400E`.
- **Denied / Quarantined:** Background `#FEE2E2`, border 1px solid `#FCA5A5`, text `#991B1B`.

### Form Inputs & Select Fields
- **Container:** Pure `#FFFFFF` background, 1px solid `#E5E7EB` border, 36px height, 0.25rem radius, text `#1A1D24`.
- **Placeholder:** `#667085`.
- **Focus:** 1px solid `#C8102E` border with a 1px ring in `rgba(200, 16, 46, 0.15)`. No ambient halo.

### Checkboxes & Radios
- **Unchecked:** 16px × 16px, `#FFFFFF` background, 1px solid `#E5E7EB` border, 0.125rem radius (checkboxes) or full circle (radios).
- **Checked:** Background `#C8102E`, border `#C8102E`, white checkmark or center pin. Focus outline `#C8102E`.

### Data Cards & Audit Tables
- **Cards:** Background `#FFFFFF`, 1px solid `#E5E7EB` perimeter, 0.5rem radius, internal padding 16px or 24px. Header sections feature a bottom 1px divider (`#E5E7EB`).
- **Tables:** Monospace timestamps and alphanumeric serials. Column headers use `#F5F6F8` background, uppercase `label-sm` font, and 8px vertical padding. Alternating rows remain white with `#E5E7EB` bottom hairline dividers. Row hover triggers a subtle `#F5F6F8` shift.

### Specialized Security Components
- **Biometric Clearance Drawer:** Slide-out right-hand sheet with `#FFFFFF` background, 1px solid `#E5E7EB` left border, containing live facial verification, keycard serials, and clearance level assignment toggles.
- **Facility Lockdown Banner:** Top-level persistent banner spanning full width, background `#FEF2F2`, 1px bottom border `#FCA5A5`, text `#991B1B`, punctuated by an operational override button in primary `#C8102E`.