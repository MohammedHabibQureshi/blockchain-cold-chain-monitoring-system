# 🔗 Blockchain-Based Cold Chain Monitoring System

A decentralized cold-chain monitoring and traceability platform designed
to provide **secure, transparent, and tamper-resistant shipment
tracking** for temperature-sensitive products from the **Manufacturer →
Transporter → Warehouse → Distributor → Hospital**.

The system combines **Blockchain, Solidity Smart Contracts, Ganache,
MetaMask, Web3, and a role-based web dashboard** to manage shipment
creation, custody transfer, acceptance, temperature violations,
cancellation, and final completion.

------------------------------------------------------------------------

## 📌 Project Overview

Cold-chain products such as medicines, vaccines, biological samples, and
other temperature-sensitive healthcare products must remain within a
defined temperature range throughout transportation and storage.

Traditional systems may depend on centralized records, making it
difficult to provide a trusted and complete history of:

-   Who currently owns a shipment
-   Who accepted a shipment
-   When custody changed
-   Whether a temperature violation occurred
-   Who cancelled a shipment
-   Why a shipment was cancelled
-   Whether a shipment reached the hospital
-   Whether the shipment was completed

This project addresses these issues by recording critical shipment and
custody events on a blockchain-based system.

------------------------------------------------------------------------

# 🎯 Objectives

-   Provide end-to-end shipment traceability.
-   Maintain a tamper-resistant shipment history.
-   Implement role-based access control.
-   Track custody from Manufacturer to Hospital.
-   Record temperature violations.
-   Record cancellation reasons and responsible users.
-   Prevent unauthorized custody transfers.
-   Prevent transfer of cancelled or completed shipments.
-   Provide transparent shipment monitoring for the Administrator.
-   Provide a final completion workflow at the Hospital.

------------------------------------------------------------------------

# 🏗️ System Workflow

``` text
                         ┌───────────────┐
                         │     ADMIN     │
                         │ User / System │
                         │   Monitoring  │
                         └───────┬───────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   MANUFACTURER  │
                        │ Create Shipment │
                        └────────┬────────┘
                                 │
                           Transfer Custody
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   TRANSPORTER   │
                        │ Accept Shipment │
                        └────────┬────────┘
                                 │
                           Transfer Custody
                                 │
                                 ▼
                        ┌─────────────────┐
                        │    WAREHOUSE    │
                        │ Accept Shipment │
                        └────────┬────────┘
                                 │
                           Transfer Custody
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   DISTRIBUTOR   │
                        │ Accept Shipment │
                        └────────┬────────┘
                                 │
                           Transfer Custody
                                 │
                                 ▼
                        ┌─────────────────┐
                        │     HOSPITAL    │
                        │ Accept Shipment │
                        │ Complete        │
                        └─────────────────┘
```

### Shipment Lifecycle

``` text
Created
   │
   ▼
Awaiting Acceptance
   │
   ▼
Accepted / In Custody
   │
   ├──────────────► Cancelled
   │
   ▼
Transferred to Next Role
   │
   ▼
Hospital
   │
   ▼
Completed
```

------------------------------------------------------------------------

# 🧩 System Architecture

``` text
┌─────────────────────────────────────────────────────────────┐
│                         USER LAYER                          │
│                                                             │
│ Admin | Manufacturer | Transporter | Warehouse |            │
│ Distributor | Hospital                                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ MetaMask / Web3
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND APPLICATION                    │
│                                                             │
│ Role-Based Dashboards                                       │
│ Shipment Management                                         │
│ Custody Transfer                                             │
│ Acceptance / Cancellation / Completion                       │
│ Violation History                                            │
│ Shipment Details                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Contract Calls / Transactions
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN NETWORK                       │
│                         Ganache                             │
│                                                             │
│                    Solidity Smart Contract                 │
│                                                             │
│  • User Roles                                               │
│  • Shipment Records                                         │
│  • Custody State                                             │
│  • Shipment Status                                           │
│  • Temperature Violations                                    │
│  • Cancellation Records                                      │
│  • Completion Records                                        │
│  • Events                                                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         DATA LAYER                          │
│                                                             │
│ Shipment State | Custody History | Violations | Events      │
└─────────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 🔄 End-to-End Custody Flow

``` text
Manufacturer
     │
     │ Create
     ▼
