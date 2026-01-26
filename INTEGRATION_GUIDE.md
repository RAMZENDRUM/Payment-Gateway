# ZenWallet Integration Guide

Welcome to **ZenWallet**! This guide will help you integrate our secure payment gateway into your application.

## 1. Quick Start Config
**Base API URL:**
`https://payment-gateway-up7l.onrender.com/api`

**Merchant ID (Test):**
`f294121c-2340-4e91-bf65-b550a6e0d81a`

---

## 2. Generate API Keys
1. Go to [ZenWallet Developer Dashboard](https://payment-gateway-up7l.onrender.com/developers).
2. Login with your ZenWallet account (or register).
3. Click **"Generate New Key"**.
4. Copy the `x-api-key` (e.g., `app_...`).

> **Note:** Share these credentials securely with your developer friend.

---

## 3. How to Create a Payment Request
Call this endpoint when the user clicks "Checkout" or "Pay".

**Endpoint:** `POST /external/create-request`
**Headers:**
- `Content-Type: application/json`
- `x-api-key: YOUR_API_KEY`

**Body:**
```json
{
  "amount": 500,
  "merchantId": "YOUR_MERCHANT_ID",
  "referenceId": "ORDER-12345",
  "callbackUrl": "https://your-app.com/payment/success?order_id=123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "PAY-TOKEN-XYZ",
    "paymentUrl": "https://payment-gateway-up7l.onrender.com/pay?token=PAY-TOKEN-XYZ"
  }
}
```

👉 **Action:** Redirect the user's browser to `paymentUrl`.

---

## 4. Verifying Payment Success
After payment, ZenWallet redirects the user back to your `callbackUrl` with `?status=success&token=...`.

**Server-Side Verification (Recommended):**
Call this endpoint to ensure the payment is valid.

**Endpoint:** `GET /external/verify-reference`
**Query Params:** `?merchantId=...&referenceId=...`
**Headers:** `x-api-key: YOUR_API_KEY`

**Response:**
```json
{
  "received": true,
  "amount": 500,
  "status": "COMPLETED"
}
```

---

## Example Code (JavaScript/Node.js)

```javascript
const API_URL = "https://payment-gateway-up7l.onrender.com/api/external";
const API_KEY = "your_api_key_here";

// 1. Initiate Payment
async function startPayment(amount, orderId) {
    const res = await fetch(`${API_URL}/create-request`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-api-key': API_KEY 
        },
        body: JSON.stringify({
            amount: amount,
            merchantId: "f294121c-2340-4e91-bf65-b550a6e0d81a",
            referenceId: orderId,
            callbackUrl: window.location.origin + "/success"
        })
    });
    
    const data = await res.json();
    if(data.success) {
        window.location.href = data.data.paymentUrl; // Redirect user
    }
}
```

## Need Help?
Contact the ZenWallet team for support.
