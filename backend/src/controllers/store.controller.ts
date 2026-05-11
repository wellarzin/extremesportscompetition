import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendError, Errors } from "../lib/response";
import { env } from "../lib/env";
import * as abacatepay from "../lib/abacatepay";

const ORDER_TTL_SECONDS = 900; // 15 minutos

// ============================================================
// Helper: confirma pedido após pagamento
// Chamado pelo webhook e pelo polling de status
// ============================================================

export async function processStoreOrderConfirmation(
  orderId: string,
  log: { info: (...a: unknown[]) => void; error: (...a: unknown[]) => void },
): Promise<void> {
  const order = await prisma.storeOrder.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { id: true, stock: true } } } } },
  });

  if (!order || order.status !== "pending_payment") return;

  await prisma.$transaction(async (tx) => {
    // Re-verifica dentro da transação
    const fresh = await tx.storeOrder.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    if (fresh?.status !== "pending_payment") return;

    // Decrementa estoque de cada item
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.product_id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.storeOrder.update({
      where: { id: orderId },
      data: { status: "paid" },
    });
  });

  log.info({ orderId }, "Pedido da loja confirmado com sucesso");
}

// ============================================================
// POST /api/v1/store/orders
// Cria pedido e inicia checkout via AbacatePay
// ============================================================

interface CartItem {
  product_id: string;
  quantity: number;
}

export async function createOrder(
  request: FastifyRequest<{ Body: { items: CartItem[]; method: "pix" | "credit_card" } }>,
  reply: FastifyReply,
) {
  const userId = request.user.sub;
  const { items, method = "pix" } = request.body;

  if (!items || items.length === 0) {
    return Errors.validation(reply, [{ message: "O carrinho está vazio." }]);
  }

  if (!env.ABACATEPAY_API_KEY) {
    return reply.status(503).send({
      success: false,
      error: { code: "PAYMENT_UNAVAILABLE", message: "Gateway de pagamento não configurado." },
    });
  }

  // ---- 1. Busca e valida produtos ----
  const productIds = items.map((i) => i.product_id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true, deleted_at: null },
    select: { id: true, name: true, price_cents: true, stock: true },
  });

  if (products.length !== productIds.length) {
    return Errors.validation(reply, [{ message: "Um ou mais produtos não foram encontrados ou estão indisponíveis." }]);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.product_id)!;
    if (item.quantity < 1) {
      return Errors.validation(reply, [{ field: "quantity", message: "Quantidade deve ser ao menos 1." }]);
    }
    if (product.stock < item.quantity) {
      return sendError(reply, 409, "OUT_OF_STOCK", `Estoque insuficiente para o produto: ${product.name}.`);
    }
  }

  // ---- 2. Calcula total ----
  const total_cents = items.reduce((sum, item) => {
    return sum + productMap.get(item.product_id)!.price_cents * item.quantity;
  }, 0);

  // ---- 3. Cria pedido ----
  const expiresAt = new Date(Date.now() + ORDER_TTL_SECONDS * 1000);

  const order = await prisma.storeOrder.create({
    data: {
      user_id: userId,
      total_cents,
      method,
      expires_at: expiresAt,
      items: {
        create: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_cents: productMap.get(item.product_id)!.price_cents,
        })),
      },
    },
  });

  // ---- 4a. PIX ----
  if (method === "pix") {
    let charge: abacatepay.AbacatePixCharge;
    try {
      charge = await abacatepay.createPixCharge(env.ABACATEPAY_API_KEY, env.ABACATEPAY_BASE_URL, {
        amount: total_cents,
        description: "Pedido Extreme Competition Store",
        internalId: order.id,
        expiresIn: ORDER_TTL_SECONDS,
      });
    } catch (err) {
      await prisma.storeOrder.delete({ where: { id: order.id } }).catch(() => {});
      request.log.error(err, "AbacatePay PIX charge creation failed for store order");
      return Errors.internal(reply);
    }

    await prisma.storeOrder.update({
      where: { id: order.id },
      data: {
        billing_id: charge.id,
        pix_code: charge.pixCode ?? null,
        expires_at: charge.expiresAt ? new Date(charge.expiresAt) : expiresAt,
      },
    });

    return sendSuccess(reply, {
      order_id: order.id,
      billing_id: charge.id,
      method: "pix",
      pix_code: charge.pixCode ?? null,
      pix_qr_code: charge.pixQrCode ?? null,
      checkout_url: null,
      total_cents,
      expires_at: charge.expiresAt ?? expiresAt.toISOString(),
    }, 201);
  }

  // ---- 4b. Cartão de crédito ----
  if (method === "credit_card") {
    // Para o carrinho com múltiplos itens, criamos um produto "bundle" no AbacatePay
    let productId: string;
    try {
      productId = await abacatepay.findOrCreateProduct(
        env.ABACATEPAY_API_KEY,
        env.ABACATEPAY_BASE_URL,
        `store_order_${order.id}`,
        "Pedido Extreme Competition Store",
        total_cents,
      );
    } catch (err) {
      await prisma.storeOrder.delete({ where: { id: order.id } }).catch(() => {});
      request.log.error(err, "AbacatePay product creation failed for store order");
      return Errors.internal(reply);
    }

    let checkout: abacatepay.AbacateCardCheckout;
    try {
      checkout = await abacatepay.createCardCheckout(
        env.ABACATEPAY_API_KEY,
        env.ABACATEPAY_BASE_URL,
        {
          productId,
          externalId: order.id,
          completionUrl: `${env.FRONTEND_URL}?store_payment_success=${order.id}`,
          returnUrl: env.FRONTEND_URL,
          maxInstallments: Math.min(12, Math.floor(total_cents / 1000)) || 1,
        },
      );
    } catch (err) {
      await prisma.storeOrder.delete({ where: { id: order.id } }).catch(() => {});
      request.log.error(err, "AbacatePay card checkout creation failed for store order");
      return Errors.internal(reply);
    }

    await prisma.storeOrder.update({
      where: { id: order.id },
      data: {
        billing_id: checkout.id,
        checkout_url: checkout.url,
      },
    });

    return sendSuccess(reply, {
      order_id: order.id,
      billing_id: checkout.id,
      method: "credit_card",
      pix_code: null,
      pix_qr_code: null,
      checkout_url: checkout.url,
      total_cents,
      expires_at: expiresAt.toISOString(),
    }, 201);
  }

  return Errors.validation(reply, [{ message: "Método de pagamento inválido." }]);
}

