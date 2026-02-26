# 🧠 State Management

This project utilizes a centralized state management system to ensure data consistency across the application.

---

## 🏪 Global Stores (Zustand)

### **Auth Store** (`src/store/authStore.js`)
| State | Type | Description |
| :--- | :--- | :--- |
| `user` | Object | Current logged-in user details. |
| `token` | String | JWT stored in localStorage/Cookies. |
| `login()` | Function | Updates state and sets persistent storage. |

### **Booking Store** (`src/store/bookingStore.js`)
* **`selectedSeats`**: Tracks seats picked by the user before checkout.
* **`isHolding`**: Boolean to indicate if a Redis lock is active.



---

## 📡 API Integration
We use **Axios** for all REST communications.
* **Interceptors**: Automatically adds `Authorization: Bearer <token>` to every request if the token exists in the store.
* **Error Handling**: Centralized toast notifications for `401` or `500` errors.