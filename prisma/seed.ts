import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seed = async () => {
  try {
    await prisma.task.createMany({
      data: [
        { title: "Learn Prisma", color: "blue", completed: false },
        { title: "Build Todo App", color: "green", completed: true },
        { title: "Write Tests", color: "red", completed: false },
      ],
    });
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
};

seed();
