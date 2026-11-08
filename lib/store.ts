import fs from "fs";
import path from "path";
import {
  Machine,
  Customer,
  ProductionRoll,
  RejectionLog,
  CompanyProfile,
  DeliveryChallan,
  TaxInvoice,
  UserAccount,
  ROLE_PRESETS,
} from "./types";
import { connectMongo } from "./mongodb";
import {
  MachineModel,
  CustomerModel,
  RollModel,
  RejectionModel,
  ChallanModel,
  InvoiceModel,
  CompanyModel,
  UserModel,
} from "./models";

interface KnitFlowDatabase {
  company: CompanyProfile;
  machines: Machine[];
  customers: Customer[];
  rolls: ProductionRoll[];
  rejections: RejectionLog[];
  challans: DeliveryChallan[];
  invoices: TaxInvoice[];
  users: UserAccount[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "knitflow-store.json");

function getInitialSeedData(): KnitFlowDatabase {
  const company: CompanyProfile = {
    name: "A.K. FABRIC",
    address:
      "Balaji Industrial Estate, Gala No 110 , Survey No 113/2/7, Amli, Silvassa-396230, Dadra & Nagar Haveli",
    jurisdiction: "SILVASSA",
    gstin: "26AGHPP8818L1ZQ",
    email: "akfabric17@gmail.com",
    phone: "+91 98251 12345",
    bankName: "BANK OF BARODA",
    bankBranch: "SILVASSA",
    bankAccountNo: "26140500010164",
    bankIfsc: "BARB0SILVAS",
    defaultHsn: "998821",
    defaultRate: 42,
    defaultDescription:
      "Job work charge for Nylon 44/10 knitted grey fabric",
  };

  const machines: Machine[] = [
    {
      id: "mc-a",
      code: "A",
      name: "Knitting Machine A",
      model: "Single Jersey 24G 30\"",
      rollPrefix: "A.",
      dailyTargetKg: 450,
      status: "active",
      notes: "High speed nylon knitting line 1",
      createdAt: "2026-01-10T08:00:00Z",
    },
    {
      id: "mc-b",
      code: "B",
      name: "Knitting Machine B",
      model: "Interlock 28G 34\"",
      rollPrefix: "B.",
      dailyTargetKg: 550,
      status: "active",
      notes: "Heavy denier grey fabric line 2",
      createdAt: "2026-01-10T08:00:00Z",
    },
    {
      id: "mc-c",
      code: "C",
      name: "Knitting Machine C",
      model: "Circular Knitting 24G 32\"",
      rollPrefix: "C.",
      dailyTargetKg: 500,
      status: "active",
      notes: "Nylon 44/10 core production unit",
      createdAt: "2026-01-10T08:00:00Z",
    },
    {
      id: "mc-d",
      code: "D",
      name: "Knitting Machine D",
      model: "High Speed Jersey 28G 30\"",
      rollPrefix: "D.",
      dailyTargetKg: 450,
      status: "active",
      notes: "Fine gauge nylon fabric unit",
      createdAt: "2026-01-10T08:00:00Z",
    },
  ];

  const customers: Customer[] = [
    {
      id: "cust-1",
      name: "M/S Pooja Shree Silk & Synthetic",
      gstin: "27AUBPS4559D1ZH",
      billingAddress:
        "Jayaraj Warehouse Cum textile PARK, Bidg No E-1, Gala No 9/10 Opp pragati Stone, Kalwar village Bhiwandi-421303",
      shippingAddress:
        "Jayaraj Warehouse Cum textile PARK, Bidg No E-1, Gala No 9/10 Opp pragati Stone mills Kalwar village Bhiwandi-421303",
      city: "Bhiwandi",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "421303",
      preferredTransport: "SHIV TRANSPORT",
      defaultVehicleNo: "DD.01.J.9713",
      placeOfSupply: "BHIWANDI",
      phone: "+91 98200 44551",
      email: "poojashree.textiles@gmail.com",
      createdAt: "2026-02-01T10:00:00Z",
    },
    {
      id: "cust-2",
      name: "Reliance PolyFab Mills",
      gstin: "24AABCR8829C1ZX",
      billingAddress:
        "Plot No 44, GIDC Industrial Estate, Pandesara, Surat-394221",
      shippingAddress:
        "Plot No 44, GIDC Industrial Estate, Pandesara, Surat-394221",
      city: "Surat",
      state: "Gujarat",
      stateCode: "24",
      pincode: "394221",
      preferredTransport: "GUJARAT ROADWAYS",
      defaultVehicleNo: "GJ.05.BZ.4021",
      placeOfSupply: "SURAT",
      phone: "+91 99042 11223",
      email: "dispatch@polyfabmills.in",
      createdAt: "2026-02-15T11:30:00Z",
    },
    {
      id: "cust-3",
      name: "Silvassa Knits & Dyes Ltd",
      gstin: "26AACCS1190L1ZO",
      billingAddress: "Survey 72/1, Piparia Industrial Area, Silvassa-396230",
      shippingAddress: "Survey 72/1, Piparia Industrial Area, Silvassa-396230",
      city: "Silvassa",
      state: "Dadra & Nagar Haveli",
      stateCode: "26",
      pincode: "396230",
      preferredTransport: "LOCAL TEMPO",
      defaultVehicleNo: "DD.01.K.1234",
      placeOfSupply: "SILVASSA",
      phone: "+91 98250 99887",
      email: "orders@silvassaknits.com",
      createdAt: "2026-03-01T09:00:00Z",
    },
  ];

  const users: UserAccount[] = [
    {
      id: "usr-admin",
      username: "admin",
      email: "admin@akfabric.com",
      password: "admin", // Default password for initial setup
      fullName: "A.K. Administrator",
      role: "admin",
      permissions: ROLE_PRESETS.admin,
      isActive: true,
      phone: "+91 98251 12345",
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "usr-supervisor",
      username: "supervisor",
      email: "supervisor@akfabric.com",
      password: "supervisor",
      fullName: "Production Supervisor",
      role: "supervisor",
      permissions: ROLE_PRESETS.supervisor,
      isActive: true,
      phone: "+91 98251 55667",
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "usr-operator",
      username: "operator",
      email: "operator@akfabric.com",
      password: "operator",
      fullName: "Mill Operator",
      role: "operator",
      permissions: ROLE_PRESETS.operator,
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];

  return {
    company,
    machines,
    customers,
    rolls: [],
    rejections: [],
    challans: [],
    invoices: [],
    users,
  };
}

// Local File Store Helpers
function ensureStoreExists(): KnitFlowDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // In serverless read-only filesystem, return in-memory seed
      return getInitialSeedData();
    }
  }

  if (!fs.existsSync(STORE_FILE)) {
    const seed = getInitialSeedData();
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(seed, null, 2), "utf-8");
    } catch {
      // Fallback in read-only environment
    }
    return seed;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as KnitFlowDatabase;
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = getInitialSeedData().users;
      try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(parsed, null, 2), "utf-8");
      } catch {
        // Ignore
      }
    }
    return parsed;
  } catch {
    const seed = getInitialSeedData();
    return seed;
  }
}

