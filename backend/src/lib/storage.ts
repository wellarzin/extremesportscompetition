import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "./env";

const s3 = new S3Client({
  region: env.STORAGE_REGION,
  endpoint: env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
  },
});

/**
 * Faz upload de um buffer para o Supabase Storage (S3-compatible).
 * Retorna a URL pública permanente do arquivo.
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
  const key = `${folder}/${filename}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  // URL pública: <supabase-url>/storage/v1/object/public/<bucket>/<key>
  return `${env.STORAGE_PUBLIC_URL}/${key}`;
}
