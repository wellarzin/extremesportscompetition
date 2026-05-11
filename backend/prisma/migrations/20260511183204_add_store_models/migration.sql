-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('vestuario', 'acessorios', 'equipamentos', 'nutricao', 'outros');

-- CreateEnum
CREATE TYPE "StoreOrderStatus" AS ENUM ('pending_payment', 'paid', 'cancelled', 'refunded');

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "category" "ProductCategory" NOT NULL DEFAULT 'outros',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "StoreOrderStatus" NOT NULL DEFAULT 'pending_payment',
    "total_cents" INTEGER NOT NULL,
    "billing_id" TEXT,
    "checkout_url" TEXT,
    "pix_code" TEXT,
    "method" VARCHAR(20) NOT NULL DEFAULT 'pix',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,

    CONSTRAINT "store_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_active_idx" ON "products"("active");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_deleted_at_idx" ON "products"("deleted_at");

-- CreateIndex
CREATE INDEX "store_orders_user_id_idx" ON "store_orders"("user_id");

-- CreateIndex
CREATE INDEX "store_orders_status_idx" ON "store_orders"("status");

-- CreateIndex
CREATE INDEX "store_orders_billing_id_idx" ON "store_orders"("billing_id");

-- CreateIndex
CREATE INDEX "store_order_items_order_id_idx" ON "store_order_items"("order_id");

-- CreateIndex
CREATE INDEX "store_order_items_product_id_idx" ON "store_order_items"("product_id");

-- AddForeignKey
ALTER TABLE "store_orders" ADD CONSTRAINT "store_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_order_items" ADD CONSTRAINT "store_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "store_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_order_items" ADD CONSTRAINT "store_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
