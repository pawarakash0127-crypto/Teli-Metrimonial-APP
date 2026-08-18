# Subscription Migration & Backfill Guide

## Overview
This document covers the execution and verification of `migrationService.ts`, which backfills missing subscription fields (`subscriptionStatus`, `paymentStatus`, `subscriptionEndDate`, etc.) for all existing legacy accounts in `users` and `profiles`.

---

## 1. Migration Logic (`src/lib/migrationService.ts`)

The migration iterates through both `users` and `profiles` collections in Firestore:

- **Legacy Active Check**: If `isPaidMember === true` or `subscriptionStatus === 'active'` and `subscriptionEndDate` is valid, it sets `subscriptionStatus: 'active'`.
- **Default Safe Fallback**: For all other accounts without subscription fields:
  - `subscriptionStatus: 'inactive'`
  - `paymentStatus: 'unpaid'`
  - `subscriptionPlan: 'none'`
  - `isPaidMember: false`

---

## 2. Running Migration

In the developer console or Admin Dashboard setup tab, execute:

```typescript
import { runSubscriptionBackfillMigration } from './src/lib/migrationService';

const result = await runSubscriptionBackfillMigration();
console.log('Migration Result:', result);
```

### Result Report Object:
```json
{
  "totalProcessed": 45,
  "usersUpdated": 42,
  "profilesUpdated": 45,
  "errors": []
}
```

---

## 3. Backward Compatibility Assurance
- Existing users without payment history remain `inactive` without crashing route guards.
- Protected routes evaluate `isSubscriptionActive()` safely using defensive null/undefined checks.
- Zero existing profile data (photos, contact numbers, family details) is modified or removed during migration.
