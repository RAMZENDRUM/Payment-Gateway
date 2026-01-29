# 🏗️ ZenWallet Architecture V2 - Virtual Payment Gateway

## Product Definition

**ZenWallet** is a **Virtual Payment Gateway / Payment Event API** system that allows multiple applications to integrate payment request tracking and real-time status notifications.

### What It DOES ✅
- ✅ Generates payment requests
- ✅ Emits real-time payment status updates
- ✅ Notifies connected apps instantly via webhooks
- ✅ Tracks transactions centrally
- ✅ Acts as single source of truth for payment states
- ✅ Manages multiple app integrations

### What It DOES NOT Do ❌
- ❌ No real money transfer
- ❌ No UPI / cards / banks
- ❌ No settlement, no KYC, no compliance
- ❌ No actual financial transactions

---

## Architecture Overview

### Actors

1. **ZenWallet Platform (Gateway)** - The core system
2. **Client Apps** - External applications integrating via API
3. **End Users** - People making payments through client apps

### Payment Flow

```
Client App
   |
   | 1. POST /api/payments/create (with API key)
   ↓
ZenWallet Gateway
   |
   | 2. Generate payment_id + status = PENDING
   | 3. Return payment URL / QR code
   | 4. Store in database
   ↓
End User Action
   |
   | 5. User "completes" payment (simulated)
   | 6. Status changes: SUCCESS / FAILED / EXPIRED
   ↓
ZenWallet Gateway
   |
   | 7. Send webhook to Client App
   | 8. Update dashboard in real-time
   | 9. Log webhook delivery
   ↓
Client App receives notification
```

---

## Core Components

### 1. API Layer (REST + WebSocket)

#### Authentication
```http
Authorization: Bearer sk_live_xxxxxxxxxxxxx
```

Each connected app gets:
- API Key (`sk_live_*` or `sk_test_*`)
- App ID (UUID)
- Environment (test/production)
- Webhook URL (optional)

#### Required Endpoints

##### Payment Creation
```http
POST /api/payments/create
Authorization: Bearer sk_live_xxx

{
  "amount": 500,
  "currency": "COINS",
  "reference_id": "ORDER_123",
  "description": "Event Ticket Purchase",
  "webhook_url": "https://myapp.com/payment-webhook",
  "metadata": {
    "order_id": "123",
    "user_email": "user@example.com"
  }
}

Response:
{
  "payment_id": "pay_abc123xyz",
  "status": "PENDING",
  "amount": 500,
  "currency": "COINS",
  "payment_url": "https://zenwallet.app/pay/pay_abc123xyz",
  "qr_code": "data:image/png;base64,...",
  "expires_at": "2026-01-26T11:00:00Z",
  "created_at": "2026-01-26T10:30:00Z"
}
```

##### Get Payment Status
```http
GET /api/payments/{payment_id}
Authorization: Bearer sk_live_xxx

Response:
{
  "payment_id": "pay_abc123xyz",
  "status": "SUCCESS",
  "amount": 500,
  "reference_id": "ORDER_123",
  "completed_at": "2026-01-26T10:35:00Z",
  "transaction_id": "txn_xyz789"
}
```

##### Manual Status Update (Admin/Test)
```http
POST /api/payments/{payment_id}/complete
Authorization: Bearer sk_live_xxx

{
  "status": "SUCCESS" | "FAILED",
  "notes": "Payment completed by user"
}
```

##### List Payments
```http
GET /api/payments?status=SUCCESS&limit=50
Authorization: Bearer sk_live_xxx
```

---

### 2. Webhook System

#### Configuration
Each app provides a webhook URL during setup or per-payment.

#### Webhook Payload
```json
{
  "event": "payment.success",
  "payment_id": "pay_abc123xyz",
  "status": "SUCCESS",
  "amount": 500,
  "currency": "COINS",
  "reference_id": "ORDER_123",
  "transaction_id": "txn_xyz789",
  "completed_at": "2026-01-26T10:35:00Z",
  "metadata": {
    "order_id": "123",
    "user_email": "user@example.com"
  },
  "signature": "sha256_hmac_signature"
}
```

#### Webhook Verification
```javascript
const signature = hmac_sha256(secret, payload);
// Client verifies signature matches
```

#### Webhook Retry Logic
- Initial attempt: immediate
- Retry 1: after 5 seconds
- Retry 2: after 30 seconds
- Retry 3: after 5 minutes
- Max retries: 3
- All attempts logged

---

### 3. Data Models

#### App
```sql
CREATE TABLE apps (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  api_key VARCHAR(255) UNIQUE,
  api_secret VARCHAR(255),
  webhook_url TEXT,
  environment VARCHAR(20), -- 'test' or 'production'
  owner_user_id UUID,
  created_at TIMESTAMP,
  is_active BOOLEAN
);
```

#### Payment
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  payment_id VARCHAR(50) UNIQUE, -- pay_xxx
  app_id UUID REFERENCES apps(id),
  amount DECIMAL(15,2),
  currency VARCHAR(10),
  status VARCHAR(20), -- PENDING, SUCCESS, FAILED, EXPIRED
  reference_id VARCHAR(255),
  description TEXT,
  metadata JSONB,
  webhook_url TEXT,
  payment_url TEXT,
  qr_code TEXT,
  transaction_id UUID,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

