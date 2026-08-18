# Razorpay Production Setup Guide — ₹799/Year Matrimony Plan

This document details the configuration required to go live with Razorpay for Nashik Teli Samaj Matrimony.

---

## 1. Environment Variables Configuration

Set the following secrets in your production `.env` file or Cloud Run environment configuration:

```env
# Razorpay Credentials (From Razorpay Dashboard > Settings > API Keys)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=yyyyyyyyyyyyyyyyyyyyyyyy
RAZORPAY_WEBHOOK_SECRET=whsec_zzzzzzzzzzzzzzzzzz

# Frontend Public Key
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
```

---

## 2. Server API Endpoints

The Express backend (`server.ts`) exposes 3 secured payment endpoints:

1. **`POST /api/payments/razorpay/create-order`**
   - Amount: `79900` paise (₹799)
   - Currency: `INR`
   - Returns official Razorpay Order ID.

2. **`POST /api/payments/razorpay/verify-payment`**
   - Validates `HMAC_SHA256(orderId + "|" + paymentId, keySecret) === signature`.
   - Rejects unverified or tampered payment payloads.

3. **`POST /api/payments/razorpay/webhook`**
   - Listens for `payment.captured` and `subscription.charged` events.
   - Verifies `X-Razorpay-Signature` header against `RAZORPAY_WEBHOOK_SECRET`.

---

## 3. Webhook Setup in Razorpay Dashboard

1. Log into [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Navigate to **Settings** > **Webhooks** > **Add New Webhook**.
3. **Webhook URL**: `https://your-domain.com/api/payments/razorpay/webhook`
4. **Secret**: Enter a secure random string (matching `RAZORPAY_WEBHOOK_SECRET`).
5. **Active Events**:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
6. Save and copy the secret.

---

## 4. Razorpay Checkout JS Integration

To enable the popup modal on client browsers:
1. Include Razorpay JS in `index.html`:
   ```html
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   ```
2. When the user clicks **"Subscribe Now — ₹799/Year"**, `SubscriptionModal.tsx` creates the order via `/api/payments/razorpay/create-order` and opens `new window.Razorpay(options).open()`.
