import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const oldUsers = await prisma.user.findMany({
    where: { email: { contains: "firstladyoil" } },
    select: { id: true, email: true },
  });

  if (oldUsers.length === 0) {
    console.log("No old firstladyoil.com users found.");
    return;
  }

  const ids = oldUsers.map((u) => u.id);
  console.log(`Found ${ids.length} old users to delete:`);
  oldUsers.forEach((u) => console.log(`  - ${u.email} (${u.id})`));

  // Delete related records that don't cascade (order matters)
  const auditLogs = await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } });
  console.log(`\n  Deleted ${auditLogs.count} AuditLog records`);

  const stockAdj = await prisma.stockAdjustment.deleteMany({ where: { userId: { in: ids } } });
  console.log(`  Deleted ${stockAdj.count} StockAdjustment records`);

  const expenseApprovals = await prisma.expenseApproval.deleteMany({ where: { userId: { in: ids } } });
  console.log(`  Deleted ${expenseApprovals.count} ExpenseApproval records`);

  const expenses = await prisma.expense.deleteMany({ where: { userId: { in: ids } } });
  console.log(`  Deleted ${expenses.count} Expense records`);

  const sales = await prisma.sale.deleteMany({ where: { userId: { in: ids } } });
  console.log(`  Deleted ${sales.count} Sale records`);

  const cashDrawers = await prisma.cashDrawer.deleteMany({ where: { userId: { in: ids } } });
  console.log(`  Deleted ${cashDrawers.count} CashDrawer records`);

  // PurchaseOrder.createdBy is non-nullable FK to User
  const purchaseOrders = await prisma.purchaseOrder.deleteMany({ where: { createdBy: { in: ids } } });
  console.log(`  Deleted ${purchaseOrders.count} PurchaseOrder records`);

  // SupplyRequest.requestedBy is non-nullable FK to User
  try {
    const supplyRequests = await prisma.supplyRequest.deleteMany({ where: { requestedBy: { in: ids } } });
    console.log(`  Deleted ${supplyRequests.count} SupplyRequest records`);
  } catch (e: any) {
    if (e.code === "P2022") {
      console.log("  Skipped SupplyRequest (table/column not in DB)");
    } else throw e;
  }

  const perms = await prisma.userPermission.deleteMany({ where: { userId: { in: ids } } });
  console.log(`  Deleted ${perms.count} UserPermission records`);

  const notifs = await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
  console.log(`  Deleted ${notifs.count} Notification records`);

  // Now delete the users
  const deleted = await prisma.user.deleteMany({
    where: { email: { contains: "firstladyoil" } },
  });
  console.log(`\n  Deleted ${deleted.count} User records`);

  const remaining = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log("\nRemaining users:");
  remaining.forEach((u) => console.log(`  ${u.email} - ${u.role}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
