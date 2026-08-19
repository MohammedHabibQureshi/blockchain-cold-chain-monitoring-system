# Cold Chain Monitoring Workflow Guide

## System Overview

Your blockchain-based cold chain monitoring system has **7 user roles** managed by the smart contract:
```
1. ADMIN (0) - System administrator
2. MANUFACTURER (2) - Creates shipments
3. TRANSPORTER (3) - Transports goods
4. WAREHOUSE (4) - Stores goods
5. DISTRIBUTOR (5) - Distributes goods
6. HOSPITAL (6) - Receives goods
7. NONE (0) - Unregistered user
```

---

## Key Steps After Account Role Change to MANUFACTURER

### **Step 1: Account Registration by Admin**
- Only **ADMIN** can register users with specific roles
- Once your account is registered as MANUFACTURER (role 2), you get access to the Manufacturer Dashboard

### **Step 2: Access Manufacturer Dashboard**
When you log in with your manufacturer account:
- You'll see the **Manufacturer Dashboard** (🏭)
- Dashboard shows:
  - Total shipments created
  - Shipments currently in your custody
  - Available transporters

---

## MANUFACTURER WORKFLOW - Creating & Transferring Shipments

### **Flow Diagram:**
```
MANUFACTURER creates shipment
       ↓
   Shipment parameters defined:
   - Shipment ID (e.g., SHIP-001)
   - Min Temperature (e.g., 2°C)
   - Max Temperature (e.g., 8°C)
       ↓
   Shipment active & manufacturer is custodian
       ↓
   MANUFACTURER transfers to TRANSPORTER
       ↓
   TRANSPORTER receives & takes custody
```

### **How Manufacturer Creates a Shipment:**

#### **From Frontend (Manufacturer Dashboard):**
1. Navigate to **"➕ Create New Shipment"** section
2. Enter:
   - **Shipment ID** - Unique identifier (e.g., "PHARMA-001")
   - **Min Temperature** - Minimum allowed temp (e.g., 2°C)
   - **Max Temperature** - Maximum allowed temp (e.g., 8°C)
3. Click **"📦 Create Shipment"** button
4. Confirm transaction in **MetaMask**
5. Wait for blockchain confirmation

#### **API Endpoint (if using backend directly):**
```
POST /api/shipment/create
Body:
{
  "shipmentId": "SHIP-001",
  "minTemperature": 2,
  "maxTemperature": 8
}
```

#### **What Happens:**
- Smart contract `createShipment()` is called
- Shipment is stored on blockchain with:
  - `manufacturer` = your wallet address
  - `currentCustodian` = your wallet address (initially)
  - `active` = true
  - `createdAt` = current timestamp
- Transaction is recorded immutably on blockchain
- Shipment appears in "📦 My Shipments" section

---

## How Manufacturer Transfers to Transporter

### **Step 1: View Available Transporters**
- Dashboard shows "🚚 Registered Transporters" count
- Only accounts with TRANSPORTER role (3) appear as valid recipients

### **Step 2: Transfer Shipment Custody**
#### **From Frontend:**
1. In **"📦 My Shipments"** section, find your shipment
2. Click **"🚚 Transfer to Transporter"** button
3. Select target transporter from dropdown (only TRANSPORTER role users show)
4. Confirm in MetaMask
5. Wait for blockchain confirmation

#### **What Happens:**
- Smart contract `transferCustody(shipmentId, transporterAddress)` is executed
- `currentCustodian` changes from manufacturer to transporter
- A `CustodyEvent` is recorded with:
  - From address (manufacturer)
  - To address (transporter)
  - Timestamp & block number
- Transporter now has custody & can manage shipment
- Manufacturer loses access to modify this shipment

---

## TRANSPORTER WORKFLOW - Receiving & Transferring

### **Flow Diagram:**
```
TRANSPORTER receives shipment
       ↓
   Shipment in transporter's custody
       ↓
   TRANSPORTER monitors temperature
   (via simulator or IoT devices)
       ↓
   Temperature readings recorded on blockchain
       ↓
   Violations detected if needed
       ↓
   TRANSPORTER transfers to WAREHOUSE
```

### **When Transporter Logs In:**
- Transporter sees **"🚚 Transporter Dashboard"**
- Dashboard shows:
  - **Assigned Shipments** - All shipments transferred to them
  - **Active In My Custody** - Currently active shipments
  - **Transfer Targets** - Available WAREHOUSE accounts

### **How Transporter Updates Shipments:**

#### **Option 1: Record Temperature Readings**
Temperature can be recorded by:
- **Simulator** - Automatic temperature simulation
- **IoT Devices** - Connected sensor data
- **Manual API Call**

```javascript
// Recording Temperature (called periodically)
POST /api/shipment/:shipmentId/temperature
Body:
{
  "temperature": 5.5,
  "humidity": 65
}
```

What happens:
- Temperature stored in blockchain history
- Violation detected if outside min/max range
- Violation event recorded immutably
- Timestamp & humidity captured

#### **Option 2: Transfer to Warehouse**
Same process as manufacturer:
1. View assigned shipments
2. Select shipment to transfer
3. Choose target WAREHOUSE account
4. Confirm in MetaMask
5. Warehouse now has custody

---

## WAREHOUSE WORKFLOW (Role 4)

