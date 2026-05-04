// ============================================================
// PaymentPoller — background job para confirmar pagamentos de cartão
//
// Roda a cada POLL_INTERVAL_MS, varre todos os payments com
// method=credit_card e status=pending que já foram criados na
// AbacatePay (billing_id válido) e os confirma automaticamente.
//
// Isso garante que o ingresso seja entregue mesmo que:
//   - o usuário feche a aba após pagar
//   - o webhook não chegue (dev sem ngrok, falha de rede)
//   - o frontend polling perca o timing
// ============================================================

import { prisma } from "./prisma";
import { env } from "./env";
import * as abacatepay from "./abacatepay";
import { processPaymentConfirmation } from "../controllers/checkout.controller";

type Logger = {
  info: (...a: unknown[]) => void;
  warn: (...a: unknown[]) => void;
  error: (...a: unknown[]) => void;
};

const POLL_INTERVAL_MS = 30_000; // 30 segundos
const BATCH_SIZE = 20; // max por rodada (evita flood na API)

// IDs inválidos que não devem ser consultados
const INVALID_BILLING_IDS = ["pending", ""];

async function runOnce(log: Logger): Promise<void> {
  if (!env.ABACATEPAY_API_KEY) return;

  // Janela extra de 10 min além do TTL local — cobre casos onde o usuário pagou
  // na AbacatePay pouco antes de nosso TTL expirar e a confirmação chegou atrasada.
  const gracePeriodMs = 10 * 60 * 1000;
  const cutoff = new Date(Date.now() - gracePeriodMs);

  const pending = await prisma.payment.findMany({
    where: {
      status: "pending",
      method: "credit_card",
      billing_id: { notIn: INVALID_BILLING_IDS },
      expires_at: { gt: cutoff },
    },
    select: { id: true, billing_id: true },
    orderBy: { created_at: "asc" },
    take: BATCH_SIZE,
  });

  if (pending.length === 0) return;

  log.info({ count: pending.length }, "PaymentPoller: verificando pagamentos pendentes");

  for (const payment of pending) {
    try {
      const checkout = await abacatepay.getCardCheckoutStatus(
        env.ABACATEPAY_API_KEY!,
        env.ABACATEPAY_BASE_URL,
        payment.billing_id,
      );

      const status = checkout.status.toUpperCase();

      if (["PAID", "COMPLETED", "APPROVED"].includes(status)) {
        const ticketId = await processPaymentConfirmation(payment.id, log);
        log.info({ paymentId: payment.id, ticketId }, "PaymentPoller: pagamento confirmado, ingresso gerado");
        continue;
      }

      if (["EXPIRED", "CANCELLED", "REFUNDED"].includes(status)) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "expired" },
        });
        log.info({ paymentId: payment.id, abacateStatus: status }, "PaymentPoller: pagamento marcado como expirado");
      }

      // PENDING — aguarda próxima rodada
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // "Not found" = checkout não existe mais na AbacatePay → expira localmente
      if (msg.includes("Not found")) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "expired" },
        }).catch(() => {});
        log.warn({ paymentId: payment.id }, "PaymentPoller: billing_id não encontrado na AbacatePay — pagamento expirado");
        continue;
      }

      // Outros erros de rede/API: loga e tenta novamente na próxima rodada
      log.warn({ paymentId: payment.id, err: msg }, "PaymentPoller: erro ao consultar AbacatePay");
    }
  }
}

export function startPaymentPoller(log: Logger): void {
  // Primeira rodada após 10s (dá tempo do servidor inicializar completamente)
  const initialDelay = setTimeout(() => {
    runOnce(log).catch((err) =>
      log.error({ err }, "PaymentPoller: erro inesperado na rodada inicial"),
    );
  }, 10_000);

  // Rodadas periódicas
  const interval = setInterval(() => {
    runOnce(log).catch((err) =>
      log.error({ err }, "PaymentPoller: erro inesperado na rodada periódica"),
    );
  }, POLL_INTERVAL_MS);

  // Limpeza graceful no shutdown
  const cleanup = () => {
    clearTimeout(initialDelay);
    clearInterval(interval);
  };
  process.once("SIGTERM", cleanup);
  process.once("SIGINT", cleanup);
}