SHIP-XXX
     │
     │ Transfer
     ▼
Transporter
     │
     │ Accept
     ▼
Transporter Custody
     │
     │ Transfer
     ▼
Warehouse
     │
     │ Accept
     ▼
Warehouse Custody
     │
     │ Transfer
     ▼
Distributor
     │
     │ Accept
     ▼
Distributor Custody
     │
     │ Transfer
     ▼
Hospital
     │
     │ Accept
     ▼
Hospital Custody
     │
     │ Complete
     ▼
COMPLETED
```

------------------------------------------------------------------------

# 👥 User Roles

  -----------------------------------------------------------------------
  Role                                Main Responsibilities
  ----------------------------------- -----------------------------------
  👑 Admin                            Register users, monitor shipments,
                                      inspect shipment history and system
                                      activity

  🏭 Manufacturer                     Create shipments, monitor
                                      shipments, cancel or transfer
                                      shipments

  🚚 Transporter                      Accept incoming shipments, maintain
                                      custody, cancel or transfer
                                      shipments

  🏢 Warehouse                        Accept shipments, maintain storage
                                      custody, cancel or transfer
                                      shipments

  📦 Distributor                      Accept shipments, maintain custody,
                                      cancel or transfer shipments

  🏥 Hospital                         Accept final shipment, monitor it,
                                      and complete the shipment
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 🚨 Temperature Violation Monitoring

Temperature-sensitive shipments are monitored against their configured
temperature limits.

A violation record contains information such as:

``` text
🚨 Violation #1

Temperature:
11°C

Shipment:
SHIP-XXX

Reason:
Temperature outside allowed range

Timestamp:
18/8/2026, 7:15:48 pm

