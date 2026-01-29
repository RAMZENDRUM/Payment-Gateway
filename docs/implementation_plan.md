# Implementation Plan - Secure Virtual Wallet System (Coins/Credits)

This project implements a closed-loop virtual wallet system using Node.js, Express, React, and PostgreSQL (Supabase).

## Tech Stack
- **Frontend**: Vite + React + TailwindCSS (requested premium design)
- **Backend**: Node.js + Express + JWT + Prisma (for DB access)
- **Database**: PostgreSQL (Supabase)
- **QR Codes**: `qrcode` (gen), `html5-qrcode` (scan)

## 1. Database Schema
- `User`: Handles authentication and profile information.
- `Wallet`: Stores coin balances for each user.
- `Transaction`: Records all movement of coins (Send, Receive, Pay).
- `PaymentRequest`: Stores data for QR-based payment requests (one-time use, expiry).

## 2. Backend Features
- **Auth**: JWT-based login/register.
- **Wallet**: Check balance, view transaction history.
- **Transfers**: Atomic transfer of coins between users.
- **QR Payments**:
  - Generate a signed token for a payment request.
  - Validate token, check expiry, and ensure it's not already used.
  - Atomic deduction and credit.
- **Admin**: Endpoint to manually add coins to a user's wallet.
- **External API**: Webhook-ready endpoints for initiating payments.

## 3. Frontend Features (Premium Design)
- **Mobile-first UI**: Mimics real payment apps (PhonePe/GPay style).
- **Dashboard**: Quick balance view, recent transactions.
- **Send Money**: Via email/user ID.
- **QR Scanner**: Live camera scanning for payments.
- **My QR**: Personal QR for receiving coins.
- **History**: Detailed transaction log.

## 4. Security Measures
- **JWT**: Secure token-based access.
- **Atomic Transactions**: Using DB transactions to prevent double-spending or partial failures.
- **QR Tokens**: Unique, time-limited, and single-use.
- **Server Validations**: All logic happens on the server; the client only displays.

## 6. External Integration (Merchant API)
To connect another website to this wallet app, use the External API:

### 1. Create Payment Request
- **URL**: `POST /api/external/create-request`
- **Headers**: `x-api-key: your-api-key`
- **Body**:
```json
{
  "amount": 50,
  "merchantId": "your-user-id",
  "referenceId": "order_123",
  "callbackUrl": "https://your-site.com/callback"
}
```
- **Response**: Returns a `paymentUrl`. Redirect your user to this URL.

### 2. Verify Payment
- **URL**: `GET /api/external/status/:token`
- **Headers**: `x-api-key: your-api-key`
- **Purpose**: Check if the status is `COMPLETED` before fulfilling the order.

### 3. Verify by Reference & Merchant ID
- **URL**: `GET /api/external/verify-reference?merchantId=...&referenceId=...`
- **Headers**: `x-api-key: your-api-key`
- **Purpose**: Check if IDs match and payment is received.
- **Response**:
```json
{
  "received": true,
  "message": "YES: Payment is received",
  "details": { "amount": 50, "time": "..." }
}
```

---
**Merchant Demo**: I have created `merchant-demo.html` in the root folder. You can open it in your browser to see a working example of the integration!
