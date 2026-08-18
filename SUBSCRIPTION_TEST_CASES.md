# Subscription System QA Test Plan & Verification Results

## QA Test Matrix — ₹799/Year Matrimony Subscription

| Test Case ID | Feature / Component | Test Steps | Expected Outcome | Result |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | User Registration | Register a new profile via phone OTP / email. | Account created with `subscriptionStatus: 'inactive'`, `paymentStatus: 'unpaid'`. | **PASS** |
| **TC-02** | Protected Route Access (Non-Subscriber) | Log in as non-subscriber & navigate to `/search` or `/profile/M1001`. | Intercepted by `RequireMembership.tsx` and redirected to `/subscription`. | **PASS** |
| **TC-03** | Subscription Pricing Page | Open `/subscription`. | Displays ₹799/Year Annual Plan, benefits list, and current status. | **PASS** |
| **TC-04** | Payment Modal Trigger | Click "Subscribe Now — ₹799/Year". | Opens `SubscriptionModal.tsx` showing order details & simulator mode. | **PASS** |
| **TC-05** | Successful Payment & Activation | Complete payment in modal with `Successful` mode selected. | Updates `users`, `profiles`, creates `subscriptions` record. Redirects & unlocks access. | **PASS** |
| **TC-06** | Phone Number Unmasking | View profile details as active subscriber. | Contact phone number & WhatsApp direct links are fully unmasked. | **PASS** |
| **TC-07** | Failed Payment Handling | Select `Failed` payment mode in simulator. | Toast alert displays failure message; subscription status remains `inactive`. | **PASS** |
| **TC-08** | Account Details Tab | Log in & go to `/profile` > Account tab. | Displays Membership Card with Status, Validity Dates, Payment ID, and Days Left. | **PASS** |
| **TC-09** | Admin Subscription Tab | Log in as admin & go to `/admin` > Subscriptions tab. | Displays Revenue KPI cards, Active/Expired filters, and member table. | **PASS** |
| **TC-10** | Admin Manual Grant | Click "Grant Subscription" for an inactive member in Admin tab. | Manually activates 1-year subscription in Firestore & updates UI status badge instantly. | **PASS** |
| **TC-11** | Admin Revoke Membership | Click "Revoke" for an active member. | Sets `subscriptionStatus: 'inactive'` and updates audit trail. | **PASS** |
| **TC-12** | Database Migration Backfill | Run `runSubscriptionBackfillMigration()`. | Iterates `users` and `profiles`, backfilling missing subscription fields seamlessly. | **PASS** |
