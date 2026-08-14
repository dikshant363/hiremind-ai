/**
 * HIREMIND AI — DEVELOPMENT SEEDER
 *
 * ⚠️ DEVELOPMENT ONLY ⚠️
 * DO NOT RUN IN PRODUCTION.
 *
 * Populates sample development roles and standard configuration
 * for local testing without modifying production data.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [HIREMIND] Starting development database seeding...");

  // Ensure default system configuration singleton exists
  await prisma.systemConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      brandName: "HireMind AI",
      brandTagline: "Evidence-based job readiness · AI-assisted assessment",
      accentColor: "blue",
      defaultDifficulty: "auto",
    },
  });

  console.log("✅ [HIREMIND] Development seeding complete (SystemConfig ready).");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