#### WebhookLog
```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY,
  payment_id VARCHAR(50),
  app_id UUID,
  webhook_url TEXT,
  request_payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  attempt_number INTEGER,
  delivered BOOLEAN,
  created_at TIMESTAMP
);
```

---

### 4. Dashboard Pages (Desktop SaaS)

#### A. Dashboard (Overview)
- **KPIs**: Total payments, Success rate, Volume (24h), Active apps
- **Charts**: Payment volume over time, Success/Fail breakdown
- **Recent Activity**: Latest payments across all apps
- **Live Monitor**: Real-time payment status changes

#### B. Payments
- **Table**: All payments with filters
- Columns: Payment ID, App, Amount, Status, Time, Reference
- Filters: Status, App, Date range
- Search by payment ID or reference
- Export to CSV

#### C. API Keys
- **List of Apps**: Name, API Key, Environment, Status
- **Create New App**: Generate API key
- **Regenerate Key**: Security feature
- **View Webhook Logs**: Per app

#### D. Webhooks
- **Delivery Logs**: Success/Failed webhooks
- **Retry Queue**: Pending retries
- **Test Webhook**: Send test payload

#### E. Settings
- **Account**: User profile
- **Security**: Change password, 2FA
- **Notifications**: Email alerts
- **Billing** (future): Usage limits

---

## Technical Stack

### Backend
- **Framework**: Node.js + Express.js
- **Database**: PostgreSQL (Supabase)
- **Real-time**: Socket.IO (WebSocket)
- **Auth**: JWT tokens + API keys
- **Queues**: Bull/BullMQ (for webhook retries)
- **Validation**: Joi/Zod

### Frontend
- **Framework**: React + TypeScript
- **Routing**: React Router
- **State**: Context API / React Query
- **UI**: Tailwind CSS + Radix UI
- **Charts**: Recharts
- **Real-time**: Socket.IO Client

---

## API Implementation Checklist

### Phase 1: Core Payment API
- [ ] `/api/payments/create` endpoint
- [ ] `/api/payments/:id` get status
- [ ] `/api/payments/:id/complete` manual update
- [ ] API key authentication middleware
- [ ] Payment lifecycle state machine
- [ ] Payment expiry logic (background job)

### Phase 2: Webhook System
- [ ] Webhook delivery service
- [ ] Retry queue with Bull
- [ ] Webhook signature generation
- [ ] Webhook logging
- [ ] Webhook test endpoint

### Phase 3: Multi-App Support
- [ ] App registration flow
- [ ] API key generation
- [ ] App-scoped queries
- [ ] Usage analytics per app

### Phase 4: Dashboard UI
- [ ] API Keys management page
- [ ] Webhook logs viewer
- [ ] Payment filters and search
- [ ] Real-time updates via WebSocket
- [ ] Export functionality

---

## Security Considerations

1. **API Key Security**
   - Keys stored hashed in database
   - Prefix indicates environment (`sk_live_` / `sk_test_`)
   - Rate limiting per API key

2. **Webhook Security**
   - HMAC signature verification
   - HTTPS-only webhook URLs
   - Replay attack prevention (timestamp)

3. **Access Control**
   - Apps can only access their own payments
   - Admin users can see all
   - API key rotation support

---

## Example Integration (Client App)

```javascript
// Client app code
const ZenWallet = require('zenwallet-sdk');

const client = new ZenWallet({
  apiKey: 'sk_live_xxxxxxxxxxxxx',
  webhookSecret: 'whsec_xxxxxxxxxxxxx'
});

// Create payment
const payment = await client.payments.create({
  amount: 500,
  currency: 'COINS',
  reference_id: 'ORDER_123',
  description: 'Event Ticket'
});

console.log(payment.payment_url); // Send to user
console.log(payment.qr_code); // Display QR

// Verify webhook in your endpoint
app.post('/webhook', (req, res) => {
  const isValid = client.webhooks.verify(
    req.body,
    req.headers['x-zenwallet-signature']
  );
  
  if (isValid) {
    // Process payment.success event
    updateOrder(req.body.reference_id, 'PAID');
  }
  
  res.sendStatus(200);
});
```

---

## Migration from Current System

### Current State
- User wallet system
- Direct wallet-to-wallet transfers
- Single application mindset

### Migration Path
1. **Keep existing wallet system** for internal use
2. **Add payment request layer** on top
3. **Introduce app/tenant concept**
4. **Build external API** alongside existing endpoints
5. **Gradually deprecate direct wallet transfers** for external use

---

## Success Metrics

### Technical
- API response time < 100ms
- Webhook delivery success rate > 99%
- Payment creation throughput > 100/sec
- Zero data loss on payment state

### Business
- Number of connected apps
- Payment volume
- Webhook reliability
- Developer satisfaction (NPS)

---

## Next Steps

1. ✅ Desktop dashboard foundation (COMPLETE)
2. 🔧 Implement external payment API endpoints
3. 🔧 Add API key management to dashboard
4. 🔧 Build webhook delivery system
5. 🔧 Add multi-app/tenant support
6. 🔧 Create developer documentation
7. 🔧 Build SDK for popular languages

---

**This architecture transforms ZenWallet from a simple wallet app into a scalable, multi-tenant payment gateway platform suitable for powering multiple external applications.**
