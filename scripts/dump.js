import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.students.findMany({ select: { Student_ID: true, Name: true } });
  const teachers = await prisma.teacher.findMany({ select: { Teacher_ID: true, Name: true } });
  console.log('Students:', students);
  console.log('Teachers:', teachers);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
