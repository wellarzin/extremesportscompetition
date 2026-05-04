import { buildApp } from "./app";
import { env } from "./lib/env";
import { prisma } from "./lib/prisma";
import { startPaymentPoller } from "./lib/paymentPoller";

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Servidor rodando em http://${env.HOST}:${env.PORT}`);

    // Background job: confirma pagamentos de cartão pendentes sem depender do frontend
    startPaymentPoller(app.log);
    app.log.info("⏱  PaymentPoller iniciado (intervalo: 30s)");
  } catch (err) {
    app.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
