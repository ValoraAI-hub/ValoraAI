import { prisma } from "./lib/prisma";

async function main() {
  const candidates = await prisma.candidate.findMany();
  console.log("DATA:", candidates);
}

main();