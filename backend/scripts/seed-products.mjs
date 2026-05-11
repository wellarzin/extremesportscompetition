// Seed inicial de produtos da loja
// Executar: node --env-file=.env scripts/seed-products.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    name: "Camiseta Extreme Sports Pro",
    description: "Camiseta técnica de alta performance para treinos e competições. Tecido dry-fit com proteção UV50+.",
    price_cents: 8990,
    stock: 50,
    image_url: "/product-shirt.jpg",
    category: "vestuario",
    active: true,
  },
  {
    name: "Boné Extreme Classic",
    description: "Boné estruturado com aba curva e logo bordado. Ajuste snapback. Ideal para treinos ao ar livre.",
    price_cents: 6990,
    stock: 30,
    image_url: "/product-bone.jpg",
    category: "acessorios",
    active: true,
  },
  {
    name: "Mochila Delivery Extreme",
    description: "Mochila resistente com compartimento térmico de 45L. Estrutura reforçada e alças acolchoadas.",
    price_cents: 19990,
    stock: 20,
    image_url: "/product-backpack.jpg",
    category: "equipamentos",
    active: true,
  },
  {
    name: "Garrafa Térmica 750ml",
    description: "Garrafa de aço inoxidável com isolamento duplo. Mantém a temperatura por até 24 horas.",
    price_cents: 5990,
    stock: 60,
    image_url: "/product-garrafa.jpg",
    category: "acessorios",
    active: true,
  },
  {
    name: "Tênis Running Elite",
    description: "Tênis de alta performance para corridas e competições. Solado EVA ultra leve com amortecimento reativo.",
    price_cents: 29990,
    stock: 25,
    image_url: "/product-shoe.jpg",
    category: "equipamentos",
    active: true,
  },
];

async function main() {
  console.log("🛍️  Iniciando seed de produtos...");

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name, deleted_at: null },
    });

    if (existing) {
      console.log(`⏩  Produto já existe: ${product.name}`);
      continue;
    }

    await prisma.product.create({ data: product });
    console.log(`✅  Criado: ${product.name}`);
  }

  console.log("✨  Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
