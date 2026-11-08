# KnitFlow | Textile Production & Dispatch System
### Tailored for A.K. FABRIC (Silvassa)

KnitFlow is a modern, minimalist production and dispatch management platform built for circular knitting textile mills. It is specifically pre-configured for **A.K. FABRIC** and designed for ease of use by non-technical floor operators and managers.

---

## Key Features

### 1. Masters
- **Machine Master (`/masters/machines`)**:
  - Full management of all 4 circular knitting machines (Machine A, Machine B, Machine C, Machine D).
  - Configurable specifications: Model, Gauge/Diameter, Roll Prefix (`A.`, `B.`, `C.`, `D.`), Daily Target (KG), and Status (Active/Maintenance/Idle).
- **Customer Master (`/masters/customers`)**:
  - Complete client database with GSTIN, Billed-To address, Shipped-To address, State code, preferred transport, and default vehicle number.
  - Pre-seeded with clients such as **M/S Pooja Shree Silk & Synthetic (Bhiwandi)**.
- **Company Profile (`/masters/company`)**:
  - Centralized setup for A.K. Fabric (GSTIN: `26AGHPP8818L1ZQ`, Silvassa jurisdiction, Bank of Baroda account & IFSC details, default HSN/SAC `998821`, default job work rate `Rs. 42/KG`).
- **User Master & Access Control (`/masters/users`)**:
  - Full management of mill staff and administrator accounts.
  - Granular role-based permissions (Administrator, Production Supervisor, Finance & Dispatch, Machine Operator, or Custom).
  - Configurable access toggles across Production, Finance, and Master workspaces.
  - Instant account activation/deactivation and password resets.

### 2. Authentication & Access Control (`/login`)
- **Protected Access**: All platform routes are secured; unauthorized visitors are redirected to the login portal.
- **Role-Based Navigation**: Dropdown navigation and mobile bottom docks dynamically adapt, displaying only the modules the authenticated user is permitted to use.
- **Default Pre-Seeded Accounts**:
  - **Admin**: Username: `admin` | Password: `admin` (Full access to all modules)
  - **Supervisor**: Username: `supervisor` | Password: `supervisor` (Production Dashboard, Roll Entry, Rejections, Machine Master)
  - **Operator**: Username: `operator` | Password: `operator` (Floor Roll Entry only)

### 3. Summary Dashboard (`/`)
- **Today's Overall Production**: Total weight (KG) and roll count produced today across all machines.
- **Top Performing Machine**: Identifies which machine generated the highest fabric output today.
- **Machine Fleet Progress**: Real-time progress bars tracking each machine against its daily target.
- **Visual Analytics (Graphs)**:
  - Daily Production Trend (Area graph tracking output over time).
  - Machine Output Comparison (Bar chart comparing line performance).
- **Inventory & Rejection Metrics**: Live in-stock roll count ready for dispatch and floor defect rate.

### 4. Production Entry & Rejection Logging
- **Production Entry (`/production`)**:
  - **Single Roll Entry**: Tap Machine (A, B, C, D), auto-suggests next roll number (e.g. `C.1665`), enter net weight in KG, and save.
  - **Batch Weigh-In Mode**: Designed for floor supervisors weighing 10-30 rolls back-to-back with automatic sequential numbering.
- **Fabric Rejection Log (`/rejection`)**:
  - Record off-quality rolls or cut pieces with defect classifications (Oil Stain, Yarn Breakage, Hole/Needle Drop, GSM Variation, etc.) and disposition (Scrap, Recycled, B-Grade Sale).

### 5. Dispatch, Delivery Challan & Tax Invoice (`/dispatch`)
- **New Dispatch Generator (`/dispatch/new`)**:
  - Select customer from master.
  - Required Transport Inputs:
    - **Transport Mode**: `ROADWAYS`
    - **Vehicle No**: `DD.01.J.9713`
    - **Place of Supply**: `BHIWANDI`
    - **L.R. No**: Optional
    - **Transporter Name**: `SHIV TRANSPORT`
    - **No. of Bags**: e.g. `49`
  - Pick rolls directly from inventory (with one-click "Select Machine C", "Select Machine D", etc.).
  - Automatic machine-wise summary calculation matching the mill standard:
    `TOTAL WEIGHT ( C ) 461.10 KG + WEIGHT(D) 436.80 KG + WEIGHT (A) 341.25 KG + WEIGHT 544.05 (B) KG = 1783.20 KG`
- **Delivery Challan View & Print (`/dispatch/challan/[id]`)**:
  - Exact replica of the mill's Delivery Challan format.
  - 3-column balanced roll layout fitting 100+ rolls cleanly on an A4 sheet.
  - Copy selection indicator (Original for Recipient, Duplicate for Transporter, Triplicate for Supplier, Extra Copy).
  - Independent print/download PDF button.
- **Tax Invoice View & Print (`/dispatch/invoice/[id]`)**:
  - Exact replica of the Tax Invoice format.
  - Automatic IGST (5%) or CGST (2.5%) + UTGST (2.5%) based on state codes.
  - Round-off and Amount in Words converter.
  - Bank details pre-printed.
  - Independent print/download PDF button.

---

## Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS with Apple-inspired monochromatic design (No emojis)
- **Charts**: Recharts
- **Icons**: Lucide Icons
- **Database**: MongoDB with Mongoose (`lib/mongodb.ts`, `lib/models/index.ts`) + zero-config persistent local storage fallback (`data/knitflow-store.json`)

---

## Getting Started

### 1. Running the Application
The application is pre-built and running on:
```bash
npm run start
```
Or in development mode:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. MongoDB Configuration (Optional)
KnitFlow works out of the box using persistent local storage. If you want to connect to a MongoDB Atlas cluster or local MongoDB instance, open `.env.local` and set:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/knitflow?retryWrites=true&w=majority
```
Restart the server and KnitFlow will connect directly to MongoDB.
"# ak-fabric-" 
