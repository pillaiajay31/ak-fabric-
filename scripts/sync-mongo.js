const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

async function main() {
  console.log("--------------------------------------------------");
  console.log("KnitFlow MongoDB Atlas Migration & Seeding Tool");
  console.log("--------------------------------------------------");

  // 1. Read .env.local
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Error: .env.local not found!");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const lines = envContent.split(/\r?\n/);
  const uriLine = lines.find((l) => l.trim().startsWith("MONGODB_URI="));
  if (!uriLine) {
    console.error("Error: MONGODB_URI not found in .env.local!");
    process.exit(1);
  }

  const uri = uriLine.split("=").slice(1).join("=").trim();
  console.log("Connecting to MongoDB Atlas...");

  await mongoose.connect(uri, {
    dbName: "knitflow",
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`Connected to database: "${mongoose.connection.name}"`);

  // 2. Read local store data
  const storePath = path.join(__dirname, "..", "data", "knitflow-store.json");
  let localData = {
    users: [],
    machines: [],
    customers: [],
    company: null,
    rolls: [],
    rejections: [],
    challans: [],
    invoices: [],
  };

  if (fs.existsSync(storePath)) {
    try {
      localData = JSON.parse(fs.readFileSync(storePath, "utf-8"));
      console.log("Read local store data successfully.");
    } catch (err) {
      console.warn("Could not parse knitflow-store.json, using defaults:", err.message);
    }
  }

  const db = mongoose.connection.db;

  // 3. User Accounts
  console.log("\n[1/5] Syncing User Accounts...");
  const userCollection = db.collection("users");

  const defaultUsers = [
    {
      id: "usr-admin",
      username: "admin",
      email: "admin@akfabric.com",
      password: "admin",
      fullName: "A.K. Administrator",
      role: "admin",
      permissions: {
        productionDashboard: true,
        productionRollEntry: true,
        productionRejection: true,
        financeView: true,
        financeCreate: true,
        masterMachines: true,
        masterCustomers: true,
        masterCompany: true,
        masterUsers: true,
      },
      isActive: true,
      phone: "+91 98251 12345",
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr-supervisor",
      username: "supervisor",
      email: "supervisor@akfabric.com",
      password: "supervisor",
      fullName: "Production Supervisor",
      role: "supervisor",
      permissions: {
        productionDashboard: true,
        productionRollEntry: true,
        productionRejection: true,
        financeView: false,
        financeCreate: false,
        masterMachines: true,
        masterCustomers: false,
        masterCompany: false,
        masterUsers: false,
      },
      isActive: true,
      phone: "+91 98251 55667",
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr-operator",
      username: "operator",
      email: "operator@akfabric.com",
      password: "operator",
      fullName: "Mill Operator",
      role: "operator",
      permissions: {
        productionDashboard: false,
        productionRollEntry: true,
        productionRejection: false,
        financeView: false,
        financeCreate: false,
        masterMachines: false,
        masterCustomers: false,
        masterCompany: false,
        masterUsers: false,
      },
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // Merge local users with default users
  const allUsersMap = new Map();
  defaultUsers.forEach((u) => allUsersMap.set(u.username.toLowerCase(), u));
  if (Array.isArray(localData.users)) {
    localData.users.forEach((u) => {
      if (u.username) {
        allUsersMap.set(u.username.toLowerCase(), {
          ...allUsersMap.get(u.username.toLowerCase()),
          ...u,
        });
      }
    });
  }

  for (const [username, userDoc] of allUsersMap.entries()) {
    const filter = { username: username.toLowerCase() };
    const { _id, ...docWithoutMongoId } = userDoc;
    await userCollection.updateOne(filter, { $set: docWithoutMongoId }, { upsert: true });
    console.log(`  - Synced user: @${username} (${userDoc.role}) - ${userDoc.fullName}`);
  }

  // 4. Company Profile
  console.log("\n[2/5] Syncing Company Profile...");
  const companyCollection = db.collection("companies");
  const companyData = localData.company || {
    name: "A.K. FABRIC",
    address: "Survey No. 124/2, Near Piparia Industrial Estate, Silvassa - 396230, D.N.H. (U.T.)",
    jurisdiction: "SILVASSA",
    gstin: "26AABFA1234F1Z5",
    email: "accounts@akfabric.com",
    phone: "+91 98251 12345",
    bankName: "Bank of Baroda",
    bankBranch: "Silvassa Main Branch",
    bankAccountNo: "03820200001234",
    bankIfsc: "BARB0SILVAS",
    defaultHsn: "998821",
    defaultRate: 42,
    defaultDescription: "Job work charge for Nylon 44/10 knitted grey fabric",
  };
  const { _id: cId, ...compWithoutId } = companyData;
  await companyCollection.updateOne({}, { $set: compWithoutId }, { upsert: true });
  console.log(`  - Synced Company: ${compWithoutId.name}`);

  // 5. Machines
  console.log("\n[3/5] Syncing Machines...");
  const machineCollection = db.collection("machines");
  const machines = localData.machines && localData.machines.length > 0 ? localData.machines : [
    { code: "M1", name: "Unit 1 - Mayer & Cie Relanit 3.2", model: "Mayer & Cie Relanit 3.2 II", rollPrefix: "M1", dailyTargetKg: 500, status: "active" },
    { code: "M2", name: "Unit 2 - Terrot S296-1", model: "Terrot S296-1 High-Speed", rollPrefix: "M2", dailyTargetKg: 450, status: "active" },
    { code: "M3", name: "Unit 3 - Santoni SM8-TOP2", model: "Santoni SM8-TOP2 Seamless", rollPrefix: "M3", dailyTargetKg: 400, status: "active" },
    { code: "M4", name: "Unit 4 - Orizio PLE", model: "Orizio PLE Circular Knitter", rollPrefix: "M4", dailyTargetKg: 450, status: "active" },
  ];
  for (const m of machines) {
    const { _id, ...docWithoutId } = m;
    await machineCollection.updateOne({ code: m.code }, { $set: docWithoutId }, { upsert: true });
    console.log(`  - Synced machine: ${m.code} (${m.name})`);
  }

  // 6. Customers
  console.log("\n[4/5] Syncing Customers...");
  const customerCollection = db.collection("customers");
  const customers = localData.customers && localData.customers.length > 0 ? localData.customers : [
    {
      name: "SHREE RAM TEXTILES",
      gstin: "27AAACS1234F1Z8",
      billingAddress: "Gala No. 14, Arihant Commercial Complex, Purna Village, Bhiwandi, Thane, Maharashtra - 421302",
      shippingAddress: "Plot 88, Mittal Industrial Estate, Dapode Road, Bhiwandi, Thane, Maharashtra - 421302",
      city: "BHIWANDI",
      state: "MAHARASHTRA",
      stateCode: "27",
      pincode: "421302",
      preferredTransport: "ROADWAYS",
      defaultVehicleNo: "DD.01.J.9713",
      placeOfSupply: "BHIWANDI",
      phone: "+91 98200 11223",
      email: "purchase@shreeramtextiles.com",
    },
    {
      name: "BALAJI FABRICS BHIWANDI",
      gstin: "27AABCB9876C1Z2",
      billingAddress: "Shed No. 4, Jai Mata Di Compound, Mankoli Naka, Bhiwandi - 421302",
      shippingAddress: "Shed No. 4, Jai Mata Di Compound, Mankoli Naka, Bhiwandi - 421302",
      city: "BHIWANDI",
      state: "MAHARASHTRA",
      stateCode: "27",
      pincode: "421302",
      preferredTransport: "ROADWAYS",
      defaultVehicleNo: "MH.04.AZ.1234",
      placeOfSupply: "BHIWANDI",
      phone: "+91 98920 44556",
    },
    {
      name: "SURAT SYNTHETIC WEAVERS",
      gstin: "24AAECS4321A1Z9",
      billingAddress: "Block B, Kohinoor Textile Market, Ring Road, Surat - 395002",
      shippingAddress: "GIDC Industrial Estate, Sachin, Surat - 394230",
      city: "SURAT",
      state: "GUJARAT",
      stateCode: "24",
      pincode: "394230",
      preferredTransport: "ROADWAYS",
      defaultVehicleNo: "GJ.05.BX.7788",
      placeOfSupply: "SURAT",
      phone: "+91 98241 77889",
    },
  ];
  for (const c of customers) {
    const { _id, ...docWithoutId } = c;
    await customerCollection.updateOne({ gstin: c.gstin }, { $set: docWithoutId }, { upsert: true });
    console.log(`  - Synced customer: ${c.name} (${c.gstin})`);
  }

  // 7. Rolls, Challans, Invoices
  console.log("\n[5/5] Checking Rolls, Challans & Invoices...");
  const rollCollection = db.collection("rolls");
  const challanCollection = db.collection("challans");
  const invoiceCollection = db.collection("invoices");

  if (Array.isArray(localData.rolls) && localData.rolls.length > 0) {
    for (const roll of localData.rolls) {
      const { _id, ...docWithoutId } = roll;
      await rollCollection.updateOne({ rollNo: roll.rollNo }, { $set: docWithoutId }, { upsert: true });
    }
    console.log(`  - Synced ${localData.rolls.length} production rolls.`);
  }

  if (Array.isArray(localData.challans) && localData.challans.length > 0) {
    for (const ch of localData.challans) {
      const { _id, ...docWithoutId } = ch;
      await challanCollection.updateOne({ challanNo: ch.challanNo }, { $set: docWithoutId }, { upsert: true });
    }
    console.log(`  - Synced ${localData.challans.length} delivery challans.`);
  }

  if (Array.isArray(localData.invoices) && localData.invoices.length > 0) {
    for (const inv of localData.invoices) {
      const { _id, ...docWithoutId } = inv;
      await invoiceCollection.updateOne({ invoiceNo: inv.invoiceNo }, { $set: docWithoutId }, { upsert: true });
    }
    console.log(`  - Synced ${localData.invoices.length} tax invoices.`);
  }

  // Verification
  console.log("\n--------------------------------------------------");
  console.log("MongoDB Verification Summary:");
  const userCount = await userCollection.countDocuments();
  const machineCount = await machineCollection.countDocuments();
  const customerCount = await customerCollection.countDocuments();
  const rollCount = await rollCollection.countDocuments();
  const challanCount = await challanCollection.countDocuments();
  const invoiceCount = await invoiceCollection.countDocuments();

  console.log(`- Database Name: ${mongoose.connection.name}`);
  console.log(`- Users in Mongo: ${userCount}`);
  console.log(`- Machines in Mongo: ${machineCount}`);
  console.log(`- Customers in Mongo: ${customerCount}`);
  console.log(`- Rolls in Mongo: ${rollCount}`);
  console.log(`- Challans in Mongo: ${challanCount}`);
  console.log(`- Invoices in Mongo: ${invoiceCount}`);
  console.log("--------------------------------------------------");
  console.log("MongoDB sync completed successfully!");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
