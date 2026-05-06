import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Em desenvolvimento: VITE_API_URL vazio → URLs relativas → proxy Vite → localhost:3333
// Em produção: VITE_API_URL com a URL completa do backend
const API_BASE: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

/**
 * Converte URLs relativas de mídia (ex: "/uploads/covers/img.jpg")
 * para URLs absolutas apontando para o servidor da API.
 * URLs já absolutas (http/https) passam sem modificação.
 */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
