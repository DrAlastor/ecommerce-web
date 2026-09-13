import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT table_name, column_name, column_default FROM information_schema.columns WHERE table_name = 'usuario' AND column_name = 'id_usuario'`;
    console.log(result);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
