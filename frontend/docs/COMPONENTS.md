# 🧩 Component Documentation

This document outlines the UI architecture and the modular component strategy used in the frontend.

---

## 🏗️ Folder Structure
We follow a modular approach to keep components reusable and maintainable:
* `/components/ui`: Atomic components (Buttons, Inputs, Badges).
* `/components/features`: Complex logic components (SeatGrid, TripSearch).
* `/components/layout`: Global structures (Navbar, Footer, Sidebar).

---

## ⚡ Key Feature Components

### **SeatGrid.jsx**
* **Purpose**: Displays the bus layout and handles real-time seat selection.
* **Logic**: 
    * Listens to the `useWebSocket` hook for live updates.
    * Updates visual state when a seat is held by another user.
* **Props**: `tripId` (required).

### **AuthGuard.jsx**
* **Purpose**: Higher-Order Component (HOC) to protect private routes.
* **Function**: Checks the global state for a valid JWT; redirects to `/login` if unauthorized.



---

## 🎨 Design System
We use **Tailwind CSS** for styling.
* **Consistency**: Use the `cn()` utility for merging class names.
* **Icons**: Powered by `lucide-react`.