import mongoose, { Schema } from "mongoose";

const MachineSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    model: { type: String, required: true },
    rollPrefix: { type: String, required: true },
    dailyTargetKg: { type: Number, default: 450 },
    status: {
      type: String,
      enum: ["active", "maintenance", "idle"],
      default: "active",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true },
    gstin: { type: String, required: true },
    billingAddress: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    stateCode: { type: String, required: true },
    pincode: { type: String, required: true },
    preferredTransport: { type: String },
    defaultVehicleNo: { type: String },
    placeOfSupply: { type: String },
    phone: { type: String },
    email: { type: String },
  },
  { timestamps: true }
);

const RollSchema = new Schema(
  {
    rollNo: { type: String, required: true, unique: true },
    machineCode: { type: String, required: true },
    netWeight: { type: Number, required: true },
    fabricQuality: { type: String, default: "Nylon 44/10 knitted grey fabric" },
    date: { type: String, required: true },
    shift: { type: String, enum: ["Day", "Night"], default: "Day" },
    operator: { type: String },
    status: {
      type: String,
      enum: ["in_stock", "dispatched", "rejected"],
      default: "in_stock",
    },
    challanId: { type: String },
    challanNo: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

const RejectionSchema = new Schema(
  {
    machineCode: { type: String, required: true },
    rollNo: { type: String },
    netWeight: { type: Number, required: true },
    reason: { type: String, required: true },
    action: {
      type: String,
      enum: ["Scrap", "Recycled", "B-Grade Sale"],
      default: "Scrap",
    },
    date: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

const ChallanSchema = new Schema(
  {
    challanNo: { type: String, required: true, unique: true },
    challanDate: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerGstin: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    transportMode: { type: String, required: true },
    vehicleNo: { type: String, required: true },
    placeOfSupply: { type: String, required: true },
    lrNo: { type: String },
    transporter: { type: String },
    noOfBags: { type: Number, default: 1 },
    rolls: [
      {
        rollNo: String,
        netWeight: Number,
        machineCode: String,
      },
    ],
    totalRolls: { type: Number, required: true },
    totalWeight: { type: Number, required: true },
    machineBreakdown: { type: Schema.Types.Mixed },
    machineSummaryText: { type: String },
    fabricQuality: { type: String, default: "NYLON 44/10 KNITTED GREY FABRIC" },
  },
  { timestamps: true }
);

const InvoiceSchema = new Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    invoiceDate: { type: String, required: true },
    challanId: { type: String },
    challanNo: { type: String },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerGstin: { type: String, required: true },
    billingAddress: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    transportMode: { type: String, required: true },
    vehicleNo: { type: String, required: true },
    placeOfSupply: { type: String, required: true },
    dateOfSupply: { type: String, required: true },
    lrNo: { type: String },
    description: { type: String, required: true },
    hsnSac: { type: String, default: "998821" },
    noOfRolls: { type: Number, required: true },
    quantityKg: { type: Number, required: true },
    ratePerKg: { type: Number, required: true },
    taxableAmount: { type: Number, required: true },
    isInterState: { type: Boolean, default: true },
    cgstRate: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    utgstRate: { type: Number, default: 0 },
    utgstAmount: { type: Number, default: 0 },
    igstRate: { type: Number, default: 5 },
    igstAmount: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountInWords: { type: String, required: true },
    bankDetails: {
      bankName: String,
      branch: String,
      accountNo: String,
      ifsc: String,
    },
  },
  { timestamps: true }
);

const CompanySchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    jurisdiction: { type: String, default: "SILVASSA" },
    gstin: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    bankName: { type: String, required: true },
    bankBranch: { type: String, required: true },
    bankAccountNo: { type: String, required: true },
    bankIfsc: { type: String, required: true },
    defaultHsn: { type: String, default: "998821" },
    defaultRate: { type: Number, default: 42 },
    defaultDescription: {
      type: String,
      default: "Job work charge for Nylon 44/10 knitted grey fabric",
    },
  },
  { timestamps: true }
);

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "supervisor", "finance", "operator", "custom"],
      default: "operator",
    },
    permissions: {
      productionDashboard: { type: Boolean, default: false },
      productionRollEntry: { type: Boolean, default: true },
      productionRejection: { type: Boolean, default: false },
      financeView: { type: Boolean, default: false },
      financeCreate: { type: Boolean, default: false },
      masterMachines: { type: Boolean, default: false },
      masterCustomers: { type: Boolean, default: false },
      masterCompany: { type: Boolean, default: false },
      masterUsers: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
    phone: { type: String },
    lastLoginAt: { type: String },
  },
  { timestamps: true }
);

export const UserModel =
  mongoose.models.User || mongoose.model("User", UserSchema);
export const CompanyModel =
  mongoose.models.Company || mongoose.model("Company", CompanySchema);
export const MachineModel =
  mongoose.models.Machine || mongoose.model("Machine", MachineSchema);
export const CustomerModel =
  mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
export const RollModel =
  mongoose.models.Roll || mongoose.model("Roll", RollSchema);
export const RejectionModel =
  mongoose.models.Rejection || mongoose.model("Rejection", RejectionSchema);
export const ChallanModel =
  mongoose.models.Challan || mongoose.model("Challan", ChallanSchema);
export const InvoiceModel =
  mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);

