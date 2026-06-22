import { PrismaClient, UserRole, PaymentMethod, SaleStatus, ExpenseStatus, DrawerStatus, PurchaseStatus, AdjustmentType, NotificationType, ApprovalStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Password123!";

async function main() {
  console.log("🌱 Starting seed...\n");

  // ── Users ──────────────────────────────────────────────
  console.log("👤 Seeding users...");
  const hashedPassword = await hash(DEFAULT_PASSWORD, 12);

  const usersData = [
    { email: "owner@ssvshop.com", firstName: "Chukwuma", lastName: "Okafor", role: UserRole.OWNER },
    { email: "manager@ssvshop.com", firstName: "Amina", lastName: "Abdullahi", role: UserRole.MANAGER },
    { email: "warehouse-manager@ssvshop.com", firstName: "Emeka", lastName: "Nwosu", role: UserRole.WAREHOUSE_MANAGER },
    { email: "warehouse-rep@ssvshop.com", firstName: "Chinedu", lastName: "Okoro", role: UserRole.WAREHOUSE_REP },
    { email: "procurement-manager@ssvshop.com", firstName: "Ngozi", lastName: "Okonkwo", role: UserRole.PROCUREMENT_MANAGER },
    { email: "procurement-rep@ssvshop.com", firstName: "Damilola", lastName: "Oyewole", role: UserRole.PROCUREMENT_REP },
    { email: "sales-manager@ssvshop.com", firstName: "Tunde", lastName: "Adeyemi", role: UserRole.SALES_MANAGER },
    { email: "sales-rep@ssvshop.com", firstName: "Fatima", lastName: "Bello", role: UserRole.SALES_REP },
    { email: "accountant@ssvshop.com", firstName: "Yusuf", lastName: "Lawal", role: UserRole.ACCOUNTANT },
    { email: "auditor@ssvshop.com", firstName: "Aisha", lastName: "Mohammed", role: UserRole.AUDITOR },
    { email: "customer@ssvshop.com", firstName: "Chidera", lastName: "Eze", role: UserRole.CUSTOMER },
  ];

  const users: Record<string, string> = {};

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        phone: "+234" + Math.floor(7000000000 + Math.random() * 3000000000),
      },
    });
    users[u.email] = user.id;
    console.log(`  ✅ ${u.role}: ${u.email}`);
  }

  // ── Categories ─────────────────────────────────────────
  console.log("\n📁 Seeding categories...");
  const categoriesData = [
    { name: "Food & Snacks", description: "Noodles, rice, biscuits, snacks and food items" },
    { name: "Beverages", description: "Soft drinks, water, juice, energy drinks" },
    { name: "Electronics", description: "Phones, accessories, gadgets" },
    { name: "Fashion", description: "Clothing, shoes, accessories" },
    { name: "Health & Beauty", description: "Skincare, haircare, vitamins, medicines" },
    { name: "Home & Kitchen", description: "Cooking utensils, appliances, home goods" },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { name: c.name },
      update: { description: c.description },
      create: c,
    });
    categories[c.name] = cat.id;
    console.log(`  ✅ ${c.name}`);
  }

  // ── Suppliers ──────────────────────────────────────────
  console.log("\n🏭 Seeding suppliers...");
  const suppliersData = [
    { name: "Nigerian Food Suppliers", contactName: "Chief Obi", email: "info@nfsuppliers.ng", phone: "+2348012345678", address: "12 Market Road", city: "Lagos", state: "Lagos" },
    { name: "Tech Distributors Ltd", contactName: "Mr. Adebayo", email: "sales@techdist.ng", phone: "+2348023456789", address: "45 Tech Avenue", city: "Lagos", state: "Lagos" },
    { name: "Fashion Hub Nigeria", contactName: "Mrs. Chioma", email: "orders@fashionhub.ng", phone: "+2348034567890", address: "78 Fashion Street", city: "Abuja", state: "FCT" },
    { name: "Health Products Co", contactName: "Dr. Ibrahim", email: "supply@healthco.ng", phone: "+2348045678901", address: "23 Health Lane", city: "Kano", state: "Kano" },
  ];

  const suppliers: Record<string, string> = {};
  for (const s of suppliersData) {
    const supplier = await prisma.supplier.create({ data: s });
    suppliers[s.name] = supplier.id;
    console.log(`  ✅ ${s.name}`);
  }

  // ── Products ───────────────────────────────────────────
  console.log("\n📦 Seeding products...");
  const productsData = [
    // Food & Snacks
    { name: "Indomie Noodles (Pack of 10)", sku: "FD-001", price: 1500, costPrice: 1100, stockQuantity: 200, minStockLevel: 30, categoryId: categories["Food & Snacks"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "pack" },
    { name: "Indomie Noodles (Single)", sku: "FD-002", price: 200, costPrice: 150, stockQuantity: 500, minStockLevel: 50, categoryId: categories["Food & Snacks"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "piece" },
    { name: "Mama Gold Rice (50kg)", sku: "FD-003", price: 65000, costPrice: 55000, stockQuantity: 30, minStockLevel: 10, categoryId: categories["Food & Snacks"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "bag" },
    { name: "Topic Rice (25kg)", sku: "FD-004", price: 35000, costPrice: 28000, stockQuantity: 50, minStockLevel: 15, categoryId: categories["Food & Snacks"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "bag" },
    { name: "Knorr Chicken Cubes (Pack)", sku: "FD-005", price: 800, costPrice: 600, stockQuantity: 100, minStockLevel: 20, categoryId: categories["Food & Snacks"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "pack" },
    { name: "Peak Milk Powder (900g)", sku: "FD-006", price: 4500, costPrice: 3800, stockQuantity: 60, minStockLevel: 15, categoryId: categories["Food & Snacks"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "tin" },
    { name: "Bournvita (500g)", sku: "FD-007", price: 2500, costPrice: 2000, stockQuantity: 80, minStockLevel: 20, categoryId: categories["Food & Snacks"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "tin" },
    { name: "Golden Morn (500g)", sku: "FD-008", price: 1800, costPrice: 1400, stockQuantity: 70, minStockLevel: 15, categoryId: categories["Food & Snacks"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "pack" },

    // Beverages
    { name: "Pepsi (50cl)", sku: "BV-001", price: 300, costPrice: 200, stockQuantity: 300, minStockLevel: 50, categoryId: categories["Beverages"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "bottle" },
    { name: "Coca-Cola (50cl)", sku: "BV-002", price: 300, costPrice: 200, stockQuantity: 300, minStockLevel: 50, categoryId: categories["Beverages"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "bottle" },
    { name: "Fanta Orange (50cl)", sku: "BV-003", price: 300, costPrice: 200, stockQuantity: 250, minStockLevel: 50, categoryId: categories["Beverages"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "bottle" },
    { name: " Eva Water (75cl)", sku: "BV-004", price: 300, costPrice: 180, stockQuantity: 400, minStockLevel: 80, categoryId: categories["Beverages"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "bottle" },
    { name: "Monster Energy Drink", sku: "BV-005", price: 1500, costPrice: 1100, stockQuantity: 50, minStockLevel: 10, categoryId: categories["Beverages"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "can" },
    { name: "Star Beer (60cl)", sku: "BV-006", price: 500, costPrice: 350, stockQuantity: 200, minStockLevel: 40, categoryId: categories["Beverages"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "bottle" },
    { name: "Gulder Lager (60cl)", sku: "BV-007", price: 500, costPrice: 350, stockQuantity: 180, minStockLevel: 40, categoryId: categories["Beverages"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "bottle" },

    // Electronics
    { name: "Samsung Galaxy A14", sku: "EL-001", price: 120000, costPrice: 95000, stockQuantity: 25, minStockLevel: 5, categoryId: categories["Electronics"], supplierId: suppliers["Tech Distributors Ltd"], unit: "piece" },
    { name: "iPhone 14 (128GB)", sku: "EL-002", price: 550000, costPrice: 480000, stockQuantity: 10, minStockLevel: 3, categoryId: categories["Electronics"], supplierId: suppliers["Tech Distributors Ltd"], unit: "piece" },
    { name: "Tecno Spark 10", sku: "EL-003", price: 85000, costPrice: 65000, stockQuantity: 30, minStockLevel: 8, categoryId: categories["Electronics"], supplierId: suppliers["Tech Distributors Ltd"], unit: "piece" },
    { name: "Infinix Hot 30", sku: "EL-004", price: 75000, costPrice: 58000, stockQuantity: 35, minStockLevel: 8, categoryId: categories["Electronics"], supplierId: suppliers["Tech Distributors Ltd"], unit: "piece" },
    { name: "Samsung Galaxy Buds", sku: "EL-005", price: 45000, costPrice: 35000, stockQuantity: 20, minStockLevel: 5, categoryId: categories["Electronics"], supplierId: suppliers["Tech Distributors Ltd"], unit: "piece" },
    { name: "Apple AirPods Pro", sku: "EL-006", price: 180000, costPrice: 150000, stockQuantity: 15, minStockLevel: 3, categoryId: categories["Electronics"], supplierId: suppliers["Tech Distributors Ltd"], unit: "piece" },
    { name: "Anker Power Bank (20000mAh)", sku: "EL-007", price: 25000, costPrice: 18000, stockQuantity: 40, minStockLevel: 10, categoryId: categories["Electronics"], supplierId: suppliers["Tech Distributors Ltd"], unit: "piece" },
    { name: "Infinix XPad 10", sku: "EL-008", price: 135000, costPrice: 105000, stockQuantity: 12, minStockLevel: 3, categoryId: categories["Electronics"], supplierId: suppliers["Tech Distributors Ltd"], unit: "piece" },

    // Fashion
    { name: "Nike Air Max (Men)", sku: "FS-001", price: 85000, costPrice: 60000, stockQuantity: 20, minStockLevel: 5, categoryId: categories["Fashion"], supplierId: suppliers["Fashion Hub Nigeria"], unit: "pair" },
    { name: "Adidas Superstar (Men)", sku: "FS-002", price: 75000, costPrice: 52000, stockQuantity: 18, minStockLevel: 5, categoryId: categories["Fashion"], supplierId: suppliers["Fashion Hub Nigeria"], unit: "pair" },
    { name: "Gucci Belt", sku: "FS-003", price: 150000, costPrice: 110000, stockQuantity: 10, minStockLevel: 2, categoryId: categories["Fashion"], supplierId: suppliers["Fashion Hub Nigeria"], unit: "piece" },
    { name: "Levi's 501 Jeans", sku: "FS-004", price: 45000, costPrice: 30000, stockQuantity: 25, minStockLevel: 5, categoryId: categories["Fashion"], supplierId: suppliers["Fashion Hub Nigeria"], unit: "piece" },
    { name: "Polo T-Shirt (Men)", sku: "FS-005", price: 12000, costPrice: 7500, stockQuantity: 50, minStockLevel: 10, categoryId: categories["Fashion"], supplierId: suppliers["Fashion Hub Nigeria"], unit: "piece" },

    // Health & Beauty
    { name: "Nivea Body Lotion (400ml)", sku: "HB-001", price: 3500, costPrice: 2500, stockQuantity: 60, minStockLevel: 15, categoryId: categories["Health & Beauty"], supplierId: suppliers["Health Products Co"], unit: "bottle" },
    { name: "Dettol Antiseptic (500ml)", sku: "HB-002", price: 2800, costPrice: 2000, stockQuantity: 80, minStockLevel: 20, categoryId: categories["Health & Beauty"], supplierId: suppliers["Health Products Co"], unit: "bottle" },
    { name: "Vitamin C Supplements (60 tabs)", sku: "HB-003", price: 5000, costPrice: 3500, stockQuantity: 40, minStockLevel: 10, categoryId: categories["Health & Beauty"], supplierId: suppliers["Health Products Co"], unit: "bottle" },
    { name: "Dove Shampoo (400ml)", sku: "HB-004", price: 4200, costPrice: 3000, stockQuantity: 50, minStockLevel: 12, categoryId: categories["Health & Beauty"], supplierId: suppliers["Health Products Co"], unit: "bottle" },
    { name: "Paracetamol (Tablets Pack)", sku: "HB-005", price: 800, costPrice: 500, stockQuantity: 150, minStockLevel: 30, categoryId: categories["Health & Beauty"], supplierId: suppliers["Health Products Co"], unit: "pack" },

    // Home & Kitchen
    { name: "Prestige Pressure Cooker (5L)", sku: "HK-001", price: 35000, costPrice: 25000, stockQuantity: 15, minStockLevel: 3, categoryId: categories["Home & Kitchen"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "piece" },
    { name: "Binatone Blender", sku: "HK-002", price: 28000, costPrice: 20000, stockQuantity: 20, minStockLevel: 5, categoryId: categories["Home & Kitchen"], supplierId: suppliers["Tech Distributors Ltd"], unit: "piece" },
    { name: "Nigerian Cast Iron Pot", sku: "HK-003", price: 15000, costPrice: 10000, stockQuantity: 25, minStockLevel: 5, categoryId: categories["Home & Kitchen"], supplierId: suppliers["Nigerian Food Suppliers"], unit: "piece" },
    { name: "Thermocool Refrigerator (Small)", sku: "HK-004", price: 180000, costPrice: 140000, stockQuantity: 8, minStockLevel: 2, categoryId: categories["Home & Kitchen"], supplierId: suppliers["Tech Distributors Ltd"], unit: "piece" },
    { name: "Infinix Washing Machine (8kg)", sku: "HK-005", price: 220000, costPrice: 170000, stockQuantity: 6, minStockLevel: 2, categoryId: categories["Home & Kitchen"], supplierId: suppliers["Tech Distributors Ltd"], unit: "piece" },
  ];

  const products: Record<string, string> = {};
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        price: p.price,
        costPrice: p.costPrice,
        stockQuantity: p.stockQuantity,
        minStockLevel: p.minStockLevel,
      },
      create: {
        name: p.name,
        sku: p.sku,
        price: p.price,
        costPrice: p.costPrice,
        stockQuantity: p.stockQuantity,
        minStockLevel: p.minStockLevel,
        maxStockLevel: p.minStockLevel * 20,
        unit: p.unit,
        categoryId: p.categoryId,
        supplierId: p.supplierId,
        isFeatured: Math.random() > 0.7,
      },
    });
    products[p.sku] = product.id;
    console.log(`  ✅ ${p.name} (${p.sku})`);
  }

  // ── Customers ──────────────────────────────────────────
  console.log("\n👥 Seeding customers...");
  const customersData = [
    { firstName: "Adewale", lastName: "Ajayi", email: "adewale.ajayi@email.com", phone: "+2348011111111", city: "Lagos", state: "Lagos" },
    { firstName: "Blessing", lastName: "Ogbonna", email: "blessing.ogbonna@email.com", phone: "+2348022222222", city: "Port Harcourt", state: "Rivers" },
    { firstName: "Chinedu", lastName: "Okoro", email: "chinedu.okoro@email.com", phone: "+2348033333333", city: "Enugu", state: "Enugu" },
    { firstName: "Damilola", lastName: "Oyewole", email: "damilola.oyewole@email.com", phone: "+2348044444444", city: "Ibadan", state: "Oyo" },
    { firstName: "Emeka", lastName: "Uche", email: "emeka.uche@email.com", phone: "+2348055555555", city: "Onitsha", state: "Anambra" },
    { firstName: "Funke", lastName: "Adeleke", email: "funke.adeleke@email.com", phone: "+2348066666666", city: "Lagos", state: "Lagos" },
    { firstName: "Gideon", lastName: "Danladi", email: "gideon.danladi@email.com", phone: "+2348077777777", city: "Abuja", state: "FCT" },
    { firstName: "Halima", lastName: "Suleiman", email: "halima.suleiman@email.com", phone: "+2348088888888", city: "Kano", state: "Kano" },
    { firstName: "Ifeanyi", lastName: "Chukwu", email: "ifeanyi.chukwu@email.com", phone: "+2348099999999", city: "Asaba", state: "Delta" },
    { firstName: "Jumoke", lastName: "Bakare", email: "jumoke.bakare@email.com", phone: "+2348000000000", city: "Abeokuta", state: "Ogun" },
  ];

  const customerIds: string[] = [];
  for (const c of customersData) {
    const customer = await prisma.customer.upsert({
      where: { email: c.email },
      update: {},
      create: {
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        city: c.city,
        state: c.state,
        loyaltyPoints: Math.floor(Math.random() * 500),
      },
    });
    customerIds.push(customer.id);
    console.log(`  ✅ ${c.firstName} ${c.lastName}`);
  }

  // ── Expense Categories ─────────────────────────────────
  console.log("\n💰 Seeding expense categories...");
  const expenseCategoriesData = [
    { name: "Rent", description: "Office and store rent" },
    { name: "Utilities", description: "Electricity, water, internet bills" },
    { name: "Salaries", description: "Staff salaries and wages" },
    { name: "Transport", description: "Fuel, logistics, delivery costs" },
    { name: "Office Supplies", description: "Stationery, printing, packaging" },
  ];

  const expenseCategories: Record<string, string> = {};
  for (const ec of expenseCategoriesData) {
    const cat = await prisma.expenseCategory.upsert({
      where: { name: ec.name },
      update: { description: ec.description },
      create: ec,
    });
    expenseCategories[ec.name] = cat.id;
    console.log(`  ✅ ${ec.name}`);
  }

  // ── Sales ──────────────────────────────────────────────
  console.log("\n🛒 Seeding sales...");
  const paymentMethods = [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.TRANSFER, PaymentMethod.USSD, PaymentMethod.MOBILE];
  const skus = Object.keys(products);

  const salesIds: string[] = [];

  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - daysAgo);
    saleDate.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);

    const numItems = 1 + Math.floor(Math.random() * 4);
    const saleItems: { productId: string; quantity: number; unitPrice: number; total: number }[] = [];
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      const sku = skus[Math.floor(Math.random() * skus.length)];
      const productId = products[sku];
      const qty = 1 + Math.floor(Math.random() * 5);
      const productData = productsData.find((p) => p.sku === sku)!;
      const unitPrice = productData.price;
      const total = unitPrice * qty;
      subtotal += total;
      saleItems.push({ productId, quantity: qty, unitPrice, total });
    }

    const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.05) : 0;
    const tax = Math.round(subtotal * 0.075);
    const total = subtotal - discount + tax;
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const hasCustomer = Math.random() > 0.4;
    const customerId = hasCustomer ? customerIds[Math.floor(Math.random() * customerIds.length)] : null;

    const invoiceNum = `INV-${saleDate.getFullYear()}${String(saleDate.getMonth() + 1).padStart(2, "0")}${String(saleDate.getDate()).padStart(2, "0")}-${String(i + 1).padStart(4, "0")}`;

    const existingSale = await prisma.sale.findUnique({ where: { invoiceNumber: invoiceNum } });
    if (existingSale) {
      salesIds.push(existingSale.id);
      continue;
    }

    const sale = await prisma.sale.create({
      data: {
        invoiceNumber: invoiceNum,
        userId: users["sales-rep@ssvshop.com"],
        customerId,
        subtotal,
        discount,
        tax,
        total,
        amountPaid: total,
        changeDue: 0,
        paymentMethod,
        status: SaleStatus.COMPLETED,
        createdAt: saleDate,
        items: {
          create: saleItems,
        },
      },
    });

    salesIds.push(sale.id);

    if (customerId) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { totalSpent: { increment: total }, loyaltyPoints: { increment: Math.floor(total / 100) } },
      });
    }

    console.log(`  ✅ Sale ${invoiceNum} - ₦${total.toLocaleString()}`);
  }

  // ── Expenses ───────────────────────────────────────────
  console.log("\n💸 Seeding expenses...");
  const expenseDescriptions: Record<string, string[]> = {
    "Rent": ["Monthly shop rent", "Warehouse rent payment", "Office space rent"],
    "Utilities": ["Electricity bill - IKEDC", "Water bill", "Internet subscription", "Diesel for generator"],
    "Salaries": ["Staff salary - January", "Staff salary - February", "Staff salary - March", "Overtime payment"],
    "Transport": ["Fuel for delivery van", "Logistics for stock transfer", "Transport allowance"],
    "Office Supplies": ["Printer ink and paper", "Packaging materials", "Office cleaning supplies", "POS receipt rolls"],
  };

  const expenseAmounts: Record<string, [number, number]> = {
    "Rent": [150000, 500000],
    "Utilities": [5000, 80000],
    "Salaries": [50000, 250000],
    "Transport": [3000, 30000],
    "Office Supplies": [2000, 25000],
  };

  const expenseStatuses = [ExpenseStatus.PENDING, ExpenseStatus.APPROVED, ExpenseStatus.PAID, ExpenseStatus.APPROVED];

  for (let i = 0; i < 25; i++) {
    const catName = Object.keys(expenseCategories)[Math.floor(Math.random() * Object.keys(expenseCategories).length)];
    const descriptions = expenseDescriptions[catName];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    const [min, max] = expenseAmounts[catName];
    const amount = Math.round((min + Math.random() * (max - min)) / 100) * 100;
    const daysAgo = Math.floor(Math.random() * 90);
    const expenseDate = new Date();
    expenseDate.setDate(expenseDate.getDate() - daysAgo);
    const status = expenseStatuses[Math.floor(Math.random() * expenseStatuses.length)];

    await prisma.expense.create({
      data: {
        userId: users["accountant@ssvshop.com"],
        categoryId: expenseCategories[catName],
        description,
        amount,
        date: expenseDate,
        status,
        notes: Math.random() > 0.5 ? `Expense record #${i + 1}` : null,
      },
    });
    console.log(`  ✅ ${description} - ₦${amount.toLocaleString()} [${status}]`);
  }

  // ── Purchase Orders ────────────────────────────────────
  console.log("\n📋 Seeding purchase orders...");
  const supplierNames = Object.keys(suppliers);

  for (let i = 0; i < 8; i++) {
    const supplierName = supplierNames[i % supplierNames.length];
    const daysAgo = Math.floor(Math.random() * 60);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - daysAgo);

    const numItems = 2 + Math.floor(Math.random() * 3);
    const poItems: { productId: string; quantity: number; unitCost: number; total: number }[] = [];
    let poTotal = 0;

    for (let j = 0; j < numItems; j++) {
      const sku = skus[Math.floor(Math.random() * skus.length)];
      const productId = products[sku];
      const qty = 10 + Math.floor(Math.random() * 90);
      const productData = productsData.find((p) => p.sku === sku)!;
      const unitCost = productData.costPrice;
      const total = unitCost * qty;
      poTotal += total;
      poItems.push({ productId, quantity: qty, unitCost, total });
    }

    const orderNum = `PO-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, "0")}${String(orderDate.getDate()).padStart(2, "0")}-${String(i + 1).padStart(4, "0")}`;
    const statuses = [PurchaseStatus.PENDING, PurchaseStatus.APPROVED, PurchaseStatus.ORDERED, PurchaseStatus.RECEIVED];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const existingPO = await prisma.purchaseOrder.findUnique({ where: { orderNumber: orderNum } });
    if (existingPO) continue;

    await prisma.purchaseOrder.create({
      data: {
        orderNumber: orderNum,
        supplierId: suppliers[supplierName],
        total: poTotal,
        status,
        expectedDate: new Date(orderDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        notes: `Order from ${supplierName}`,
        createdBy: users["procurement-manager@ssvshop.com"],
        createdAt: orderDate,
        items: {
          create: poItems,
        },
      },
    });
    console.log(`  ✅ ${orderNum} - ${supplierName} - ₦${poTotal.toLocaleString()} [${status}]`);
  }

  // ── Cash Drawers ───────────────────────────────────────
  console.log("\n🏧 Seeding cash drawers...");
  await prisma.cashDrawer.create({
    data: {
        userId: users["sales-rep@ssvshop.com"],
      openingBalance: 50000,
      closingBalance: 87500,
      actualBalance: 87500,
      difference: 0,
      status: DrawerStatus.CLOSED,
      openedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      closedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  });

  await prisma.cashDrawer.create({
    data: {
        userId: users["sales-rep@ssvshop.com"],
      openingBalance: 50000,
      status: DrawerStatus.OPEN,
      openedAt: new Date(),
    },
  });
  console.log("  ✅ 2 cash drawer records created");

  // ── Bookings ───────────────────────────────────────────
  console.log("\n📅 Seeding bookings...");
  const serviceTypes = ["Consultation", "Delivery", "Installation", "Training", "Support"];

  for (let i = 0; i < 10; i++) {
    const daysAhead = Math.floor(Math.random() * 30);
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + daysAhead);

    const existingBooking = await prisma.booking.findUnique({ where: { bookingNumber: `BK-${String(i + 1).padStart(4, "0")}` } });
    if (existingBooking) continue;

    await prisma.booking.create({
      data: {
        bookingNumber: `BK-${String(i + 1).padStart(4, "0")}`,
        customerId: customerIds[Math.floor(Math.random() * customerIds.length)],
        serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
        description: `Service booking for ${serviceTypes[Math.floor(Math.random() * serviceTypes.length)].toLowerCase()}`,
        date: bookingDate,
        time: `${9 + Math.floor(Math.random() * 8)}:00`,
        duration: [30, 60, 90, 120][Math.floor(Math.random() * 4)],
        status: ["PENDING", "CONFIRMED", "COMPLETED"][Math.floor(Math.random() * 3)] as any,
        totalAmount: Math.round((5000 + Math.random() * 50000) / 100) * 100,
      },
    });
    console.log(`  ✅ Booking BK-${String(i + 1).padStart(4, "0")}`);
  }

  // ── Notifications ──────────────────────────────────────
  console.log("\n🔔 Seeding notifications...");
  const notificationTemplates = [
    { title: "Low Stock Alert", message: "Some products are running low on stock. Please reorder.", type: NotificationType.WARNING },
    { title: "New Sale Completed", message: "A new sale has been recorded successfully.", type: NotificationType.SUCCESS },
    { title: "System Update", message: "The POS system has been updated to the latest version.", type: NotificationType.INFO },
  ];

  for (const email of Object.keys(users)) {
    for (const template of notificationTemplates) {
      await prisma.notification.create({
        data: {
          userId: users[email],
          title: template.title,
          message: template.message,
          type: template.type,
          isRead: Math.random() > 0.5,
        },
      });
    }
    console.log(`  ✅ 3 notifications for ${email}`);
  }

  // ── Audit Logs ─────────────────────────────────────────
  console.log("\n📝 Seeding audit logs...");
  const auditActions = [
    { action: "LOGIN", resource: "auth" },
    { action: "CREATE", resource: "sale" },
    { action: "UPDATE", resource: "product" },
    { action: "DELETE", resource: "product" },
    { action: "CREATE", resource: "expense" },
    { action: "APPROVE", resource: "expense" },
    { action: "UPDATE", resource: "settings" },
    { action: "EXPORT", resource: "report" },
  ];

  for (const email of Object.keys(users).slice(0, 5)) {
    for (let i = 0; i < 3; i++) {
      const audit = auditActions[Math.floor(Math.random() * auditActions.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const logDate = new Date();
      logDate.setDate(logDate.getDate() - daysAgo);

      await prisma.auditLog.create({
        data: {
          userId: users[email],
          action: audit.action,
          resource: audit.resource,
          resourceId: `sample-${Math.floor(Math.random() * 1000)}`,
          details: { info: `Sample audit log entry for ${audit.action} on ${audit.resource}` },
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          createdAt: logDate,
        },
      });
    }
    console.log(`  ✅ 3 audit logs for ${email}`);
  }

  // ── Settings ───────────────────────────────────────────
  console.log("\n⚙️ Seeding settings...");
  const settingsData = [
    { key: "business_name", value: "SSV Shop", group: "business" },
    { key: "business_address", value: "15 Broad Street, Lagos Island, Lagos, Nigeria", group: "business" },
    { key: "business_phone", value: "+2348012345678", group: "business" },
    { key: "business_email", value: "info@ssvshop.com", group: "business" },
    { key: "currency", value: "NGN", group: "business" },
    { key: "currency_symbol", value: "₦", group: "business" },
    { key: "tax_rate", value: "7.5", group: "finance" },
    { key: "receipt_footer", value: "Thank you for shopping with SSV Shop!", group: "receipt" },
    { key: "low_stock_threshold", value: "10", group: "inventory" },
    { key: "loyalty_points_rate", value: "1", group: "loyalty" },
    { key: "default_payment_method", value: "CASH", group: "payment" },
    { key: "timezone", value: "Africa/Lagos", group: "general" },
    { key: "date_format", value: "DD/MM/YYYY", group: "general" },
    { key: "time_format", value: "24h", group: "general" },
    { key: "receipt_width", value: "80mm", group: "receipt" },
    { key: "auto_print", value: "true", group: "receipt" },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
    console.log(`  ✅ ${s.key} = ${s.value}`);
  }

  // ── Invoices ───────────────────────────────────────────
  console.log("\n🧾 Seeding invoices...");
  const invoiceStatuses = ["PENDING", "PAID", "OVERDUE"];
  for (let i = 0; i < 5; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const invDate = new Date();
    invDate.setDate(invDate.getDate() - daysAgo);
    const amount = Math.round((10000 + Math.random() * 200000) / 100) * 100;
    const tax = Math.round(amount * 0.075);
    const status = invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)] as any;

    const invNum = `INV-${String(i + 1).padStart(4, "0")}-EXP`;
    const existingInv = await prisma.invoice.findUnique({ where: { invoiceNumber: invNum } });
    if (existingInv) continue;

    await prisma.invoice.create({
      data: {
        invoiceNumber: invNum,
        customerId: customerIds[Math.floor(Math.random() * customerIds.length)],
        amount,
        tax,
        total: amount + tax,
        status,
        dueDate: new Date(invDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        paidDate: status === "PAID" ? invDate : null,
      },
    });
    console.log(`  ✅ Invoice ${invNum} - ₦${(amount + tax).toLocaleString()} [${status}]`);
  }

  // ── Stock Adjustments ──────────────────────────────────
  console.log("\n📊 Seeding stock adjustments...");
  const adjTypes = [AdjustmentType.ADDITION, AdjustmentType.SUBTRACTION, AdjustmentType.DAMAGE, AdjustmentType.RETURN];
  const adjReasons = ["Stock count correction", "Damaged goods", "Customer return", "New stock received", "Expired products", "Transfer to warehouse"];

  for (let i = 0; i < 12; i++) {
    const sku = skus[Math.floor(Math.random() * skus.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const adjDate = new Date();
    adjDate.setDate(adjDate.getDate() - daysAgo);

    await prisma.stockAdjustment.create({
      data: {
        productId: products[sku],
        userId: users["warehouse-manager@ssvshop.com"],
        type: adjTypes[Math.floor(Math.random() * adjTypes.length)],
        quantity: 1 + Math.floor(Math.random() * 20),
        reason: adjReasons[Math.floor(Math.random() * adjReasons.length)],
        reference: `REF-ADJ-${String(i + 1).padStart(3, "0")}`,
        createdAt: adjDate,
      },
    });
    console.log(`  ✅ Stock adjustment for ${sku}`);
  }

  // ── User Permissions ───────────────────────────────────
  console.log("\n🔐 Seeding user permissions...");
  const rolePermissions: Record<string, { action: string; resource: string }[]> = {
    OWNER: [
      { action: "manage", resource: "all" },
      { action: "view", resource: "reports" },
    ],
    MANAGER: [
      { action: "view", resource: "dashboard" },
      { action: "manage", resource: "products" },
      { action: "manage", resource: "sales" },
    ],
    WAREHOUSE_MANAGER: [
      { action: "manage", resource: "products" },
      { action: "manage", resource: "stock" },
      { action: "manage", resource: "categories" },
    ],
    WAREHOUSE_REP: [
      { action: "view", resource: "products" },
      { action: "manage", resource: "stock-adjustments" },
    ],
    PROCUREMENT_MANAGER: [
      { action: "manage", resource: "purchase-orders" },
      { action: "view", resource: "suppliers" },
      { action: "manage", resource: "suppliers" },
    ],
    PROCUREMENT_REP: [
      { action: "view", resource: "suppliers" },
      { action: "create", resource: "stock-requests" },
    ],
    SALES_MANAGER: [
      { action: "view", resource: "sales" },
      { action: "manage", resource: "sales" },
      { action: "view", resource: "customers" },
    ],
    SALES_REP: [
      { action: "create", resource: "sale" },
      { action: "view", resource: "products" },
      { action: "view", resource: "customers" },
    ],
    ACCOUNTANT: [
      { action: "view", resource: "financial-reports" },
      { action: "manage", resource: "expenses" },
    ],
    AUDITOR: [
      { action: "view", resource: "audit-logs" },
      { action: "view", resource: "reports" },
    ],
    CUSTOMER: [
      { action: "view", resource: "profile" },
      { action: "view", resource: "orders" },
    ],
  };

  for (const email of Object.keys(users)) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) continue;
    const perms = rolePermissions[user.role] || [];
    for (const perm of perms) {
      await prisma.userPermission.upsert({
        where: { userId_action_resource: { userId: user.id, action: perm.action, resource: perm.resource } },
        update: {},
        create: { userId: user.id, action: perm.action, resource: perm.resource },
      });
    }
    console.log(`  ✅ Permissions for ${email} (${user.role})`);
  }

  // ── Supply Requests ────────────────────────────────────
  console.log("\n📬 Seeding supply requests...");
  const supplyRequestStatuses = ["PENDING", "APPROVED", "ORDERED", "RECEIVED", "CANCELLED"];
  const urgencyLevels = ["LOW", "NORMAL", "HIGH", "URGENT"];

  for (let i = 0; i < 6; i++) {
    const supplierName = supplierNames[i % supplierNames.length];
    await prisma.supplyRequest.create({
      data: {
        supplierId: suppliers[supplierName],
        requestedBy: users["procurement-manager@ssvshop.com"],
        description: `Urgent supply request for ${supplierName} - batch ${i + 1}`,
        status: supplyRequestStatuses[i % supplyRequestStatuses.length] as any,
        urgency: urgencyLevels[i % urgencyLevels.length] as any,
        expectedDate: new Date(Date.now() + (7 + i * 3) * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`  ✅ Supply request #${i + 1} to ${supplierName}`);
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Summary:");
  console.log(`  - ${Object.keys(users).length} users`);
  console.log(`  - ${Object.keys(categories).length} categories`);
  console.log(`  - ${Object.keys(suppliers).length} suppliers`);
  console.log(`  - ${Object.keys(products).length} products`);
  console.log(`  - ${customerIds.length} customers`);
  console.log(`  - 30 sales`);
  console.log(`  - 25 expenses`);
  console.log(`  - 8 purchase orders`);
  console.log(`  - 10 bookings`);
  console.log(`  - ${Object.keys(users).length * 3} notifications`);
  console.log(`  - 15 audit logs`);
  console.log(`  - ${settingsData.length} settings`);
  console.log(`  - 5 invoices`);
  console.log(`  - 12 stock adjustments`);
  console.log(`  - 6 supply requests`);
  console.log("\n🔐 Default password for all users: Password123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
