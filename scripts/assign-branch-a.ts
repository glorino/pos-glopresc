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
        phone: "+234 800 SSVSHOP",
        email: "brancha@ssvshop.com",
        isDefault: true,
      },
    });
    console.log("Created Branch A:", branchA.id);
  } else {
    console.log("Branch A already exists:", branchA.id);
  }

  // Assign all listed users to Branch A
  const userEmails = [
    "manager@ssvshop.com",
    "warehouse-manager@ssvshop.com",
    "warehouse-rep@ssvshop.com",
    "procurement-manager@ssvshop.com",
    "procurement-rep@ssvshop.com",
    "sales-manager@ssvshop.com",
    "sales-rep@ssvshop.com",
    "accountant@ssvshop.com",
    "auditor@ssvshop.com",
    "customer@ssvshop.com",
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
