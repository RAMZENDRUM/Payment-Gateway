# 📜 ZenWallet API Contract & Product Specification

## 1. Core Identity & Authentication

**ZenWallet must provide:**
* **API Key** (secret)
* **App ID**
* **Environment** (sandbox / production)

**Why:** Identifies *which app* created *which transaction*. Without this, the system is insecure and useless.

**Example:**
```text
APP_ID: app_4Kx91
API_KEY: zw_sk_test_a83...
ENV: sandbox
```

---

## 2. Base API Information

```text
Base URL (Sandbox): https://api.sandbox.zenwallet.io
Base URL (Prod):    https://api.zenwallet.io
API Version:        v1
```

---

## 3. Payment Creation (The Contract)

**Endpoint:** `POST /payments`

**Request:**
```json
{
  "amount": 1200,
  "currency": "COIN",
  "reference": "ORDER_10231",
  "customer_id": "cust_88x",
  "callback_url": "https://clientapp.com/webhooks/zenwallet"
}
```

**Response:**
```json
{
  "payment_id": "zw_pay_92KX",
  "status": "PENDING",
  "expires_at": "2026-01-26T13:00:00Z"
}
```

---

## 4. Transaction Lifecycle

**Strict State Machine:**
1. `PENDING` → `SUCCESS`
2. `PENDING` → `FAILED`
3. `PENDING` → `EXPIRED`
4. `PENDING` → `CANCELLED` (Optional)

**Why:** Client apps build logic on these exact states. Ambiguity causes integration failure.

---

## 5. Real-Time Webhooks (Non-Negotiable)

**Client provides:** `webhook_url`

**ZenWallet sends (Event):**
```json
{
  "event": "payment.success",
  "payment_id": "zw_pay_92KX",
  "status": "SUCCESS",
  "amount": 1200,
  "reference": "ORDER_10231",
  "timestamp": "2026-01-26T12:05:00Z"
}
```

**Security:**
* **Webhook Secret** provided to client.
* **Signature Header**: `X-Zen-Signature: sha256=9ad8f...`

---

## 6. Payment Query (Fallback)

**Endpoint:** `GET /payments/{payment_id}`

**Response:**
```json
{
  "payment_id": "zw_pay_92KX",
  "status": "SUCCESS",
  "amount": 1200
}
```

---

## 7. Dashboard Requirements (Human Layer)

The desktop-first dashboard must provide:
* **Transactions List**
* **Payment Detail View**
* **Webhook Delivery Logs** (Critical for debugging)
* **API Key Management** (Rotation, View)
* **App Management**

---

## 8. Reliability & Limits

* **Rate Limit:** 100 requests/min
* **Webhook Retries:** 5 attempts (exponential backoff)
* **Timeout:** 5 seconds

---

## 9. Developer Experience (DX)

* **Sandbox Mode:** Fake payments, manual success/fail triggers.
* **Documentation:** Quick start, error codes, sample payloads.

---

## 10. Product Summary

> **ZenWallet provides secure APIs and webhooks that allow external applications to create transactions and receive instant, trusted payment status updates — without handling real money.**

---

### What ZenWallet does NOT expose:
* ❌ Real money wording
* ❌ Bank / UPI terminology
* ❌ Frontend API keys
* ❌ Direct DB access
