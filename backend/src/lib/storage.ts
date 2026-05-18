import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "./env";

// Storage é opcional em dev. O cliente só é criado quando as variáveis estão presentes.
const isStorageConfigured =
  !!env.STORAGE_ENDPOINT &&
  !!env.STORAGE_ACCESS_KEY_ID &&
  !!env.STORAGE_SECRET_ACCESS_KEY &&
  !!env.STORAGE_BUCKET &&
  !!env.STORAGE_PUBLIC_URL;

const s3 = isStorageConfigured
  ? new S3Client({
      region: env.STORAGE_REGION,
      endpoint: env.STORAGE_ENDPOINT!,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY_ID!,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY!,
      },
    })
  : null;

/**
 * Faz upload de um buffer para o Supabase Storage (S3-compatible).
 * Retorna a URL pública permanente do arquivo.
 *
 * Em dev sem as variáveis STORAGE_*, lança erro explicativo em vez de travar
 * na inicialização — uploads de imagem/arquivo ficam indisponíveis localmente.
 *
 * @param folder  Subpasta dentro do bucket (ex: "covers", "rules", "avatars")
 * @param filename Nome do arquivo com extensão (ex: "uuid.pdf")
 * @param buffer  Conteúdo do arquivo em memória
 * @param contentType MIME type (ex: "application/pdf", "image/jpeg")
 */
export async function uploadFile(
  folder: string,
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (!s3 || !isStorageConfigured) {
    throw new Error(
      "Storage não configurado. Adicione as variáveis STORAGE_* no .env para habilitar uploads.",
    );
  }

  const key = `${folder}/${filename}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.STORAGE_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  // URL pública: <supabase-url>/storage/v1/object/public/<bucket>/<key>
  return `${env.STORAGE_PUBLIC_URL!}/${key}`;
}
