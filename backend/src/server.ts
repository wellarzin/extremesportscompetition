import { buildApp } from "./app";
import { env } from "./lib/env";
import { prisma } from "./lib/prisma";

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Servidor rodando em http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
