// Sanitização simples de HTML — remove tags e scripts antes de persistir.
// Para campos livres como description e rules nos eventos.

const STRIP_TAGS = /<[^>]*>/g;
const STRIP_SCRIPT = /<script[\s\S]*?<\/script>/gi;
const STRIP_EVENT_ATTRS = /\s+on\w+="[^"]*"/gi;

export function sanitizeHtml(input: string): string {
  return input
    .replace(STRIP_SCRIPT, "")
    .replace(STRIP_EVENT_ATTRS, "")
    .replace(STRIP_TAGS, "")
    .trim();
}