### **Process:**
```
WAREHOUSE receives shipment
       ↓
   Transfer to DISTRIBUTOR
```

### **What Warehouse Does:**
1. Access **"🏢 Warehouse Dashboard"**
2. See all shipments transferred to them
3. Record temperature readings (same as transporter)
4. Transfer to DISTRIBUTOR when ready

### **Transfer Targets:**
- Only DISTRIBUTOR role (5) accounts appear

---

## DISTRIBUTOR WORKFLOW (Role 5)

### **Process:**
```
DISTRIBUTOR receives shipment
       ↓
   Transfer to HOSPITAL
```

### **What Distributor Does:**
1. Access **"📦 Distributor Dashboard"**
2. See assigned shipments
3. Record temperature readings
4. Transfer to HOSPITAL when ready

### **Transfer Targets:**
- Only HOSPITAL role (6) accounts appear

---

## HOSPITAL WORKFLOW (Role 6)

### **Final Destination:**
- Access **"🏥 Hospital Dashboard"**
- Receives shipments from distributors
- Can record final temperature readings
- Can verify shipment integrity & history

---

## Temperature Recording & Violation Tracking

### **Automatic Monitoring:**
Your backend includes a **simulator** that can automatically record temperatures:

```typescript
// backend/src/simulator.ts
// Simulates temperature readings at regular intervals
```

### **How Temperature Violations Work:**

```
Temperature reading received
       ↓
   Is temperature between min/max?
       ↓
   NO → Violation recorded on blockchain
   YES → Normal reading recorded
```

### **Viewing Violation History:**
```
API Endpoint: /api/shipment/:shipmentId/violations
Response:
[
  {
    shipmentId: "SHIP-001",
    temperature: 15.5,  // Outside range!
    timestamp: "1234567890",
    reason: "Temperature violation",
    dataHash: "0x1234..."
  }
]
```

---

## Complete Supply Chain Journey

### **Example Workflow:**

```
1. ADMIN registers accounts
   - Alice (MANUFACTURER)
   - Bob (TRANSPORTER)
   - Carol (WAREHOUSE)
   - David (DISTRIBUTOR)
   - Eva (HOSPITAL)

2. ALICE (Manufacturer) creates shipment
   - SHIP-PHARMA-001
   - Min: 2°C, Max: 8°C
   - Alice is custodian

3. ALICE transfers to BOB (Transporter)
   - Bob becomes custodian
   - Simulator records temperature readings
   - If violation: recorded immutably

4. BOB transfers to CAROL (Warehouse)
   - Carol becomes custodian
   - Carol monitors temperature

5. CAROL transfers to DAVID (Distributor)
   - David becomes custodian
   - Final leg preparation

6. DAVID transfers to EVA (Hospital)
   - Eva is final recipient
   - Full audit trail on blockchain
   - All temperature history available
   - Can verify no violations occurred
```

---

## Key Features & Capabilities

### **For Each Role:**

| Feature | Manufacturer | Transporter | Warehouse | Distributor | Hospital |
|---------|--------------|-------------|-----------|-------------|----------|
| Create Shipment | ✅ | ❌ | ❌ | ❌ | ❌ |
| Transfer Custody | ✅ | ✅ | ✅ | ✅ | ❌ |
| Record Temperature | ✅ | ✅ | ✅ | ✅ | ✅ |
| View All Shipments | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Custody History | ✅ | ✅ | ✅ | ✅ | ✅ |
| Verify Integrity | ✅ | ✅ | ✅ | ✅ | ✅ |

### **Blockchain Records (Immutable):**
- ✅ All shipment creations
- ✅ All custody transfers
- ✅ All temperature readings
- ✅ All violations (with timestamp & proof)
- ✅ Complete audit trail

---

## API Endpoints Summary

### **User Management:**
```
GET /api/users                  - Get all registered users
GET /api/user/:address          - Get specific user role
```

### **Shipment Operations:**
```
GET /api/shipments              - Get all shipments
GET /api/shipment/:shipmentId   - Get shipment details
GET /api/shipment/:shipmentId/readings    - Get temperature history
GET /api/shipment/:shipmentId/violations  - Get violation history
GET /api/shipment/:shipmentId/custody     - Get custody transfer history
```

---

## Important Notes

1. **Only ADMIN can register users** - Ensure admin wallet registers all participants with correct roles

2. **Custody transfers are permanent** - Once transferred, previous custodian loses control

3. **All records are immutable** - Temperature history cannot be altered, ensuring integrity

4. **Role-based access** - Frontend automatically shows correct dashboard based on connected wallet's role

5. **MetaMask required** - All transactions must be confirmed through MetaMask

6. **Temperature monitoring** - Enable simulator or connect IoT devices for continuous monitoring

---

## Troubleshooting

### **Manufacturer can't create shipment:**
- Verify you're registered with MANUFACTURER role (2)
- Ensure MetaMask is connected to correct network (Ganache: chainId 1337)

### **Can't transfer shipment:**
- Verify recipient is registered with correct next role
- Ensure you're the current custodian
- Check MetaMask account matches your role account

### **Temperature readings not appearing:**
- Verify simulator is running in backend
- Check backend logs for errors
- Ensure shipment ID matches exactly

### **Custody history missing:**
- Wait for blockchain confirmation
- Refresh page to reload from contract
- Check `/api/shipment/:shipmentId/custody` endpoint
