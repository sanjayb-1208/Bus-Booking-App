# 🎨 Styling & Theme Guide

This document defines the visual standards and Tailwind configuration for the project.

---

## 🌈 Color Palette
These colors are defined in `tailwind.config.js` under the `theme.extend` section:

| Utility Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `primary` | `#1D4ED8` | Primary Actions / Branding |
| `secondary` | `#64748B` | Secondary Text / Neutral Buttons |
| `success` | `#22C55E` | Available Seats / Success Alerts |
| `danger` | `#EF4444` | Booked Seats / Error States |
| `warning` | `#F59E0B` | Held Seats (Pending) |

---

## 📱 Responsiveness
We follow a **Mobile-First** strategy.
* **Mobile**: Default classes (e.g., `w-full`).
* **Tablet**: `md:` prefix (e.g., `md:w-1/2`).
* **Desktop**: `lg:` prefix (e.g., `lg:w-1/4`).



---

## 🛠️ Layout Patterns
* **Grid**: Used for the Seat Map (typically `grid-cols-4`).
* **Flexbox**: Used for Navigation and Form alignment.