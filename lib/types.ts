export interface Machine {
  id: string;
  code: string; // "A", "B", "C", "D"
  name: string;
  model: string;
  rollPrefix: string; // "A.", "B.", "C.", "D."
  dailyTargetKg: number;
  status: "active" | "maintenance" | "idle";
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  gstin: string;
  billingAddress: string;
  shippingAddress: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  preferredTransport?: string;
  defaultVehicleNo?: string;
  placeOfSupply?: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface ProductionRoll {
  id: string;
  rollNo: string;
  machineCode: string; // "A" | "B" | "C" | "D"
  netWeight: number; // in KG
  fabricQuality: string;
  date: string; // YYYY-MM-DD
  shift: "Day" | "Night";
  operator?: string;
  status: "in_stock" | "dispatched" | "rejected";
  challanId?: string;
  challanNo?: string;
  notes?: string;
  createdAt: string;
}

export interface RejectionLog {
  id: string;
  machineCode: string;
  rollNo?: string;
  netWeight: number;
  reason: string;
  action: "Scrap" | "Recycled" | "B-Grade Sale";
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface CompanyProfile {
  name: string;
  address: string;
  jurisdiction: string;
  gstin: string;
  email: string;
  phone: string;
  bankName: string;
  bankBranch: string;
  bankAccountNo: string;
  bankIfsc: string;
  defaultHsn: string;
  defaultRate: number;
  defaultDescription: string;
}

export interface ChallanRollItem {
  rollNo: string;
  netWeight: number;
  machineCode: string;
}

export interface DeliveryChallan {
  id: string;
  challanNo: string;
  challanDate: string;
  customerId: string;
  customerName: string;
  customerGstin: string;
  shippingAddress: string;
  transportMode: string;
  vehicleNo: string;
  placeOfSupply: string;
  lrNo?: string;
  transporter?: string;
  noOfBags: number;
  rolls: ChallanRollItem[];
  totalRolls: number;
  totalWeight: number;
  machineBreakdown: Record<string, { rolls: number; weight: number }>;
  machineSummaryText: string;
  fabricQuality: string;
  createdAt: string;
}

export interface TaxInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  challanId?: string;
  challanNo?: string;
  customerId: string;
  customerName: string;
  customerGstin: string;
  billingAddress: string;
  shippingAddress: string;
  transportMode: string;
  vehicleNo: string;
  placeOfSupply: string;
  dateOfSupply: string;
  lrNo?: string;
  description: string;
  hsnSac: string;
  noOfRolls: number;
  quantityKg: number;
  ratePerKg: number;
  taxableAmount: number;
  isInterState: boolean;
  cgstRate: number;
  cgstAmount: number;
  utgstRate: number;
  utgstAmount: number;
  igstRate: number;
  igstAmount: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
  bankDetails: {
    bankName: string;
    branch: string;
    accountNo: string;
    ifsc: string;
  };
  createdAt: string;
}

