# Teli Samaj Matrimony — Subscription System Architecture

## Overview
The Subscription System manages annual memberships (₹799/year) for the Nashik Teli Samaj Matrimony portal. It controls access to restricted features such as phone numbers, parent contact details, direct messaging, and Kundali matching reports.

---

## Key Components

### 1. Centralized Access Control (`RequireMembership.tsx` & `subscriptionService.ts`)
- **Single Source of Truth**: All feature permissions stem from `isSubscriptionActive(userProfile)` in `src/lib/subscriptionService.ts`.
- **Route Guard (`RequireMembership.tsx`)**: Protects routes like `/search`, `/profile/:id`, and `/notifications`. Non-subscribers are redirected to `/subscription`.
- **Selective UI Guards**: Phone numbers and parent details inside `ProfileDetails.tsx` evaluate `isSubscriptionActive()` to determine whether to unmask numbers or prompt activation.

### 2. Dual-Collection Firestore Synchronization
Subscription state is normalized and denormalized across Firestore collections:
- **`users/{uid}`**: Primary user authentication record storing `subscriptionStatus`, `paymentStatus`, `subscriptionEndDate`, etc.
- **`profiles/{uid}`**: Public member profile document synced with subscription fields for query efficiency.
- **`subscriptions/{subId}`**: Immutable transaction log storing order IDs, payment IDs, activation timestamps, and audit notes.

### 3. Payment Gateway Abstraction (`paymentService.ts` & `RazorpayPaymentProvider.ts`)
- **Factory Pattern**: Encapsulates payment provider logic, allowing switching between Razorpay Live, Razorpay Test, and Mock Simulator.
- **Security Constraint**: The frontend never determines subscription status independently. Payments are verified server-side or via cryptographic signatures before updating Firestore.

### 4. Admin Management Controls (`Admin.tsx` & `Profile.tsx`)
- **Admin Tab (`/admin` -> Subscriptions)**: Provides high-level revenue analytics, active subscriber counters, filtering (All, Active, Expired, Inactive), and manual controls.
- **Manual Overrides**: Administrators can grant 1-year memberships, extend validity by 365 days, or revoke subscriptions with audit trails.

---

## Data Flow Diagram

```
[ User Payment / Admin Action ]
             │
             ▼
[ Razorpay REST API / Backend verification (/api/payments/razorpay/*) ]
             │
             ▼
[ activateSubscriptionInFirestore() in subscriptionService.ts ]
             │
   ┌─────────┴─────────┐
   ▼                   ▼
[ users/{uid} ]   [ profiles/{uid} ]   ──►  [ subscriptions/{docId} ]
 (Status, Dates)   (Status, Dates)           (Audit Log Document)
```