Data Hash:
0x0600ac0e47dc0c7166a24ca1fedb6a7a5f0cf70da0fcb7d8ac3adcc6c5d5260e
```

The violation history is available to the appropriate dashboards and can
be inspected as part of the shipment history.

------------------------------------------------------------------------

# 🔐 Blockchain and Security Model

The blockchain acts as the trusted source of truth for important
shipment operations.

Critical operations are performed through smart-contract transactions:

-   User registration
-   Shipment creation
-   Custody transfer
-   Shipment acceptance
-   Shipment cancellation
-   Shipment completion
-   Violation recording

The system also verifies role permissions before allowing protected
operations.

### Important state restrictions

A cancelled shipment must not be transferred.

A completed shipment must not be transferred.

A completed shipment must not be cancelled.

A user must not accept a shipment assigned to another role/account.

A shipment should not exist in the active custody of two participants
simultaneously.

------------------------------------------------------------------------

# 🖥️ Screenshots

> Place project screenshots inside `docs/screenshots/` using the
> filenames below, or change the paths to match your actual screenshots.

## Admin Dashboard

<img width="1920" height="1020" alt="Screenshot 2026-08-20 203929" src="https://github.com/user-attachments/assets/5250749c-97be-4b13-82e1-a8f7bc0ceb16" />


The Admin dashboard provides system-wide visibility into registered
participants and shipment activity.

------------------------------------------------------------------------

## Manufacturer Dashboard

<img width="1920" height="1020" alt="Screenshot 2026-08-20 203952" src="https://github.com/user-attachments/assets/75a21e60-c6be-453d-805f-201189568d8a" />


The Manufacturer dashboard provides shipment creation, shipment
monitoring, custody transfer, cancellation, and violation visibility.

------------------------------------------------------------------------

## Transporter Dashboard

<img width="1920" height="1020" alt="Screenshot 2026-08-20 204008" src="https://github.com/user-attachments/assets/749c5ab5-0bfd-4753-b17d-dd2cd437d375" />


The Transporter dashboard manages incoming shipments, acceptance, active
custody, transfer, cancellation, and violation history.

------------------------------------------------------------------------

## Warehouse Dashboard

<img width="1920" height="1020" alt="Screenshot 2026-08-20 204022" src="https://github.com/user-attachments/assets/d190e190-c171-49a5-8717-e3694c98c4a0" />


The Warehouse dashboard manages shipment acceptance, storage custody,
transfer, cancellation, and monitoring.

------------------------------------------------------------------------

## Distributor Dashboard

<img width="1920" height="1020" alt="Screenshot 2026-08-20 204035" src="https://github.com/user-attachments/assets/70a8e6c6-b484-42e5-92bd-e128877ed173" />


The Distributor dashboard manages incoming shipments, custody
acceptance, transfer to hospitals, cancellation, and shipment
monitoring.

------------------------------------------------------------------------

## Hospital Dashboard

<img width="1920" height="1020" alt="Screenshot 2026-08-20 204049" src="https://github.com/user-attachments/assets/e571a5c5-eb16-4c6c-98f6-c69c143ca338" />


The Hospital dashboard manages final shipment acceptance, custody
monitoring, completion, and violation history.

------------------------------------------------------------------------

## Shipment Details

<img width="1920" height="1020" alt="Screenshot 2026-08-20 204235" src="https://github.com/user-attachments/assets/6e811fc8-d969-493a-8a0f-369057a340f5" />


Shipment details provide the shipment status, current custodian,
temperature information, violation history, and custody timeline.

------------------------------------------------------------------------

## Custody Timeline

<img width="1920" height="1020" alt="Screenshot 2026-08-20 204308" src="https://github.com/user-attachments/assets/f2bf4667-a483-4eba-809a-a628df6db49e" />


The custody timeline represents the movement of a shipment through the
supply chain.

------------------------------------------------------------------------

## Violation History

<img width="1920" height="1020" alt="Screenshot 2026-08-20 204326" src="https://github.com/user-attachments/assets/49f21179-9ca1-4955-93ef-26737382cfd4" />


Temperature violations are displayed with temperature, shipment ID,
reason, timestamp, and data hash.

------------------------------------------------------------------------

# 🎥 Project Demonstration Video


### Watch the Project Demonstration

[▶️ Open Project Demonstration
Video]
https://github.com/user-attachments/assets/c0cbde3b-14ae-4eba-bb7b-9f631065e744



------------------------------------------------------------------------

# 📊 Project Presentation / PPT


### 📥 Project Presentation

[📊 Open / Download Project
PPT](https://github.com/user-attachments/files/31271288/Blockchain_Cold_Chain_Monitoring.pptx)


------------------------------------------------------------------------

# 🛠️ Technology Stack

## Blockchain

-   Solidity
-   Smart Contracts
-   Ethereum-compatible blockchain
-   Ganache

## Wallet / Web3

-   MetaMask
-   Web3 / Ethereum provider integration

## Frontend

-   React
-   TypeScript / JavaScript
-   HTML
-   CSS
-   Web3 integration

## Backend

-   Node.js
-   Express
-   TypeScript

## Development Tools

-   VS Code
-   Remix / Hardhat where applicable
-   Ganache
-   MetaMask
-   Git
-   GitHub

------------------------------------------------------------------------

# 📂 Project Structure

The exact structure may vary depending on the implementation, but the
project can be organized as:

``` text
blockchain-cold-chain-monitoring-system/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   └── package.json
│
├── contracts/
│   └── ColdChain.sol
│
├── scripts/
│   └── deployment/
│
├── test/
│
├── docs/
│   ├── screenshots/
│   │   ├── admin-dashboard.png
│   │   ├── manufacturer-dashboard.png
│   │   ├── transporter-dashboard.png
│   │   ├── warehouse-dashboard.png
│   │   ├── distributor-dashboard.png
│   │   ├── hospital-dashboard.png
│   │   ├── shipment-details.png
│   │   ├── custody-timeline.png
│   │   └── violation-history.png
│   │
│   ├── videos/
│   │   └── cold-chain-monitoring-demo.mp4
│   │
│   └── presentation/
│       └── Blockchain-Cold-Chain-Monitoring-System.pptx
│
├── .env.example
├── .gitignore
└── README.md
```

> Keep your existing project structure if it is already working. The
> `docs/` structure above is mainly for organizing documentation assets.

------------------------------------------------------------------------

# ⚙️ Installation and Setup

## 1. Clone the Repository

``` bash
git clone https://github.com/YOUR-USERNAME/blockchain-cold-chain-monitoring-system.git
cd blockchain-cold-chain-monitoring-system
```

------------------------------------------------------------------------

## 2. Install Dependencies

Install frontend dependencies:

``` bash
cd frontend
npm install
```

If a backend exists:

``` bash
cd ../backend
npm install
```

------------------------------------------------------------------------

## 3. Start Ganache

Start Ganache and create/use the configured development workspace.

Verify:

-   RPC URL
-   Chain ID
-   Accounts
-   Contract deployment

The frontend and deployment configuration must point to the same
blockchain network.

------------------------------------------------------------------------

## 4. Configure MetaMask

Connect MetaMask to the Ganache network.

Verify:

``` text
Network:
Ganache / configured local network

