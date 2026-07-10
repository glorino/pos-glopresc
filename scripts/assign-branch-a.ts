import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create Branch A if it doesn't exist
  let branchA = await prisma.branch.findUnique({ where: { code: "BR-001" } });
  if (!branchA) {
    branchA = await prisma.branch.create({
      data: {
        name: "Branch A",
        code: "BR-001",
        address: "123 Commerce Street, Lagos, Nigeria",
        phone: "+234 800 FIRSTLADYOIL",
        email: "brancha@firstladyoil.com",
        isDefault: true,
      },
    });
    console.log("Created Branch A:", branchA.id);
  } else {
    console.log("Branch A already exists:", branchA.id);
  }

  // Assign all listed users to Branch A
  const userEmails = [
    "manager@firstladyoil.com",
    "warehouse-manager@firstladyoil.com",
    "warehouse-rep@firstladyoil.com",
    "procurement-manager@firstladyoil.com",
    "procurement-rep@firstladyoil.com",
    "sales-manager@firstladyoil.com",
    "sales-rep@firstladyoil.com",
    "accountant@firstladyoil.com",
    "auditor@firstladyoil.com",
    "customer@firstladyoil.com",
  ];

  for (const email of userEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { email },
        data: { branchId: branchA.id },
      });
      console.log(`Assigned ${email} to Branch A`);
    } else {
      console.log(`User ${email} not found, skipping`);
    }
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
