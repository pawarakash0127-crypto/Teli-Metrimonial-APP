# Subscription Data Schema Reference

## Overview
All subscription records strictly adhere to the unified schema across `users`, `profiles`, and `subscriptions` collections in Firestore.

---

## 1. User & Profile Document Fields (`users/{uid}` & `profiles/{uid}`)

```typescript
interface SubscriptionProfileSchema {
  // Subscription Lifecycle
  subscriptionStatus: 'active' | 'inactive' | 'expired' | 'pending';
  paymentStatus: 'paid' | 'unpaid' | 'pending' | 'free';
  subscriptionPlan: 'annual_799' | 'none';
  
  // Timestamps (ISO 8601 Strings or Firestore Timestamps)
  subscriptionStartDate: string; // e.g. "2026-08-14T09:00:00.000Z"
  subscriptionEndDate: string;   // e.g. "2027-08-14T09:00:00.000Z"
  lastPaymentDate: string;       // e.g. "2026-08-14T09:00:00.000Z"
  
  // Payment Identifiers
  paymentId: string;             // Razorpay Payment ID or Transaction ID
  razorpayOrderId: string;       // Razorpay Order ID
  paymentProvider: 'razorpay' | 'admin_manual' | 'mock' | 'system';
  
  // Quick Query Helpers
  isPaidMember: boolean;          // true if subscriptionStatus === 'active'
}
```

---

## 2. Subscription Audit Document (`subscriptions/{subId}`)

```typescript
interface SubscriptionAuditSchema {
  subId: string;                 // Document ID
  uid: string;                   // Member UID
  profileId?: string;            // Vadhu/Var ID (e.g. M1042)
  
  plan: 'annual_799';
  amount: number;                // 799
  currency: 'INR';
  
  status: 'active' | 'revoked' | 'expired';
  paymentStatus: 'paid' | 'refunded' | 'failed';
  
  orderId: string;
  paymentId: string;
  provider: string;              // 'razorpay' | 'admin' | 'mock'
  
  startDateISO: string;
  endDateISO: string;
  activatedAtISO: string;
  
  channel: 'web' | 'android' | 'admin';
  notes?: string;
}
```

---

## 3. Security Rules Enforcements (`firestore.rules`)

```groove
match /subscriptions/{subId} {
  // Members can read their own transaction records
  allow read: if request.auth != null && (
    resource.data.uid == request.auth.uid || 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
  // Only authenticated members or admins can create audit documents
  allow create, update: if request.auth != null;
  allow delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```