function writeStore(data: KnitFlowDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Local file write skipped or failed (likely read-only serverless environment):", err);
  }
}

let mongoSeeded = false;
async function ensureMongoSeeded() {
  if (mongoSeeded) return;
  try {
    const count = await MachineModel.countDocuments();
    if (count === 0) {
      const seed = getInitialSeedData();
      await CompanyModel.create(seed.company);
      await MachineModel.insertMany(seed.machines);
      await CustomerModel.insertMany(seed.customers);
      await UserModel.insertMany(seed.users);
    } else {
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        const seed = getInitialSeedData();
        await UserModel.insertMany(seed.users);
      }
    }
    mongoSeeded = true;
  } catch (err) {
    console.warn("Failed to check/seed MongoDB initial data:", err);
  }
}

function mapDoc<T>(doc: any): T {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj._id && !obj.id) {
    obj.id = obj._id.toString();
  }
  return obj as T;
}

// Unified Database Store
export const store = {
  // Company Profile
  async getCompany(): Promise<CompanyProfile> {
    const isMongo = await connectMongo();
    if (isMongo) {
      await ensureMongoSeeded();
      const comp = await CompanyModel.findOne().lean();
      if (comp) return mapDoc<CompanyProfile>(comp);
    }
    const db = ensureStoreExists();
    return db.company;
  },

  async updateCompany(company: Partial<CompanyProfile>): Promise<CompanyProfile> {
    const isMongo = await connectMongo();
    if (isMongo) {
      await ensureMongoSeeded();
      const existing = await CompanyModel.findOne();
      if (existing) {
        Object.assign(existing, company);
        await existing.save();
        return mapDoc<CompanyProfile>(existing);
      } else {
        const created = await CompanyModel.create(company);
        return mapDoc<CompanyProfile>(created);
      }
    }
    const db = ensureStoreExists();
    db.company = { ...db.company, ...company };
    writeStore(db);
    return db.company;
  },

  // Machines
  async getMachines(): Promise<Machine[]> {
    const isMongo = await connectMongo();
    if (isMongo) {
      await ensureMongoSeeded();
      const docs = await MachineModel.find().lean();
      return docs.map((d: any) => mapDoc<Machine>(d));
    }
    const db = ensureStoreExists();
    return db.machines;
  },

  async addMachine(machine: Omit<Machine, "id" | "createdAt">): Promise<Machine> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const created = await MachineModel.create({
        ...machine,
        createdAt: new Date().toISOString(),
      });
      return mapDoc<Machine>(created);
    }
    const db = ensureStoreExists();
    const newMachine: Machine = {
      ...machine,
      id: `mc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.machines.push(newMachine);
    writeStore(db);
    return newMachine;
  },

  async updateMachine(id: string, updates: Partial<Machine>): Promise<Machine | null> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const doc = await MachineModel.findOneAndUpdate(
        { $or: [{ _id: id }, { code: id }] },
        updates,
        { new: true }
      ).lean();
      return doc ? mapDoc<Machine>(doc) : null;
    }
    const db = ensureStoreExists();
    const idx = db.machines.findIndex((m) => m.id === id || m.code === id);
    if (idx === -1) return null;
    db.machines[idx] = { ...db.machines[idx], ...updates };
    writeStore(db);
    return db.machines[idx];
  },

  async deleteMachine(id: string): Promise<boolean> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const res = await MachineModel.deleteOne({ $or: [{ _id: id }, { code: id }] });
      return res.deletedCount > 0;
    }
    const db = ensureStoreExists();
    const len = db.machines.length;
    db.machines = db.machines.filter((m) => m.id !== id && m.code !== id);
    if (db.machines.length !== len) {
      writeStore(db);
      return true;
    }
    return false;
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const isMongo = await connectMongo();
    if (isMongo) {
      await ensureMongoSeeded();
      const docs = await CustomerModel.find().lean();
      return docs.map((d: any) => mapDoc<Customer>(d));
    }
    const db = ensureStoreExists();
    return db.customers;
  },

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const doc = await CustomerModel.findOne({
        $or: [{ _id: id }, { id: id }],
      }).lean();
      return doc ? mapDoc<Customer>(doc) : undefined;
    }
    const db = ensureStoreExists();
    return db.customers.find((c) => c.id === id);
  },

  async addCustomer(customer: Omit<Customer, "id" | "createdAt">): Promise<Customer> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const created = await CustomerModel.create({
        ...customer,
        createdAt: new Date().toISOString(),
      });
      return mapDoc<Customer>(created);
    }
    const db = ensureStoreExists();
    const newCustomer: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.customers.push(newCustomer);
    writeStore(db);
    return newCustomer;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const doc = await CustomerModel.findOneAndUpdate(
        { $or: [{ _id: id }, { id: id }] },
        updates,
        { new: true }
      ).lean();
      return doc ? mapDoc<Customer>(doc) : null;
    }
    const db = ensureStoreExists();
    const idx = db.customers.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    db.customers[idx] = { ...db.customers[idx], ...updates };
    writeStore(db);
    return db.customers[idx];
  },

  async deleteCustomer(id: string): Promise<boolean> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const res = await CustomerModel.deleteOne({ $or: [{ _id: id }, { id: id }] });
      return res.deletedCount > 0;
    }
    const db = ensureStoreExists();
    const len = db.customers.length;
    db.customers = db.customers.filter((c) => c.id !== id);
    if (db.customers.length !== len) {
      writeStore(db);
      return true;
    }
    return false;
  },

  // Production Rolls
  async getRolls(): Promise<ProductionRoll[]> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const docs = await RollModel.find().lean();
      return docs.map((d: any) => mapDoc<ProductionRoll>(d));
    }
    const db = ensureStoreExists();
    return db.rolls;
  },

  async addRoll(roll: Omit<ProductionRoll, "id" | "createdAt">): Promise<ProductionRoll> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const created = await RollModel.create({
        ...roll,
        createdAt: new Date().toISOString(),
      });
      return mapDoc<ProductionRoll>(created);
    }
    const db = ensureStoreExists();
    const newRoll: ProductionRoll = {
      ...roll,
      id: `roll-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    db.rolls.push(newRoll);
    writeStore(db);
    return newRoll;
  },

  async addBatchRolls(
    rolls: Omit<ProductionRoll, "id" | "createdAt">[]
  ): Promise<ProductionRoll[]> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const toInsert = rolls.map((r) => ({
        ...r,
        createdAt: new Date().toISOString(),
      }));
      const created = await RollModel.insertMany(toInsert);
      return created.map((d: any) => mapDoc<ProductionRoll>(d));
    }
    const db = ensureStoreExists();
    const newRolls: ProductionRoll[] = rolls.map((r, i) => ({
      ...r,
      id: `roll-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    }));
    db.rolls.push(...newRolls);
    writeStore(db);
    return newRolls;
  },

  async updateRoll(id: string, updates: Partial<ProductionRoll>): Promise<ProductionRoll | null> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const doc = await RollModel.findOneAndUpdate(
        { $or: [{ _id: id }, { rollNo: id }, { id: id }] },
        updates,
        { new: true }
      ).lean();
      return doc ? mapDoc<ProductionRoll>(doc) : null;
    }
    const db = ensureStoreExists();
    const idx = db.rolls.findIndex((r) => r.id === id || r.rollNo === id);
    if (idx === -1) return null;
    db.rolls[idx] = { ...db.rolls[idx], ...updates };
    writeStore(db);
    return db.rolls[idx];
  },

  async deleteRoll(id: string): Promise<boolean> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const res = await RollModel.deleteOne({
        $or: [{ _id: id }, { rollNo: id }, { id: id }],
      });
      return res.deletedCount > 0;
    }
    const db = ensureStoreExists();
    const len = db.rolls.length;
    db.rolls = db.rolls.filter((r) => r.id !== id && r.rollNo !== id);
    if (db.rolls.length !== len) {
      writeStore(db);
      return true;
    }
    return false;
  },

  // Defect / Rejection Logs
  async getRejections(): Promise<RejectionLog[]> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const docs = await RejectionModel.find().lean();
      return docs.map((d: any) => mapDoc<RejectionLog>(d));
    }
    const db = ensureStoreExists();
    return db.rejections;
  },

  async addRejection(rej: Omit<RejectionLog, "id" | "createdAt">): Promise<RejectionLog> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const created = await RejectionModel.create({
        ...rej,
        createdAt: new Date().toISOString(),
      });
      return mapDoc<RejectionLog>(created);
    }
    const db = ensureStoreExists();
    const newRej: RejectionLog = {
      ...rej,
      id: `rej-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.rejections.push(newRej);
    writeStore(db);
    return newRej;
  },

  async deleteRejection(id: string): Promise<boolean> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const res = await RejectionModel.deleteOne({ $or: [{ _id: id }, { id: id }] });
      return res.deletedCount > 0;
    }
    const db = ensureStoreExists();
    const len = db.rejections.length;
    db.rejections = db.rejections.filter((r) => r.id !== id);
    if (db.rejections.length !== len) {
      writeStore(db);
      return true;
    }
    return false;
  },

  // Delivery Challans
  async getChallans(): Promise<DeliveryChallan[]> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const docs = await ChallanModel.find().lean();
      return docs.map((d: any) => mapDoc<DeliveryChallan>(d));
    }
    const db = ensureStoreExists();
    return db.challans;
  },

  async getChallanById(id: string): Promise<DeliveryChallan | undefined> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const doc = await ChallanModel.findOne({
        $or: [{ _id: id }, { challanNo: id }, { id: id }],
      }).lean();
      return doc ? mapDoc<DeliveryChallan>(doc) : undefined;
    }
    const db = ensureStoreExists();
    return db.challans.find((c) => c.id === id || c.challanNo === id);
  },

  async createChallan(
    challan: Omit<DeliveryChallan, "id" | "createdAt">
  ): Promise<DeliveryChallan> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const created = await ChallanModel.create({
        ...challan,
        createdAt: new Date().toISOString(),
      });
      const challanId = created._id.toString();

      // Mark rolls as dispatched in MongoDB
      const rollNumbers = challan.rolls.map((r) => r.rollNo);
      await RollModel.updateMany(
        { rollNo: { $in: rollNumbers } },
        {
          $set: {
            status: "dispatched",
            challanId: challanId,
            challanNo: challan.challanNo,
          },
        }
      );

      return mapDoc<DeliveryChallan>(created);
    }

    const db = ensureStoreExists();
    const newChallan: DeliveryChallan = {
      ...challan,
      id: `ch-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.challans.push(newChallan);

    // Mark corresponding rolls as dispatched
    const rollNoSet = new Set(challan.rolls.map((r) => r.rollNo));
    db.rolls.forEach((r) => {
      if (rollNoSet.has(r.rollNo)) {
        r.status = "dispatched";
        r.challanId = newChallan.id;
        r.challanNo = newChallan.challanNo;
      }
    });

    writeStore(db);
    return newChallan;
  },

  // Tax Invoices
  async getInvoices(): Promise<TaxInvoice[]> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const docs = await InvoiceModel.find().lean();
      return docs.map((d: any) => mapDoc<TaxInvoice>(d));
    }
    const db = ensureStoreExists();
    return db.invoices;
  },

  async getInvoiceById(id: string): Promise<TaxInvoice | undefined> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const doc = await InvoiceModel.findOne({
        $or: [{ _id: id }, { invoiceNo: id }, { id: id }],
      }).lean();
      return doc ? mapDoc<TaxInvoice>(doc) : undefined;
    }
    const db = ensureStoreExists();
    return db.invoices.find((i) => i.id === id || i.invoiceNo === id);
  },

  async createInvoice(invoice: Omit<TaxInvoice, "id" | "createdAt">): Promise<TaxInvoice> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const created = await InvoiceModel.create({
        ...invoice,
        createdAt: new Date().toISOString(),
      });
      return mapDoc<TaxInvoice>(created);
    }

    const db = ensureStoreExists();
    const newInvoice: TaxInvoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.invoices.push(newInvoice);
    writeStore(db);
    return newInvoice;
  },

  // Users & Permissions
  async getUsers(): Promise<UserAccount[]> {
    const isMongo = await connectMongo();
    if (isMongo) {
      await ensureMongoSeeded();
      const docs = await UserModel.find().lean();
      return docs.map((d: any) => mapDoc<UserAccount>(d));
    }
    const db = ensureStoreExists();
    return db.users || [];
  },

  async getUserById(id: string): Promise<UserAccount | undefined> {
    const isMongo = await connectMongo();
    if (isMongo) {
      await ensureMongoSeeded();
      const doc = await UserModel.findOne({
        $or: [{ _id: id }, { id: id }],
      }).lean();
      return doc ? mapDoc<UserAccount>(doc) : undefined;
    }
    const db = ensureStoreExists();
    return (db.users || []).find((u) => u.id === id);
  },

  async getUserByUsername(usernameOrEmail: string): Promise<UserAccount | undefined> {
    const clean = usernameOrEmail.trim().toLowerCase();
    const isMongo = await connectMongo();
    if (isMongo) {
      await ensureMongoSeeded();
      const doc = await UserModel.findOne({
        $or: [{ username: clean }, { email: clean }],
      }).lean();
      return doc ? mapDoc<UserAccount>(doc) : undefined;
    }
    const db = ensureStoreExists();
    return (db.users || []).find(
      (u) =>
        u.username.toLowerCase() === clean ||
        (u.email && u.email.toLowerCase() === clean)
    );
  },

  async addUser(
    user: Omit<UserAccount, "id" | "createdAt">
  ): Promise<UserAccount> {
    const isMongo = await connectMongo();
    const cleanUser = {
      ...user,
      username: user.username.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    };

    if (isMongo) {
      const created = await UserModel.create(cleanUser);
      return mapDoc<UserAccount>(created);
    }

    const db = ensureStoreExists();
    if (!db.users) db.users = [];
    const newUser: UserAccount = {
      ...cleanUser,
      id: `usr-${Date.now()}`,
    };
    db.users.push(newUser);
    writeStore(db);
    return newUser;
  },

  async updateUser(
    id: string,
    updates: Partial<UserAccount>
  ): Promise<UserAccount | null> {
    const isMongo = await connectMongo();
    const cleanUpdates = { ...updates };
    if (cleanUpdates.username) {
      cleanUpdates.username = cleanUpdates.username.trim().toLowerCase();
    }

    if (isMongo) {
      const doc = await UserModel.findOneAndUpdate(
        { $or: [{ _id: id }, { id: id }] },
        cleanUpdates,
        { new: true }
      ).lean();
      return doc ? mapDoc<UserAccount>(doc) : null;
    }

    const db = ensureStoreExists();
    if (!db.users) db.users = [];
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...cleanUpdates };
    writeStore(db);
    return db.users[idx];
  },

  async deleteUser(id: string): Promise<boolean> {
    const isMongo = await connectMongo();
    if (isMongo) {
      const res = await UserModel.deleteOne({ $or: [{ _id: id }, { id: id }] });
      return res.deletedCount > 0;
    }

    const db = ensureStoreExists();
    if (!db.users) return false;
    const len = db.users.length;
    db.users = db.users.filter((u) => u.id !== id);
    if (db.users.length !== len) {
      writeStore(db);
      return true;
    }
    return false;
  },

  async updateLastLogin(id: string): Promise<void> {
    const now = new Date().toISOString();
    const isMongo = await connectMongo();
    if (isMongo) {
      await UserModel.updateOne(
        { $or: [{ _id: id }, { id: id }] },
        { $set: { lastLoginAt: now } }
      );
      return;
    }
    const db = ensureStoreExists();
    if (!db.users) return;
    const u = db.users.find((user) => user.id === id);
    if (u) {
      u.lastLoginAt = now;
      writeStore(db);
    }
  },
};