RPC:
Configured Ganache RPC

Chain ID:
Configured project Chain ID
```

Import the required Ganache accounts into MetaMask for testing.

------------------------------------------------------------------------

## 5. Deploy / Configure the Smart Contract

Deploy the existing Solidity smart contract using the project's
configured deployment method.

After deployment, update the frontend with the deployed contract address
and ABI if required.

Do not commit private keys or seed phrases.

------------------------------------------------------------------------

## 6. Start the Backend

If the backend is required:

``` bash
cd backend
npm run dev
```

------------------------------------------------------------------------

## 7. Start the Frontend

``` bash
cd frontend
npm run dev
```

Open the local application URL shown by the development server.

------------------------------------------------------------------------

# 🧪 End-to-End Test Workflow

A complete workflow can be tested using six shipments.

``` text
SHIP-001
Manufacturer → CANCELLED

SHIP-002
Manufacturer → Transporter → CANCELLED

SHIP-003
Manufacturer → Transporter → Warehouse → CANCELLED

SHIP-004
Manufacturer → Transporter → Warehouse → Distributor → CANCELLED

SHIP-005
Manufacturer → Transporter → Warehouse → Distributor → Hospital → COMPLETED

SHIP-006
Manufacturer → Transporter → Warehouse → Distributor → Hospital → ACTIVE
```

This test validates:

-   Role detection
-   Shipment creation
-   Incoming shipment handling
-   Acceptance
-   Custody transfer
-   Cancellation
-   Cancellation reason
-   Violation history
-   Custody timeline
-   Completion
-   Final Admin audit
-   State transition restrictions

------------------------------------------------------------------------

# 📈 Expected Final State

  Shipment   Final Status
  ---------- -------------------------------
  SHIP-001   ❌ Cancelled by Manufacturer
  SHIP-002   ❌ Cancelled by Transporter
  SHIP-003   ❌ Cancelled by Warehouse
  SHIP-004   ❌ Cancelled by Distributor
  SHIP-005   ✅ Completed by Hospital
  SHIP-006   🏥 Active in Hospital Custody

------------------------------------------------------------------------

# 🔒 Security Considerations

The system is designed around blockchain-backed authorization and
traceability.

Important security principles include:

-   Wallet-based identity
-   Smart-contract role validation
-   Role-specific permissions
-   Transaction confirmation
-   Immutable blockchain records
-   Custody verification
-   Shipment state validation
-   Prevention of unauthorized transfer
-   Prevention of invalid state transitions
-   Cancellation reason tracking

Private keys and MetaMask seed phrases must never be stored in the
repository.

------------------------------------------------------------------------

# 🔮 Future Scope

Potential extensions include:

-   ESP32-based temperature sensors
-   MQTT-based real-time telemetry
-   IoT gateway integration
-   IPFS document storage
-   Real-time notifications
-   QR-code shipment tracking
-   Mobile application
-   Cloud deployment
-   Advanced analytics
-   Predictive temperature violation detection
-   Multi-chain deployment
-   Production-grade identity management

------------------------------------------------------------------------

# 📚 Academic / Research Relevance

This project demonstrates the application of blockchain technology to
supply-chain traceability, particularly for temperature-sensitive
healthcare products.

The platform focuses on:

-   Decentralized traceability
-   Data integrity
-   Supply-chain transparency
-   Role-based access
-   Custody accountability
-   Temperature violation tracking
-   Smart-contract-based workflow enforcement

------------------------------------------------------------------------

# 👨‍💻 Project

**Blockchain-Based Cold Chain Monitoring System**

Repository:

`blockchain-cold-chain-monitoring-system`

------------------------------------------------------------------------

# 📄 License

Add the project's chosen license here.

For an academic project, select the appropriate license based on your
university/project requirements.
