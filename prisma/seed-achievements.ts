import prisma from "../lib/db";
import { ACHIEVEMENTS } from "../features/gamification/config/achievements";

async function seedAchievements() {
  console.log("Seeding achievements...");

  for (const def of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: def.code },
      create: {
        code: def.code,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        requirement: def.requirement,
        xpReward: def.xpReward,
      },
      update: {
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        requirement: def.requirement,
        xpReward: def.xpReward,
      },
    });
  }

  console.log(`Seeded ${ACHIEVEMENTS.length} achievements.`);
}

seedAchievements()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