// ============================================================
// GET /api/v1/store/orders/:id/status
// Polling de status do pedido
// ============================================================

export async function getOrderStatus(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const userId = request.user.sub;
  const { id } = request.params;

  const order = await prisma.storeOrder.findFirst({
    where: { id, user_id: userId },
    select: {
      id: true,
      status: true,
      billing_id: true,
      method: true,
      expires_at: true,
      total_cents: true,
    },
  });

  if (!order) return Errors.notFound(reply, "Pedido");

  if (order.status !== "pending_payment") {
    return sendSuccess(reply, { status: order.status });
  }

  const isExpiredLocally = order.expires_at && order.expires_at < new Date();

  // Fallback: consulta AbacatePay
  if (env.ABACATEPAY_API_KEY && order.billing_id) {
    try {
      let abacateStatus: string;

      if (order.method === "credit_card") {
        const checkout = await abacatepay.getCardCheckoutStatus(
          env.ABACATEPAY_API_KEY,
          env.ABACATEPAY_BASE_URL,
          order.billing_id,
        );
        abacateStatus = checkout.status;
      } else {
        const charge = await abacatepay.getPixChargeStatus(
          env.ABACATEPAY_API_KEY,
          env.ABACATEPAY_BASE_URL,
          order.billing_id,
        );
        abacateStatus = charge.status;
      }

      const upperStatus = abacateStatus.toUpperCase();
      const isPaid = ["PAID", "COMPLETED", "APPROVED"].includes(upperStatus);

      if (isPaid) {
        await processStoreOrderConfirmation(id, request.log);
        return sendSuccess(reply, { status: "paid" });
      }

      const isAbacateExpired = ["EXPIRED", "CANCELLED", "REFUNDED"].includes(upperStatus);
      if (isAbacateExpired || isExpiredLocally) {
        await prisma.storeOrder.update({ where: { id }, data: { status: "cancelled" } });
        return sendSuccess(reply, { status: "cancelled" });
      }
    } catch (err) {
      request.log.warn(err, "Falha ao consultar status na AbacatePay para pedido da loja");
      if (isExpiredLocally) {
        await prisma.storeOrder.update({ where: { id }, data: { status: "cancelled" } });
        return sendSuccess(reply, { status: "cancelled" });
      }
    }
  } else if (isExpiredLocally) {
    await prisma.storeOrder.update({ where: { id }, data: { status: "cancelled" } });
    return sendSuccess(reply, { status: "cancelled" });
  }

  return sendSuccess(reply, { status: order.status });
}

// ============================================================
// GET /api/v1/store/orders
// Lista pedidos do usuário autenticado
// ============================================================

export async function listMyOrders(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.user.sub;
  const q = request.query as { page?: string; per_page?: string };
  const page = Math.max(1, Number(q.page ?? 1));
  const perPage = Math.min(50, Math.max(1, Number(q.per_page ?? 10)));
  const skip = (page - 1) * perPage;

  const [orders, total] = await Promise.all([
    prisma.storeOrder.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        status: true,
        total_cents: true,
        method: true,
        created_at: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unit_price_cents: true,
            product: { select: { id: true, name: true, image_url: true, category: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: perPage,
    }),
    prisma.storeOrder.count({ where: { user_id: userId } }),
  ]);

  return sendSuccess(reply, orders, 200, {
    page,
    per_page: perPage,
    total,
    total_pages: Math.ceil(total / perPage),
  });
}
