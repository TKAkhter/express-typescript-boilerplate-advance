import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let defaultTenant = await prisma.tenants.findFirst({
    where: { name: "Default Tenant" },
  });

  if (!defaultTenant) {
    defaultTenant = await prisma.tenants.create({
      data: { name: "Default Tenant" },
    });
  }

  const defaultTenantRole = await prisma.roles.upsert({
    where: { name: "tenant" },
    update: {},
    create: {
      name: "tenant",
    },
  });
  const defaultAdminRole = await prisma.roles.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
    },
  });
  const defaultUserRole = await prisma.roles.upsert({
    where: { name: "user" },
    update: {},
    create: {
      name: "user",
    },
  });

  console.log("Default Tenant:", defaultTenant);
  console.log("Default Tenant Role:", defaultTenantRole);
  console.log("Default Admin Role:", defaultAdminRole);
  console.log("Default User Role:", defaultUserRole);
}

main()
  .catch((e) => {
    console.error(e);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
